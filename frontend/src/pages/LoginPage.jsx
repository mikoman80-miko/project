/**
 * 파일명: LoginPage.jsx
 * 역할: 사내 시스템(그룹웨어) 접속을 위한 사용자 인증(로그인) 화면
 * 
 * [주요 변수 및 함수 안내]
 * @variable {string} userId - 사용자가 입력한 아이디를 저장하는 상태값
 * @variable {string} password - 사용자가 입력한 비밀번호를 저장하는 상태값
 * @variable {string} errorMessage - 로그인 실패 시 화면에 띄워줄 에러 메시지
 * @variable {function} navigate - 다른 페이지로 이동하기 위한 함수
 * @function handleLoginSubmit - '로그인' 버튼을 눌렀을 때 실행되는 폼 전송 함수
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  // 사용자가 입력하는 아이디와 비밀번호를 실시간으로 저장하기 위한 State
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  // 로그인 실패 시 경고창 대신 부드럽게 텍스트로 안내하기 위한 State
  const [errorMessage, setErrorMessage] = useState('');

  // 폼(Form) 전송 이벤트 처리 함수
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !password) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      // WAS(Node.js) 서버의 로그인 API 주소로 아이디와 비밀번호를 JSON 형태로 묶어 보냅니다(POST).
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password })
      });

      // 서버에서 보내준 응답 데이터를 자바스크립트 객체로 변환합니다.
      const data = await response.json();

      if (response.ok && data.success) {
        // [추가된 부분] 서버에서 받은 사용자 정보를 브라우저 세션 스토리지에 저장합니다.
        // sessionStorage는 문자열만 저장할 수 있으므로, JSON 객체를 문자열로 변환(stringify)하여 저장합니다.
        sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));

        setErrorMessage('');
        alert(`${data.user.name}님, 사내 시스템에 접속합니다.`);

        // 대시보드로 이동
        navigate('/dashboard');
      } else {
        // 서버 검증 실패 (아이디/비밀번호 틀림 등)
        setErrorMessage(data.message);
      }
    } catch (error) {
      // 서버가 꺼져있거나 네트워크 문제가 발생했을 때의 처리
      console.error('로그인 요청 중 오류 발생:', error);
      setErrorMessage('서버와 연결할 수 없습니다. 관리자에게 문의하세요.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* 뒤로 가기 버튼 */}
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 홈으로
        </button>

        <h2>그룹웨어 로그인</h2>
        <p className="login-desc">사내 시스템 접근을 위해 로그인해주세요.</p>

        {/* 로그인 입력 폼 */}
        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              value={userId}
              // 사용자가 타이핑할 때마다 userId 변수에 값을 업데이트합니다.
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
              // 사용자가 타이핑할 때마다 password 변수에 값을 업데이트합니다.
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {/* 에러 메시지가 있을 경우에만 화면에 붉은색 글씨로 표시합니다. */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="submit-btn">
            로그인
          </button>
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
