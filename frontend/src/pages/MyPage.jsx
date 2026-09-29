/**
 * @file MyPage.jsx
 * @description 임직원 본인의 정보를 확인하고 수정(비밀번호 변경 등)하는 마이페이지입니다.
 */

import React, { useState } from 'react';
import './MyPage.css'; // 필요 시 CSS 생성

const MyPage = () => {
  // 세션에 저장된 내 정보 불러오기
  const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser')) || {};

  // 💡 [DB 연동 포인트] 
  // 백엔드 연동 시: 비밀번호 변경 요청을 '/api/users/me/password' (PUT) 로 전송합니다.
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!newPassword) return;

    // API 통신 로직이 들어갈 자리
    alert('비밀번호가 성공적으로 변경되었습니다. (테스트)');
    setNewPassword('');
  };

  return (
    <div className="mypage-container" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>내 정보 관리 (My Page)</h3>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* 1. 기본 정보 카드 */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h4 style={{ marginTop: 0, color: '#3498db' }}>사원 기본 정보</h4>
          <p><strong>사원번호 (ID):</strong> {currentUser.emp_id}</p>
          <p><strong>이름:</strong> {currentUser.name}</p>
          <p><strong>소속 부서:</strong> {currentUser.department}</p>
          <p><strong>시스템 권한:</strong> <span className={`status-badge ${currentUser.role === '관리자' ? 'approved' : 'pending'}`}>{currentUser.role}</span></p>
        </div>

        {/* 2. 비밀번호 변경 카드 */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h4 style={{ marginTop: 0, color: '#e74c3c' }}>비밀번호 변경</h4>
          <form onSubmit={handlePasswordChange}>
            <input
              type="password"
              placeholder="새로운 비밀번호 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
            />
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              비밀번호 변경하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
