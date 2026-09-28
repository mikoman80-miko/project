/**
 * 파일명: AdminApprovalPage.jsx
 * 역할: 관리자가 외부인의 가입(접근) 요청 목록을 확인하고 승인/반려를 결정하는 화면
 * 
 * [주요 변수 및 함수 안내]
 * @variable {array} pendingUsers - 승인을 기다리고 있는 가입 대기자 목록 상태 (추후 DB에서 불러옴)
 * @function handleApprove - 특정 사용자의 가입을 '승인' 처리하여 사내 시스템에 접근 가능하도록 하는 함수
 * @function handleReject - 특정 사용자의 가입을 '반려' 처리하고 목록에서 삭제하는 함수
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminApprovalPage.css';

const AdminApprovalPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // 초기에 비어있는 배열로 셋팅합니다 (가짜 데이터 삭제)
  const [pendingUsers, setPendingUsers] = useState([]);

  // 1. 관리자 권한 확인 및 대기자 목록 불러오기 (화면이 켜질 때 1번 실행)
  useEffect(() => {
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (!storedUserData) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUserData);
    if (user.role !== '관리자') {
      alert('관리자만 접근할 수 있는 페이지입니다.');
      navigate('/dashboard');
    } else {
      setCurrentUser(user);
      // 관리자가 맞다면 백엔드에 대기자 목록을 요청합니다.
      fetchPendingUsers();
    }
  }, [navigate]);

  // WAS(백엔드)에서 가입 대기자 목록(JSON)을 가져오는 함수
  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/pending');
      const data = await response.json();
      if (data.success) {
        setPendingUsers(data.pendingUsers); // 서버에서 받은 배열을 화면 State에 갱신
      }
    } catch (error) {
      console.error('목록 불러오기 실패:', error);
    }
  };

  // 2. 가입 승인 처리 함수
  const handleApprove = async (userId, name) => {
    try {
      // 서버에 해당 아이디를 승인해달라고 요청(POST)
      const response = await fetch('http://localhost:5000/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (data.success) {
        alert(`[${name}] 사용자의 시스템 접근이 승인되었습니다.`);
        // 목록 다시 불러오기 (화면 갱신)
        fetchPendingUsers();
      }
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  // 3. 가입 반려 처리 함수
  const handleReject = async (userId, name) => {
    const confirmReject = window.confirm(`정말 [${name}] 사용자의 요청을 반려하시겠습니까?`);
    if (!confirmReject) return;

    try {
      const response = await fetch('http://localhost:5000/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (data.success) {
        alert(`반려 처리되었습니다.`);
        // 목록 다시 불러오기 (화면 갱신)
        fetchPendingUsers();
      }
    } catch (error) {
      alert('반려 처리 중 오류가 발생했습니다.');
    }
  };

  if (!currentUser) return <div>권한 확인 중...</div>;

  return (
    <div className="admin-container">
      {/* 1. 좌측 사이드바 (DashboardPage와 동일한 구조) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SecureTech</h2>
          <p>Admin System</p>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li>공지사항</li>

          {/* --- 추가된 부분: 사내 게시판 클릭 시 이동 --- */}
          <li onClick={() => navigate('/board')}>사내 게시판</li>

          <li className="active">회원 관리 (관리자용)</li>
        </ul>
      </aside>

      {/* 2. 우측 관리자 메인 화면 */}
      <main className="admin-main">
        <header className="admin-header">
          <h2>시스템 접근 권한 승인 대기열</h2>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            대시보드로 돌아가기
          </button>
        </header>

        <section className="admin-content">
          <div className="table-container">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>요청일자</th>
                  <th>이름</th>
                  <th>소속</th>
                  <th>아이디</th>
                  <th>승인 관리</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-msg">현재 대기 중인 가입 요청이 없습니다.</td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.date}</td>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.department}</td>
                      <td>{user.userId}</td>
                      <td>
                        <button className="approve-btn" onClick={() => handleApprove(user.userId, user.name)}>승인</button>
                        <button className="reject-btn" onClick={() => handleReject(user.userId, user.name)}>반려</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminApprovalPage;
