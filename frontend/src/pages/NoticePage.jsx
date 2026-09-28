import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './BoardPage.css'; // 디자인 통일성을 위해 게시판 CSS를 그대로 사용합니다.

const NoticePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

  // 공지사항 전용 폼
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }, onCancel: () => { } });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal({ ...modal, isOpen: false }) });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, type: 'confirm', title, message, onConfirm: () => { setModal({ ...modal, isOpen: false }); onConfirmCallback(); }, onCancel: () => setModal({ ...modal, isOpen: false }) });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) { navigate('/login'); } else { setCurrentUser(user); fetchNotices(); }
  }, [navigate]);

  const fetchNotices = async () => {
    const res = await fetch('http://localhost:5000/api/notices');
    const data = await res.json();
    if (data.success) {
      // 중요한 공지(isImportant)가 항상 배열 맨 위에 오도록 정렬합니다.
      const sorted = data.notices.sort((a, b) => (b.isImportant === a.isImportant) ? 0 : b.isImportant ? 1 : -1);
      setNotices(sorted);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/notices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent, author: currentUser.name, date: new Date().toISOString().split('T')[0], isImportant })
    });
    const data = await res.json();
    if (data.success) { showAlert('완료', data.message); setIsWriting(false); setNewTitle(''); setNewContent(''); setIsImportant(false); fetchNotices(); }
  };

  const handleDelete = (id) => {
    showConfirm('공지 삭제', '공지사항을 삭제하시겠습니까?', async () => {
      await fetch(`http://localhost:5000/api/notices/${id}`, { method: 'DELETE' });
      showAlert('삭제 완료', '삭제되었습니다.'); setSelectedNotice(null); fetchNotices();
    });
  };

  if (!currentUser) return null;
  const isAdmin = currentUser.role === '관리자';

  return (
    <div className="board-container">
      <CustomModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />

      <aside className="sidebar">
        <div className="sidebar-header"><h2>SecureTech</h2><p>Intranet System</p></div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li className="active" onClick={() => { setIsWriting(false); setSelectedNotice(null); }}>공지사항</li>
          <li onClick={() => navigate('/board')}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {isAdmin && <li onClick={() => navigate('/admin/approval')}>회원 관리</li>}
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header">
          <h2>전사 공지사항</h2>
          <div className="user-info"><span className="user-name"><strong>{currentUser.name}</strong> 님</span><button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button></div>
        </header>

        <section className="board-content">
          {isWriting ? (
            <div className="board-write-view">
              <h3>새 공지사항 작성</h3>
              <form onSubmit={handleSubmit} className="write-form">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input type="checkbox" id="important" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} style={{ transform: 'scale(1.5)' }} />
                  <label htmlFor="important" style={{ color: '#e74c3c', fontWeight: 'bold' }}>중요 (상단 고정)</label>
                </div>
                <input type="text" placeholder="제목" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="write-title-input" required />
                <textarea placeholder="내용" value={newContent} onChange={(e) => setNewContent(e.target.value)} className="write-content-input" rows="10" required />
                <div className="write-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsWriting(false)}>취소</button>
                  <button type="submit" className="submit-btn">공지 등록</button>
                </div>
              </form>
            </div>
          ) : selectedNotice ? (
            <div className="board-detail-view">
              <div className="detail-header">
                <h3>{selectedNotice.isImportant && <span style={{ color: '#e74c3c', marginRight: '10px' }}>[필독]</span>}{selectedNotice.title}</h3>
                <div className="detail-meta"><span>작성자: <strong>{selectedNotice.author}</strong></span><span>작성일: {selectedNotice.date}</span></div>
              </div>
              <div className="detail-body">{selectedNotice.content.split('\n').map((line, idx) => (<span key={idx}>{line}<br /></span>))}</div>
              <div className="detail-actions">
                <button className="back-btn" onClick={() => setSelectedNotice(null)}>← 목록으로</button>
                {isAdmin && <button className="delete-btn" onClick={() => handleDelete(selectedNotice.id)}>삭제하기</button>}
              </div>
            </div>
          ) : (
            <div className="board-list-view">
              {/* 관리자에게만 글쓰기 버튼 노출 */}
              {isAdmin && <div className="board-actions"><button className="write-btn" onClick={() => setIsWriting(true)}>+ 공지 등록</button></div>}
              <table className="board-table">
                <thead><tr><th width="10%">상태</th><th width="50%">제목</th><th width="20%">작성부서</th><th width="20%">등록일</th></tr></thead>
                <tbody>
                  {notices.map((notice) => (
                    <tr key={notice.id} style={notice.isImportant ? { backgroundColor: '#fff5f5' } : {}}>
                      <td style={{ color: notice.isImportant ? '#e74c3c' : '#7f8c8d', fontWeight: 'bold' }}>{notice.isImportant ? '중요' : '일반'}</td>
                      <td className="post-title" onClick={() => setSelectedNotice(notice)} style={{ fontWeight: notice.isImportant ? 'bold' : 'normal' }}>{notice.title}</td>
                      <td>{notice.author}</td><td>{notice.date}</td>
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

export default NoticePage;
