/**
 * 파일명: BoardPage.jsx
 * 역할: UI/UX 고도화 (커스텀 모달창 적용 및 로딩 애니메이션 추가)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal'; // ★ 새로 만든 모달 컴포넌트 불러오기
import './BoardPage.css';

const BoardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // === [UX 추가] 서버 통신 중임을 알리는 로딩 상태 ===
  const [isLoading, setIsLoading] = useState(false);

  // === [UX 추가] 커스텀 모달 제어를 위한 상태 ===
  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }, onCancel: () => { }
  });

  // 모달을 쉽게 띄우기 위한 도우미 함수 (Alert용)
  const showAlert = (title, message) => {
    setModal({
      isOpen: true, type: 'alert', title, message,
      onConfirm: () => setModal({ ...modal, isOpen: false })
    });
  };

  // 모달을 쉽게 띄우기 위한 도우미 함수 (Confirm용)
  const showConfirm = (title, message, onConfirmCallback) => {
    setModal({
      isOpen: true, type: 'confirm', title, message,
      onConfirm: () => {
        setModal({ ...modal, isOpen: false }); // 모달 닫기
        onConfirmCallback(); // 전달받은 실제 실행 함수(예: 삭제) 작동
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  useEffect(() => {
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (!storedUserData) {
      alert('로그인이 필요합니다.'); // 최초 로그인 튕김은 구조상 기본 alert 사용
      navigate('/login');
    } else {
      setCurrentUser(JSON.parse(storedUserData));
      fetchPosts();
    }
  }, [navigate]);

  const fetchPosts = async () => {
    setIsLoading(true); // 로딩 시작
    try {
      const response = await fetch('http://localhost:5000/api/posts');
      const data = await response.json();
      if (data.success) setPosts(data.posts);
    } catch (error) {
      showAlert('오류', '게시글 불러오기 실패');
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showAlert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }
    const newPostData = { title: newTitle, author: currentUser.name, date: new Date().toISOString().split('T')[0], content: newContent };
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPostData)
      });
      const data = await response.json();
      if (data.success) {
        showAlert('완료', data.message);
        setNewTitle(''); setNewContent(''); setIsWriting(false);
        fetchPosts();
      }
    } catch (error) {
      showAlert('네트워크 오류', '게시글 등록 중 서버와 연결할 수 없습니다.');
    }
  };

  // 삭제 로직 (기본 confirm 대신 커스텀 showConfirm 사용)
  const handleDeletePost = (postId) => {
    showConfirm('게시글 삭제', '정말 이 게시글을 삭제하시겠습니까? 복구할 수 없습니다.', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          showAlert('삭제 완료', data.message);
          setSelectedPost(null);
          fetchPosts();
        }
      } catch (error) {
        showAlert('네트워크 오류', '서버와 연결할 수 없습니다.');
      }
    });
  };

  const startEditing = () => {
    setEditTitle(selectedPost.title); setEditContent(selectedPost.content); setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      showAlert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${selectedPost.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle, content: editContent })
      });
      const data = await response.json();
      if (data.success) {
        showAlert('수정 완료', data.message);
        setIsEditing(false);
        setSelectedPost({ ...selectedPost, title: editTitle, content: editContent });
        fetchPosts();
      }
    } catch (error) {
      showAlert('네트워크 오류', '서버와 연결할 수 없습니다.');
    }
  };

  if (!currentUser) return <div>권한 확인 중...</div>;

  return (
    <div className="board-container">
      {/* 1. 커스텀 모달 컴포넌트 마운트 (평소엔 투명하게 숨어있음) */}
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />

      {/* 사이드바 생략됨 (기존과 동일) */}
      <aside className="sidebar">
        <div className="sidebar-header"><h2>SecureTech</h2><p>Intranet System</p></div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li onClick={() => navigate('/notice')}>공지사항</li>
          <li className="active" onClick={() => { setIsWriting(false); setIsEditing(false); setSelectedPost(null); }}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {currentUser.role === '관리자' && (
            <li onClick={() => navigate('/admin/approval')}>회원 관리 (관리자용)</li>
          )}
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header">
          <h2>사내 게시판</h2>
          <div className="user-info">
            <span className="user-name"><strong>{currentUser.name}</strong> 님</span>
            <button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button>
          </div>
        </header>

        <section className="board-content">
          {/* 2. 로딩 중일 때 보여줄 스피너 애니메이션 추가 */}
          {isLoading ? (
            <div className="loading-spinner-container">
              <div className="spinner"></div>
              <p>데이터를 불러오는 중입니다...</p>
            </div>
          ) : isEditing ? (
            <div className="board-write-view">
              <h3>게시글 수정</h3>
              <form onSubmit={handleEditSubmit} className="write-form">
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="write-title-input" />
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="write-content-input" rows="10" />
                <div className="write-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>수정 취소</button>
                  <button type="submit" className="submit-btn">수정 완료</button>
                </div>
              </form>
            </div>
          ) : isWriting ? (
            <div className="board-write-view">
              <h3>새 게시글 작성</h3>
              <form onSubmit={handlePostSubmit} className="write-form">
                <input type="text" placeholder="제목을 입력하세요" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="write-title-input" />
                <textarea placeholder="내용을 입력하세요..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="write-content-input" rows="10" />
                <div className="write-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsWriting(false)}>취소</button>
                  <button type="submit" className="submit-btn">등록하기</button>
                </div>
              </form>
            </div>
          ) : selectedPost ? (
            <div className="board-detail-view">
              <div className="detail-header">
                <h3>{selectedPost.title}</h3>
                <div className="detail-meta">
                  <span>작성자: <strong>{selectedPost.author}</strong></span><span>작성일: {selectedPost.date}</span>
                </div>
              </div>
              <div className="detail-body">
                {selectedPost.content.split('\n').map((line, idx) => (<span key={idx}>{line}<br /></span>))}
              </div>
              <div className="detail-actions">
                <button className="back-btn" onClick={() => setSelectedPost(null)}>← 목록으로 돌아가기</button>
                {(currentUser.name === selectedPost.author || currentUser.role === '관리자') && (
                  <>
                    <button className="edit-btn" onClick={startEditing}>수정하기</button>
                    <button className="delete-btn" onClick={() => handleDeletePost(selectedPost.id)}>삭제하기</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="board-list-view">
              <div className="board-actions">
                <button className="write-btn" onClick={() => setIsWriting(true)}>+ 새 글 작성</button>
              </div>
              <table className="board-table">
                <thead><tr><th width="10%">번호</th><th width="50%">제목</th><th width="20%">작성자</th><th width="20%">작성일</th></tr></thead>
                <tbody>
                  {posts.length === 0 ? (<tr><td colSpan="4" className="empty-msg">등록된 게시글이 없습니다.</td></tr>) : (
                    posts.map((post, index) => (
                      <tr key={post.id}>
                        <td>{posts.length - index}</td>
                        <td className="post-title" onClick={() => setSelectedPost(post)}>{post.title}</td>
                        <td>{post.author}</td><td>{post.date}</td>
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
