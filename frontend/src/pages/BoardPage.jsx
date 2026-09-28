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
      if (data.success) setPosts(data.posts);
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
        body: JSON.stringify({ title: newTitle, author: currentUser.name, date: new Date().toISOString().split('T')[0], content: newContent })
      });
      const data = await res.json();
      if (data.success) { showAlert('완료', data.message); setNewTitle(''); setNewContent(''); setIsWriting(false); setShowPreview(false); fetchPosts(); }
    } catch (error) { showAlert('네트워크 오류', '서버 연결 실패'); }
  };

  const handleDeletePost = (postId) => {
    showConfirm('게시글 삭제', '정말 삭제하시겠습니까?', async () => {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showAlert('삭제 완료', data.message); setSelectedPost(null); fetchPosts(); }
    });
  };

  const startEditing = () => { setEditTitle(selectedPost.title); setEditContent(selectedPost.content); setIsEditing(true); setShowPreview(false); };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) { showAlert('입력 오류', '모두 입력해주세요.'); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${selectedPost.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });
      const data = await res.json();
      if (data.success) { showAlert('수정 완료', data.message); setIsEditing(false); setShowPreview(false); setSelectedPost({ ...selectedPost, title: editTitle, content: editContent }); fetchPosts(); }
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

  return (
    <div className="board-container">
      <CustomModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />

      <aside className="sidebar">
        <div className="sidebar-header"><h2>SecureTech</h2><p>Intranet System</p></div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li onClick={() => navigate('/notice')}>공지사항</li>
          <li className="active" onClick={() => { setIsWriting(false); setIsEditing(false); setSelectedPost(null); setShowPreview(false); }}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {currentUser.role === '관리자' && (<li onClick={() => navigate('/admin/approval')}>회원 관리</li>)}
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header">
          <h2>사내 게시판</h2>
          <div className="user-info"><span className="user-name"><strong>{currentUser.name}</strong> 님</span><button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button></div>
        </header>

        <section className="board-content">
          {isLoading ? (<div className="loading-spinner-container"><div className="spinner"></div><p>불러오는 중...</p></div>)

            : isEditing || isWriting ? (
              <div className="board-write-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3>{isEditing ? '게시글 수정' : '새 게시글 작성'}</h3>
                  <button type="button" className="preview-btn" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? '에디터로 돌아가기' : '👁️ 실제 화면 미리보기'}
                  </button>
                </div>

                <form onSubmit={isEditing ? handleEditSubmit : handlePostSubmit} className="write-form">
                  {!showPreview && (
                    <input type="text" placeholder="제목을 입력하세요"
                      value={isEditing ? editTitle : newTitle}
                      onChange={(e) => isEditing ? setEditTitle(e.target.value) : setNewTitle(e.target.value)}
                      className="write-title-input"
                    />
                  )}

                  {/* ★ 미리보기 시 실제 게시판 상세화면(board-detail-view) 틀을 그대로 적용 */}
                  {showPreview ? (
                    <div className="board-detail-view" style={{ border: '2px dashed #3498db', marginTop: '10px' }}>
                      <div className="detail-header">
                        <h3>{isEditing ? editTitle : newTitle || '제목이 없습니다'} <span style={{ fontSize: '14px', color: '#e74c3c' }}>(미리보기)</span></h3>
                        <div className="detail-meta">
                          <span>작성자: <strong>{currentUser.name}</strong></span>
                          <span>작성일: {new Date().toISOString().split('T')[0]}</span>
                        </div>
                      </div>
                      <div className="detail-body ql-editor" dangerouslySetInnerHTML={{ __html: isEditing ? editContent : newContent }}></div>
                    </div>
                  ) : (
                    <div className="editor-container">
                      <ReactQuill
                        theme="snow" modules={quillModules}
                        value={isEditing ? editContent : newContent}
                        onChange={isEditing ? setEditContent : setNewContent}
                        placeholder="내용을 화려하게 꾸며보세요!"
                      />
                    </div>
                  )}

                  <div className="write-actions" style={{ marginTop: '20px' }}>
                    <button type="button" className="cancel-btn" onClick={() => { isEditing ? setIsEditing(false) : setIsWriting(false); setShowPreview(false); }}>취소</button>
                    <button type="submit" className="submit-btn">{isEditing ? '수정 완료' : '등록하기'}</button>
                  </div>
                </form>
              </div>

            ) : selectedPost ? (
              <div className="board-detail-view">
                <div className="detail-header">
                  <h3>{selectedPost.title}</h3>
                  <div className="detail-meta"><span>작성자: <strong>{selectedPost.author}</strong></span><span>작성일: {selectedPost.date}</span></div>
                </div>
                <div className="detail-body ql-editor" dangerouslySetInnerHTML={{ __html: selectedPost.content }}></div>
                <div className="detail-actions">
                  <button className="back-btn" onClick={() => setSelectedPost(null)}>← 목록으로</button>
                  {(currentUser.name === selectedPost.author || currentUser.role === '관리자') && (
                    <><button className="edit-btn" onClick={startEditing}>수정하기</button><button className="delete-btn" onClick={() => handleDeletePost(selectedPost.id)}>삭제하기</button></>
                  )}
                </div>
              </div>
            ) : (
              <div className="board-list-view">
                <div className="board-actions"><button className="write-btn" onClick={() => setIsWriting(true)}>+ 새 글 작성</button></div>
                <table className="board-table">
                  <thead><tr><th width="10%">번호</th><th width="50%">제목</th><th width="20%">작성자</th><th width="20%">작성일</th></tr></thead>
                  <tbody>
                    {posts.length === 0 ? (<tr><td colSpan="4" className="empty-msg">등록된 게시글이 없습니다.</td></tr>) : (
                      posts.map((post, index) => (
                        <tr key={post.id}><td>{posts.length - index}</td><td className="post-title" onClick={() => setSelectedPost(post)}>{post.title}</td><td>{post.author}</td><td>{post.date}</td></tr>
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
