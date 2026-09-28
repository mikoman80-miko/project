import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './ApprovalPage.css';
import './BoardPage.css';

const ApprovalPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [approvals, setApprovals] = useState([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [docType, setDocType] = useState('기안서');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');

  const [showPreview, setShowPreview] = useState(false);
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

  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim() || docContent === '<p><br></p>') {
      showAlert('입력 오류', '문서 제목과 상세 사유를 모두 입력해주세요.'); return;
    }
    const res = await fetch('http://localhost:5000/api/approvals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: docType, title: docTitle, content: docContent, drafter: currentUser.name, department: currentUser.department, date: new Date().toISOString().split('T')[0] })
    });
    const data = await res.json();
    if (data.success) {
      showAlert('상신 완료', data.message);
      setIsDrafting(false); setShowPreview(false); setDocTitle(''); setDocContent(''); fetchApprovals();
    }
  };

  const handleProcess = (id, status) => {
    showConfirm('결재 처리', `이 문서를 [${status}] 처리하시겠습니까?`, async () => {
      const res = await fetch(`http://localhost:5000/api/approvals/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approver: currentUser.name, approveDate: new Date().toISOString().split('T')[0] })
      });
      const data = await res.json();
      if (data.success) { showAlert('처리 완료', data.message); setSelectedDoc(null); fetchApprovals(); }
    });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  if (!currentUser) return null;
  // 백엔드 데이터에 맞춰 '관리자' 혹은 'ADMIN' 인지 확인
  const isAdmin = currentUser.role === '관리자' || currentUser.role === 'ADMIN';
  const myDrafts = approvals.filter(a => a.drafter === currentUser.name);
  const pendingDocs = approvals.filter(a => a.status === '대기');

  const getStatusBadge = (status) => {
    if (status === '대기') return <span className="badge badge-pending">결재대기</span>;
    if (status === '승인') return <span className="badge badge-approved">승인완료</span>;
    if (status === '반려') return <span className="badge badge-rejected">반려됨</span>;
  };

  return (
    <div className="board-container">
      <CustomModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />

      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2>SecureTech</h2><p>Groupware System</p>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li onClick={() => navigate('/notice')}>공지사항</li>
          <li onClick={() => navigate('/board')}>사내 게시판</li>
          <li className="active" onClick={() => { setIsDrafting(false); setSelectedDoc(null); setShowPreview(false); }}>전자결재</li>
          {isAdmin && <li onClick={() => navigate('/admin/approval')}>인사/계정 관리</li>}
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0 }}>전자결재 시스템</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="user-info" onClick={() => navigate('/mypage')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              <span className="user-name"><strong>{currentUser.name}</strong> 님</span>
            </div>
            <button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button>
          </div>
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
              {/* 5번 반영: '상신 취소(목록으로)' 버튼을 작성 폼 상단 우측으로 이동 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>새 결재 문서 기안</h3>
                <div>
                  <button type="button" className="preview-btn" onClick={() => setShowPreview(!showPreview)} style={{ marginRight: '10px' }}>
                    {showPreview ? '에디터로 돌아가기' : '👁️ 실제 문서 미리보기'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => { setIsDrafting(false); setShowPreview(false); }} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    ← 상신 취소
                  </button>
                </div>
              </div>

              <form onSubmit={handleDraftSubmit} className="write-form">
                {!showPreview && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <select className="write-title-input" value={docType} onChange={(e) => setDocType(e.target.value)} style={{ width: '200px' }}>
                      <option value="기안서">일반 기안서</option><option value="휴가신청서">휴가 신청서</option><option value="지출결의서">지출 결의서</option>
                    </select>
                    <input type="text" placeholder="문서 제목" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="write-title-input" required style={{ flex: 1 }} />
                  </div>
                )}

                {showPreview ? (
                  <div className="approval-doc-view" style={{ border: '2px dashed #3498db', padding: '20px', marginTop: '10px' }}>
                    <div className="doc-paper" style={{ marginBottom: '0' }}>
                      <h2 className="doc-title">{docType} <span style={{ fontSize: '16px', color: '#e74c3c' }}>(미리보기)</span></h2>
                      <table className="doc-info-table">
                        <tbody>
                          <tr><th>기안자</th><td>{currentUser.name} ({currentUser.department})</td><th>기안일</th><td>{new Date().toISOString().split('T')[0]}</td></tr>
                          <tr><th>문서제목</th><td colSpan="3">{docTitle || '제목을 입력해주세요'}</td></tr>
                          <tr><th>결재상태</th><td colSpan="3">{getStatusBadge('대기')}</td></tr>
                        </tbody>
                      </table>
                      <div className="doc-body ql-editor" dangerouslySetInnerHTML={{ __html: docContent }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="editor-container">
                    <ReactQuill
                      theme="snow" modules={quillModules}
                      value={docContent}
                      onChange={setDocContent}
                      placeholder="상세 사유 및 내용을 입력하세요. (표, 글꼴 색상 적용 가능)"
                      style={{ height: '350px', backgroundColor: 'white', marginBottom: '60px' }}
                    />
                  </div>
                )}

                <div className="write-actions" style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button type="submit" className="submit-btn" style={{ backgroundColor: '#2ecc71', padding: '10px 40px', fontSize: '16px' }}>결재 올리기</button>
                </div>
              </form>
            </div>
          ) : selectedDoc ? (
            <div className="approval-doc-view">
              {/* 5번 반영: '목록으로', '승인', '반려' 버튼 그룹을 상세 보기 상단 우측으로 이동 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>결재 문서 확인</h3>
                <div className="detail-actions" style={{ margin: 0, padding: 0, border: 'none', backgroundColor: 'transparent' }}>
                  <button className="back-btn" onClick={() => setSelectedDoc(null)} style={{ padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' }}>← 목록으로</button>
                  {isAdmin && selectedDoc.status === '대기' && (
                    <>
                      <button className="approve-btn" onClick={() => handleProcess(selectedDoc.id, '승인')} style={{ marginRight: '5px' }}>승인 결재</button>
                      <button className="reject-btn" onClick={() => handleProcess(selectedDoc.id, '반려')}>반려 처리</button>
                    </>
                  )}
                </div>
              </div>

              <div className="doc-paper">
                <h2 className="doc-title">{selectedDoc.type}</h2>
                <table className="doc-info-table">
                  <tbody>
                    <tr><th>기안자</th><td>{selectedDoc.drafter} ({selectedDoc.department})</td><th>기안일</th><td>{selectedDoc.date}</td></tr>
                    <tr><th>문서제목</th><td colSpan="3">{selectedDoc.title}</td></tr>
                    <tr><th>결재상태</th><td colSpan="3">{getStatusBadge(selectedDoc.status)} {selectedDoc.approver && `(결재자: ${selectedDoc.approver} / ${selectedDoc.approveDate})`}</td></tr>
                  </tbody>
                </table>
                <div className="doc-body ql-editor" dangerouslySetInnerHTML={{ __html: selectedDoc.content }} style={{ minHeight: '300px' }}></div>
              </div>
            </div>
          ) : (
            <div className="board-list-view">
              {activeTab === 'myDrafts' && (
                <div className="board-actions"><button className="write-btn" onClick={() => setIsDrafting(true)}>+ 기안서 작성</button></div>
              )}
              <table className="board-table">
                <thead><tr><th width="15%" style={{ textAlign: 'center' }}>상태</th><th width="15%" style={{ textAlign: 'center' }}>양식</th><th width="40%">문서 제목</th><th width="15%" style={{ textAlign: 'center' }}>기안자</th><th width="15%" style={{ textAlign: 'center' }}>상신일</th></tr></thead>
                <tbody>
                  {(activeTab === 'myDrafts' ? myDrafts : pendingDocs).length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>해당하는 문서가 없습니다.</td></tr>
                  ) : (
                    (activeTab === 'myDrafts' ? myDrafts : pendingDocs).map(doc => (
                      <tr key={doc.id}>
                        <td style={{ textAlign: 'center' }}>{getStatusBadge(doc.status)}</td>
                        <td style={{ textAlign: 'center' }}>{doc.type}</td>
                        <td className="post-title" onClick={() => setSelectedDoc(doc)} style={{ cursor: 'pointer' }}>{doc.title}</td>
                        <td style={{ textAlign: 'center' }}>{doc.drafter}</td>
                        <td style={{ textAlign: 'center' }}>{doc.date}</td>
                      </tr>
                    ))
                  )}
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
