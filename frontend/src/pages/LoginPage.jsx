import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  // 7번 반영: email 대신 일반 userId 사용
  const [userId, setUserId] = useState('');
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

    if (!userId || !password) {
      // 7번 반영: 알림 메시지 변경
      showAlert('입력 오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      // 백엔드 요청 시에도 email 대신 userId를 전송하도록 수정했습니다.
      // (백엔드 서버 코드에서도 req.body.email 대신 req.body.userId를 받도록 수정이 필요합니다)
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
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
        {/* 9번 반영: 인트라넷 -> 그룹웨어로 명칭 변경 */}
        <p className="login-desc">사내 그룹웨어 접근 시스템</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            {/* 7번 반영: 이메일 아이디 -> 기존 일반 아이디로 UI 변경 */}
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
