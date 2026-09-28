import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  // userId 대신 email 사용
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }
  });

  const showAlert = (title, message, callback = null) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setModal({ ...modal, isOpen: false });
        if (callback) callback();
      }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showAlert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
        // ★ 로그인 성공 시 대시보드가 아닌 메인 화면('/')으로 이동
        showAlert('로그인 성공', `환영합니다, ${data.user.name} 님!`, () => {
          navigate('/');
        });
      } else {
        showAlert('로그인 실패', data.message);
      }
    } catch (error) {
      showAlert('네트워크 오류', '서버와 연결할 수 없습니다.');
    }
  };

  return (
    <div className="login-container">
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
            <label htmlFor="email">이메일 아이디</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 입력 (직원은 @ST.co.kr)"
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
