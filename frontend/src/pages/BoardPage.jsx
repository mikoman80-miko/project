import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './BoardPage.css';

const BoardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 6번 반영: 사내게시판 '중요' 체크 상태 추가
  const [isImportant, setIsImportant] = useState(false);
  const [editIsImportant, setEditIsImportant] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }, onCancel: () => { } });

  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal({ ...modal, isOpen: false }) });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, type: 'confirm', title, message, onConfirm: () => { setModal({ ...modal, isOpen: false }); onConfirmCallback(); }, onCancel: () => setModal({ ...modal, isOpen: false }) });

  useEffect(() => {
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (!storedUserData) { navigate('/login'); }
    else { setCurrentUser(JSON.parse(storedUserData)); fetchPosts(); }
  }, [navigate]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/posts');
      const data = await response.json();
      if (data.success) {
        // 6번 반영: '중요' 글이 항상 위로 오도록 정렬
        const sorted = data.posts.sort((a, b) => (b.isImportant === a.isImportant) ? 0 : b.isImportant ? 1 : -1);
        setPosts(sorted);
      }
    } catch (error) { console.error('불러오기 실패'); } finally { setIsLoading(false); }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || newContent === '<p><br></p>') {
      showAlert('입력 오류', '제목과 내용을 모두 입력해주세요.'); return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // 6번 반영: isImportant 데이터 추가 전송
        body: JSON.stringify({ title: newTitle, author: currentUser.name, date: new Date().toISOString().split('T')[0], content: newContent, isImportant })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('완료', data.message);
        setNewTitle('');
        setNewContent('');
        setIsImportant(false);
        setIsWriting(false);
        setShowPreview(false);
        fetchPosts();
      }
    } catch (error) { showAlert('네트워크 오류', '서버 연결 실패'); }
  };

  const handleDeletePost = (postId) => {
    showConfirm('게시글 삭제', '정말 삭제하시겠습니까?', async () => {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showAlert('삭제 완료', data.message); setSelectedPost(null); fetchPosts(); }
    });
  };

  const startEditing = () => {
    setEditTitle(selectedPost.title);
    setEditContent(selectedPost.content);
    setEditIsImportant(selectedPost.isImportant || false);
    setIsEditing(true);
    setShowPreview(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) { showAlert('입력 오류', '모두 입력해주세요.'); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${selectedPost.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent, isImportant: editIsImportant })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('수정 완료', data.message);
        setIsEditing(false);
        setShowPreview(false);
        setSelectedPost({ ...selectedPost, title: editTitle, content: editContent, isImportant: editIsImportant });
        fetchPosts();
      }
    } catch (error) { showAlert('오류', '서버 연결 실패'); }
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

  // 관리자 권한 확인 변수 (DB 역할 텍스트에 맞춰 확장)
  const isAdmin = currentUser.role === '관리자' || currentUser.role === 'ADMIN';

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
          <li className="active" onClick={() => { setIsWriting(false); setIsEditing(false); setSelectedPost(null); setShowPreview(false); }}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {isAdmin && (<li onClick={() => navigate('/admin/approval')}>인사/계정 관리</li>)}
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0 }}>사내 게시판</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="user-info" onClick={() => navigate('/mypage')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              <span className="user-name"><strong>{currentUser.name}</strong> 님</span>
            </div>
            <button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button>
          </div>
        </header>

        <section className="board-content">
          {isLoading ? (<div className="loading-spinner-container"><div className="spinner"></div><p>불러오는 중...</p></div>)
            : isEditing || isWriting ? (
              <div className="board-write-view">
                {/* 5번 반영: 작성 폼 상단 우측으로 [취소 및 목록으로] 버튼 이동 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>{isEditing ? '게시글 수정' : '새 게시글 작성'}</h3>
                  <div>
                    <button type="button" className="preview-btn" onClick={() => setShowPreview(!showPreview)} style={{ marginRight: '10px' }}>
                      {showPreview ? '에디터로 돌아가기' : '👁️ 실제 화면 미리보기'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => { isEditing ? setIsEditing(false) : setIsWriting(false); setShowPreview(false); }} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                      ← 취소 및 목록으로
                    </button>
                  </div>
                </div>

                <form onSubmit={isEditing ? handleEditSubmit : handlePostSubmit} className="write-form">
                  {/* 6번 반영: 사내게시판 중요 체크박스 추가 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <input type="checkbox" id="important" checked={isEditing ? editIsImportant : isImportant} onChange={(e) => isEditing ? setEditIsImportant(e.target.checked) : setIsImportant(e.target.checked)} style={{ transform: 'scale(1.5)' }} />
                    <label htmlFor="important" style={{ color: '#e74c3c', fontWeight: 'bold' }}>중요 (상단 고정)</label>
                  </div>

                  {!showPreview && (
                    <input type="text" placeholder="제목을 입력하세요"
                      value={isEditing ? editTitle : newTitle}
                      onChange={(e) => isEditing ? setEditTitle(e.target.value) : setNewTitle(e.target.value)}
                      className="write-title-input" style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                    />
                  )}

                  {showPreview ? (
                    <div className="board-detail-view" style={{ border: '2px dashed #3498db', marginTop: '10px', padding: '15px' }}>
                      <div className="detail-header" style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h3>
                          {(isEditing ? editIsImportant : isImportant) && <span style={{ color: '#e74c3c', marginRight: '10px' }}>[중요]</span>}
                          {isEditing ? editTitle : newTitle || '제목이 없습니다'}
                          <span style={{ fontSize: '14px', color: '#e74c3c', marginLeft: '10px' }}>(미리보기)</span>
                        </h3>
                        <div className="detail-meta">
                          <span style={{ marginRight: '15px' }}>작성자: <strong>{currentUser.name}</strong></span>
                          <span>작성일: {new Date().toISOString().split('T')[0]}</span>
                        </div>
                      </div>
                      <div className="detail-body ql-editor" dangerouslySetInnerHTML={{ __html: isEditing ? editContent : newContent }}></div>
                    </div>
                  ) : (
                    <div className="editor-container" style={{ marginBottom: '60px' }}>
                      <ReactQuill
                        theme="snow" modules={quillModules}
                        value={isEditing ? editContent : newContent}
                        onChange={isEditing ? setEditContent : setNewContent}
                        placeholder="내용을 화려하게 꾸며보세요!"
                        style={{ height: '350px', backgroundColor: 'white' }}
                      />
                    </div>
                  )}

                  <div className="write-actions" style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button type="submit" className="submit-btn" style={{ padding: '10px 40px', fontSize: '16px' }}>{isEditing ? '수정 완료' : '등록하기'}</button>
                  </div>
                </form>
              </div>

            ) : selectedPost ? (
              <div className="board-detail-view">
                {/* 5번 반영: 상세 화면 상단 우측으로 [목록으로] 버튼 이동 */}
                <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #34495e', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>
                      {selectedPost.isImportant && <span style={{ color: '#e74c3c', marginRight: '10px' }}>[중요]</span>}
                      {selectedPost.title}
                    </h3>
                    <div className="detail-meta" style={{ color: '#7f8c8d' }}>
                      <span style={{ marginRight: '15px' }}>작성자: <strong>{selectedPost.author}</strong></span>
                      <span>작성일: {selectedPost.date}</span>
                    </div>
                  </div>
                  <button className="back-btn" onClick={() => setSelectedPost(null)} style={{ padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>← 목록으로</button>
                </div>

                <div className="detail-body ql-editor" dangerouslySetInnerHTML={{ __html: selectedPost.content }} style={{ minHeight: '300px', padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}></div>

                <div className="detail-actions" style={{ marginTop: '20px', textAlign: 'right' }}>
                  {/* 6번, 12번 반영: 작성자 본인이거나 관리자인 경우에만 수정/삭제 버튼 노출 */}
                  {(currentUser.name === selectedPost.author || isAdmin) && (
                    <>
                      <button className="edit-btn" onClick={startEditing} style={{ marginRight: '10px' }}>수정하기</button>
                      <button className="delete-btn" onClick={() => handleDeletePost(selectedPost.id)}>삭제하기</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="board-list-view">
                <div className="board-actions"><button className="write-btn" onClick={() => setIsWriting(true)}>+ 새 글 작성</button></div>
                <table className="board-table">
                  {/* 6번 반영: 번호 컬럼을 '상태/번호'로 변경 */}
                  <thead><tr><th width="10%" style={{ textAlign: 'center' }}>상태/번호</th><th width="50%">제목</th><th width="20%" style={{ textAlign: 'center' }}>작성자</th><th width="20%" style={{ textAlign: 'center' }}>작성일</th></tr></thead>
                  <tbody>
                    {posts.length === 0 ? (<tr><td colSpan="4" className="empty-msg" style={{ textAlign: 'center', padding: '20px' }}>등록된 게시글이 없습니다.</td></tr>) : (
                      posts.map((post, index) => (
                        <tr key={post.id} style={post.isImportant ? { backgroundColor: '#fff5f5' } : {}}>
                          {/* 중요 체크시 '중요' 텍스트와 빨간색 표출, 아니면 기존처럼 역순 번호 표출 */}
                          <td style={{ textAlign: 'center', color: post.isImportant ? '#e74c3c' : 'inherit', fontWeight: post.isImportant ? 'bold' : 'normal' }}>
                            {post.isImportant ? '중요' : posts.length - index}
                          </td>
                          <td className="post-title" onClick={() => setSelectedPost(post)} style={{ fontWeight: post.isImportant ? 'bold' : 'normal', cursor: 'pointer' }}>
                            {post.title}
                          </td>
                          <td style={{ textAlign: 'center' }}>{post.author}</td>
                          <td style={{ textAlign: 'center' }}>{post.date}</td>
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

export default BoardPage;
