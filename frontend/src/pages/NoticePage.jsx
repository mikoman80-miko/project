import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
// 4번 반영: React Quill 에디터 및 스타일시트 임포트
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './BoardPage.css';

const NoticePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

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
  // 12번 반영: 백엔드 DB 권한 체계에 맞춰 관리자인지 검증 (ADMIN 등 영문일 경우 수정 필요)
  const isAdmin = currentUser.role === '관리자' || currentUser.role === 'ADMIN';

  // React Quill 툴바 옵션 설정
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }, { 'font': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
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
          <li className="active" onClick={() => { setIsWriting(false); setSelectedNotice(null); }}>공지사항</li>
          <li onClick={() => navigate('/board')}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {isAdmin && <li onClick={() => navigate('/admin/approval')}>인사/계정 관리</li>}
        </ul>
      </aside>

      <main className="board-main">
        {/* 양끝 정렬(space-between)을 사용하여 제목은 좌측, 유저 정보는 우측 끝으로 배치 */}
        <header className="board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0 }}>전사 공지사항</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="user-info" onClick={() => navigate('/mypage')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              <span className="user-name"><strong>{currentUser.name}</strong> 님</span>
            </div>
            <button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button>
          </div>
        </header>

        <section className="board-content">
          {isWriting ? (
            <div className="board-write-view">
              {/* 5번 반영: 작성 폼에서도 취소(목록으로) 버튼을 우측 상단으로 이동 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>새 공지사항 작성</h3>
                <button type="button" className="cancel-btn" onClick={() => setIsWriting(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>← 취소 및 목록으로</button>
              </div>

              <form onSubmit={handleSubmit} className="write-form">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <input type="checkbox" id="important" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} style={{ transform: 'scale(1.5)' }} />
                  <label htmlFor="important" style={{ color: '#e74c3c', fontWeight: 'bold' }}>중요 (상단 고정)</label>
                </div>

                <input type="text" placeholder="제목" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="write-title-input" style={{ width: '100%', marginBottom: '15px', padding: '10px' }} required />

                {/* 4번 반영: textarea 대신 React Quill 에디터 적용 */}
                <div style={{ marginBottom: '60px' }}>
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={newContent}
                    onChange={setNewContent}
                    style={{ height: '400px', backgroundColor: 'white' }}
                  />
                </div>

                <div className="write-actions" style={{ textAlign: 'center' }}>
                  <button type="submit" className="submit-btn" style={{ padding: '10px 40px', fontSize: '16px' }}>공지 등록</button>
                </div>
              </form>
            </div>
          ) : selectedNotice ? (
            <div className="board-detail-view">
              {/* 5번 반영: 게시글 확인 화면에서 목록 버튼을 최상단 우측으로 이동 */}
              <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #34495e', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>
                    {selectedNotice.isImportant && <span style={{ color: '#e74c3c', marginRight: '10px' }}>[필독]</span>}
                    {selectedNotice.title}
                  </h3>
                  <div className="detail-meta" style={{ color: '#7f8c8d' }}>
                    <span style={{ marginRight: '15px' }}>작성자: <strong>{selectedNotice.author}</strong></span>
                    <span>작성일: {selectedNotice.date}</span>
                  </div>
                </div>
                <button className="back-btn" onClick={() => setSelectedNotice(null)} style={{ padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>← 목록으로</button>
              </div>

              {/* 4번 반영: 에디터로 작성된 HTML 코드를 그대로 렌더링 (dangerouslySetInnerHTML) */}
              <div
                className="detail-body ql-editor"
                dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
                style={{ minHeight: '300px', padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}
              />

              <div className="detail-actions" style={{ marginTop: '20px', textAlign: 'right' }}>
                {/* 12번 반영: 삭제 버튼은 관리자(isAdmin)에게만 렌더링됨 */}
                {isAdmin && <button className="delete-btn" onClick={() => handleDelete(selectedNotice.id)}>삭제하기</button>}
              </div>
            </div>
          ) : (
            <div className="board-list-view">
              {/* 12번 반영: 공지사항 글쓰기 버튼은 관리자(isAdmin)에게만 노출됨 */}
              {isAdmin && <div className="board-actions"><button className="write-btn" onClick={() => setIsWriting(true)}>+ 공지 등록</button></div>}

              <table className="board-table">
                <thead><tr><th width="10%">상태</th><th width="50%">제목</th><th width="20%">작성자</th><th width="20%">등록일</th></tr></thead>
                <tbody>
                  {notices.map((notice) => (
                    <tr key={notice.id} style={notice.isImportant ? { backgroundColor: '#fff5f5' } : {}}>
                      <td style={{ color: notice.isImportant ? '#e74c3c' : '#7f8c8d', fontWeight: 'bold', textAlign: 'center' }}>{notice.isImportant ? '중요' : '일반'}</td>
                      <td className="post-title" onClick={() => setSelectedNotice(notice)} style={{ fontWeight: notice.isImportant ? 'bold' : 'normal', cursor: 'pointer' }}>{notice.title}</td>
                      <td style={{ textAlign: 'center' }}>{notice.author}</td>
                      <td style={{ textAlign: 'center' }}>{notice.date}</td>
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
