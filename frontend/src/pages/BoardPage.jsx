/**
 * 파일명: BoardPage.jsx
 * 역할: 사내 게시판 화면 (조회, 작성, 상세, 삭제, 수정 기능 모두 포함)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BoardPage.css';

const BoardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  // 화면 모드 제어 State
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 수정 모드인지 확인

  // 새 글 작성용 State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // 글 수정용 State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (!storedUserData) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      setCurrentUser(JSON.parse(storedUserData));
      fetchPosts();
    }
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts');
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
    }
  };

  // --- 게시글 등록 함수 ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const newPostData = {
      title: newTitle,
      author: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      content: newContent
    };

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData)
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setNewTitle('');
        setNewContent('');
        setIsWriting(false);
        fetchPosts();
      }
    } catch (error) {
      alert('게시글 등록 중 서버와 연결할 수 없습니다.');
    }
  };

  // --- 게시글 삭제 함수 ---
  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm("정말 이 게시글을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setSelectedPost(null);
        fetchPosts();
      }
    } catch (error) {
      alert('게시글 삭제 중 서버와 연결할 수 없습니다.');
    }
  };

  // === [새로 추가된 기능] 게시글 수정 폼 열기 ===
  const startEditing = () => {
    // 기존 글의 제목과 내용을 수정 폼 State에 미리 채워넣습니다.
    setEditTitle(selectedPost.title);
    setEditContent(selectedPost.content);
    setIsEditing(true);
  };

  // === [새로 추가된 기능] 게시글 수정 내용 서버로 전송 ===
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setIsEditing(false); // 수정 모드 종료

        // 상세 보기 화면에서도 수정된 내용이 즉시 보이도록 State 업데이트
        setSelectedPost({ ...selectedPost, title: editTitle, content: editContent });

        // 전체 목록도 최신화
        fetchPosts();
      }
    } catch (error) {
      alert('게시글 수정 중 서버와 연결할 수 없습니다.');
    }
  };

  if (!currentUser) return <div>권한 확인 중...</div>;

  return (
    <div className="board-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SecureTech</h2>
          <p>Intranet System</p>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li>공지사항</li>
          <li className="active" onClick={() => { setIsWriting(false); setIsEditing(false); setSelectedPost(null); }}>
            사내 게시판
          </li>
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
          {/* 화면 분기 처리 */}

          {isEditing ? (
            /* --- 4. 게시글 수정 화면 --- */
            <div className="board-write-view">
              <h3>게시글 수정</h3>
              <form onSubmit={handleEditSubmit} className="write-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="write-title-input"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="write-content-input"
                  rows="10"
                />
                <div className="write-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>수정 취소</button>
                  <button type="submit" className="submit-btn">수정 완료</button>
                </div>
              </form>
            </div>

          ) : isWriting ? (
            /* --- 1. 새 글 작성 화면 --- */
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
            /* --- 2. 게시글 상세 보기 화면 --- */
            <div className="board-detail-view">
              <div className="detail-header">
                <h3>{selectedPost.title}</h3>
                <div className="detail-meta">
                  <span>작성자: <strong>{selectedPost.author}</strong></span>
                  <span>작성일: {selectedPost.date}</span>
                </div>
              </div>
              <div className="detail-body">
                {selectedPost.content.split('\n').map((line, idx) => (
                  <span key={idx}>{line}<br /></span>
                ))}
              </div>
              <div className="detail-actions">
                <button className="back-btn" onClick={() => setSelectedPost(null)}>
                  ← 목록으로 돌아가기
                </button>

                {/* 권한에 따른 수정/삭제 버튼 노출 */}
                {(currentUser.name === selectedPost.author || currentUser.role === '관리자') && (
                  <>
                    <button className="edit-btn" onClick={startEditing}>
                      수정하기
                    </button>
                    <button className="delete-btn" onClick={() => handleDeletePost(selectedPost.id)}>
                      삭제하기
                    </button>
                  </>
                )}
              </div>
            </div>

          ) : (
            /* --- 3. 기본 목록 화면 --- */
            <div className="board-list-view">
              <div className="board-actions">
                <button className="write-btn" onClick={() => setIsWriting(true)}>+ 새 글 작성</button>
              </div>
              <table className="board-table">
                <thead>
                  <tr>
                    <th width="10%">번호</th>
                    <th width="50%">제목</th>
                    <th width="20%">작성자</th>
                    <th width="20%">작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr><td colSpan="4" className="empty-msg">등록된 게시글이 없습니다.</td></tr>
                  ) : (
                    posts.map((post, index) => (
                      <tr key={post.id}>
                        <td>{posts.length - index}</td>
                        <td className="post-title" onClick={() => setSelectedPost(post)}>
                          {post.title}
                        </td>
                        <td>{post.author}</td>
                        <td>{post.date}</td>
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
