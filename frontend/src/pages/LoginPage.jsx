/**
 * 파일명: LoginPage.jsx
 * 역할: 사내 시스템 로그인 화면 (커스텀 모달 적용)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal'; // ★ 커스텀 모달 불러오기
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  // === [UX 추가] 커스텀 모달 제어를 위한 상태 ===
  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }
  });

  // 모달을 띄우는 도우미 함수 (확인 버튼을 누른 후 실행할 행동(callback)을 추가로 받을 수 있습니다)
  const showAlert = (title, message, callback = null) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setModal({ ...modal, isOpen: false }); // 1. 모달 닫기
        if (callback) callback();              // 2. 전달받은 함수가 있다면 실행 (예: 페이지 이동)
      }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!userId || !password) {
      // 기존: alert('아이디와 비밀번호를 입력해주세요.');
      showAlert('입력 오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      // WAS(Node.js) 서버로 로그인 요청
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });

      const data = await response.json();

      if (data.success) {
        // 로그인 성공 시 세션 스토리지에 유저 정보 저장
        sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));

        // ★ 성공 모달을 띄우고, 사용자가 '확인'을 누르면 대시보드로 이동시킵니다.
        showAlert('로그인 성공', `환영합니다, ${data.user.name} 님!`, () => {
          navigate('/dashboard');
        });
      } else {
        // 아이디/비번 틀림 또는 미승인 상태
        showAlert('로그인 실패', data.message);
      }
    } catch (error) {
      showAlert('네트워크 오류', '서버와 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.');
    }
  };

  return (
    <div className="login-container">
      {/* 1. 커스텀 모달 마운트 */}
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />

      <div className="login-box">
        <h2>SecureTech</h2>
        <p className="login-desc">사내 인트라넷 접근 시스템</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button type="submit" className="login-btn">로그인</button>
        </form>

        {/* 회원가입(접근 권한 요청) 페이지 이동 링크 */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '13px', color: '#7f8c8d' }}>계정이 없으신가요? </span>
          <button
            style={{ background: 'none', border: 'none', color: '#3498db', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/signup')}
          >
            접근 권한 요청하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
