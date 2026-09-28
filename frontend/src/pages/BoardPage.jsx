/**
 * 파일명: BoardPage.jsx
 * 역할: 사내 게시판 화면 (WAS 백엔드 서버와 실제 데이터 통신 적용)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BoardPage.css';

const BoardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // 백엔드에서 받아올 게시글 목록 상태 (초기엔 빈 배열)
  const [posts, setPosts] = useState([]);

  const [isWriting, setIsWriting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // 1. 화면 렌더링 시 로그인 확인 및 게시글 목록 불러오기
  useEffect(() => {
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (!storedUserData) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      setCurrentUser(JSON.parse(storedUserData));
      fetchPosts(); // 인증이 완료되면 게시글을 불러옵니다.
    }
  }, [navigate]);

  // WAS 서버에서 전체 게시글 목록을 가져오는 함수
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts');
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts); // 서버의 배열 데이터를 화면에 갱신
      }
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
    }
  };

  // 2. 새 게시글 서버에 등록하기
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    // 서버로 보낼 데이터 묶음
    const newPostData = {
      title: newTitle,
      author: currentUser.name, // 로그인된 내 이름
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

        // 입력 폼 초기화 및 목록 화면으로 전환
        setNewTitle('');
        setNewContent('');
        setIsWriting(false);

        // 방금 쓴 글이 포함된 최신 목록을 서버에서 다시 불러옵니다.
        fetchPosts();
      }
    } catch (error) {
      alert('게시글 등록 중 서버와 연결할 수 없습니다.');
    }
  };

  if (!currentUser) return <div>권한 확인 중...</div>;

  return (
    <div className="board-container">
      {/* 좌측 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SecureTech</h2>
          <p>Intranet System</p>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li>공지사항</li>
          <li className="active">사내 게시판</li>
          {currentUser.role === '관리자' && (
            <li onClick={() => navigate('/admin/approval')}>회원 관리 (관리자용)</li>
          )}
        </ul>
      </aside>

      {/* 우측 메인 콘텐츠 */}
      <main className="board-main">
        <header className="board-header">
          <h2>사내 게시판</h2>
          <div className="user-info">
            <span className="user-name"><strong>{currentUser.name}</strong> 님</span>
            <button className="logout-btn" onClick={() => navigate('/dashboard')}>대시보드로</button>
          </div>
        </header>

        <section className="board-content">
          {!isWriting ? (
            /* --- 게시글 목록 화면 --- */
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
                        {/* 백엔드에서 최신 글을 앞에 밀어넣으므로(unshift), 번호는 역순으로 매깁니다 */}
                        <td>{posts.length - index}</td>
                        <td className="post-title">{post.title}</td>
                        <td>{post.author}</td>
                        <td>{post.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* --- 새 글 작성 화면 --- */
            <div className="board-write-view">
              <h3>새 게시글 작성</h3>
              <form onSubmit={handlePostSubmit} className="write-form">
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="write-title-input"
                />
                <textarea
                  placeholder="내용을 입력하세요..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="write-content-input"
                  rows="10"
                />
                <div className="write-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsWriting(false)}>취소</button>
                  <button type="submit" className="submit-btn">등록하기</button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BoardPage;
