import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './ApprovalPage.css';
import './BoardPage.css'; // 사이드바, 공통 레이아웃 용도

const ApprovalPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [approvals, setApprovals] = useState([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // 기안 폼 상태
  const [docType, setDocType] = useState('기안서');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');

  // 탭 상태 (기안 상신함 vs 결재 수신함)
  const [activeTab, setActiveTab] = useState('myDrafts');

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }, onCancel: () => { } });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal({ ...modal, isOpen: false }) });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, type: 'confirm', title, message, onConfirm: () => { setModal({ ...modal, isOpen: false }); onConfirmCallback(); }, onCancel: () => setModal({ ...modal, isOpen: false }) });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) { navigate('/login'); } else { setCurrentUser(user); fetchApprovals(); }
  }, [navigate]);

  const fetchApprovals = async () => {
    const res = await fetch('http://localhost:5000/api/approvals');
    const data = await res.json();
    if (data.success) setApprovals(data.approvals);
  };

  // 문서 기안(작성) 상신
  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/approvals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: docType, title: docTitle, content: docContent, drafter: currentUser.name, department: currentUser.department, date: new Date().toISOString().split('T')[0] })
    });
    const data = await res.json();
    if (data.success) { showAlert('상신 완료', data.message); setIsDrafting(false); setDocTitle(''); setDocContent(''); fetchApprovals(); }
  };

  // 결재 처리 (승인/반려)
  const handleProcess = (id, status) => {
    showConfirm('결재 처리', `이 문서를 [${status}] 처리하시겠습니까?`, async () => {
      const res = await fetch(`http://localhost:5000/api/approvals/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approver: currentUser.name })
      });
      const data = await res.json();
      if (data.success) { showAlert('처리 완료', data.message); setSelectedDoc(null); fetchApprovals(); }
    });
  };

  if (!currentUser) return null;
  const isAdmin = currentUser.role === '관리자';

  // 내가 상신한 문서 필터링
  const myDrafts = approvals.filter(a => a.drafter === currentUser.name);
  // 결재 수신함 (관리자용: 대기중인 모든 문서)
  const pendingDocs = approvals.filter(a => a.status === '대기');

  // 상태에 따른 뱃지 색상
  const getStatusBadge = (status) => {
    if (status === '대기') return <span className="badge badge-pending">결재대기</span>;
    if (status === '승인') return <span className="badge badge-approved">승인완료</span>;
    if (status === '반려') return <span className="badge badge-rejected">반려됨</span>;
  };

  return (
    <div className="board-container">
      <CustomModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />

      <aside className="sidebar">
        <div className="sidebar-header"><h2>SecureTech</h2><p>Intranet System</p></div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li onClick={() => navigate('/notice')}>공지사항</li>
          <li onClick={() => navigate('/board')}>사내 게시판</li>
          <li className="active" onClick={() => { setIsDrafting(false); setSelectedDoc(null); }}>전자결재</li>
          {isAdmin && <li onClick={() => navigate('/admin/approval')}>회원 관리</li>}
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header">
          <h2>전자결재 시스템</h2>
          <div className="user-info"><span className="user-name"><strong>{currentUser.name}</strong> 님</span><button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button></div>
        </header>

        <section className="board-content">
          {!isDrafting && !selectedDoc && (
            <div className="approval-tabs">
              <button className={`tab-btn ${activeTab === 'myDrafts' ? 'active' : ''}`} onClick={() => setActiveTab('myDrafts')}>기안 상신함 (내 문서)</button>
              {isAdmin && (
                <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>결재 수신함 (대기 {pendingDocs.length}건)</button>
              )}
            </div>
          )}

          {isDrafting ? (
            <div className="board-write-view">
              <h3>새 결재 문서 기안</h3>
              <form onSubmit={handleDraftSubmit} className="write-form">
                <select className="write-title-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="기안서">일반 기안서</option><option value="휴가신청서">휴가 신청서</option><option value="지출결의서">지출 결의서</option>
                </select>
                <input type="text" placeholder="문서 제목" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="write-title-input" required />
                <textarea placeholder="상세 사유 및 내용 입력..." value={docContent} onChange={(e) => setDocContent(e.target.value)} className="write-content-input" rows="10" required />
                <div className="write-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsDrafting(false)}>상신 취소</button>
                  <button type="submit" className="submit-btn" style={{ backgroundColor: '#2ecc71' }}>결재 올리기</button>
                </div>
              </form>
            </div>
          ) : selectedDoc ? (
            <div className="approval-doc-view">
              <div className="doc-paper">
                <h2 className="doc-title">{selectedDoc.type}</h2>
                <table className="doc-info-table">
                  <tbody>
                    <tr><th>기안자</th><td>{selectedDoc.drafter} ({selectedDoc.department})</td><th>기안일</th><td>{selectedDoc.date}</td></tr>
                    <tr><th>문서제목</th><td colSpan="3">{selectedDoc.title}</td></tr>
                    <tr><th>결재상태</th><td colSpan="3">{getStatusBadge(selectedDoc.status)} {selectedDoc.approver && `(결재자: ${selectedDoc.approver} / ${selectedDoc.approveDate})`}</td></tr>
                  </tbody>
                </table>
                <div className="doc-body">{selectedDoc.content.split('\n').map((line, idx) => (<span key={idx}>{line}<br /></span>))}</div>
              </div>

              <div className="detail-actions">
                <button className="back-btn" onClick={() => setSelectedDoc(null)}>← 목록으로</button>
                {/* 관리자이면서 문서가 '대기' 상태일 때만 결재 버튼 노출 */}
                {isAdmin && selectedDoc.status === '대기' && (
                  <>
                    <button className="approve-btn" onClick={() => handleProcess(selectedDoc.id, '승인')}>승인 결재</button>
                    <button className="reject-btn" onClick={() => handleProcess(selectedDoc.id, '반려')}>반려 처리</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="board-list-view">
              {activeTab === 'myDrafts' && (
                <div className="board-actions"><button className="write-btn" onClick={() => setIsDrafting(true)}>+ 기안서 작성</button></div>
              )}
              <table className="board-table">
                <thead><tr><th width="15%">상태</th><th width="15%">양식</th><th width="40%">문서 제목</th><th width="15%">기안자</th><th width="15%">상신일</th></tr></thead>
                <tbody>
                  {(activeTab === 'myDrafts' ? myDrafts : pendingDocs).map(doc => (
                    <tr key={doc.id}>
                      <td>{getStatusBadge(doc.status)}</td><td>{doc.type}</td>
                      <td className="post-title" onClick={() => setSelectedDoc(doc)}>{doc.title}</td>
                      <td>{doc.drafter}</td><td>{doc.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ApprovalPage;
