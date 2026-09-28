/**
 * 파일명: MainPage.jsx
 * 역할: 로그인 전 외부인 및 직원들이 가장 먼저 보게 되는 회사 소개 메인 페이지
 * 
 * [주요 변수 및 함수 안내]
 * @variable {function} navigate - 사용자를 다른 경로(URL)로 이동시켜주는 함수 (react-router-dom 제공)
 * @function handleLoginClick - '그룹웨어 로그인' 버튼 클릭 시 /login 페이지로 이동시키는 함수
 */

import React from 'react';
// 페이지 이동을 위한 useNavigate 훅을 불러옵니다.
import { useNavigate } from 'react-router-dom';
// 화면 꾸미기를 위한 CSS 파일을 불러옵니다.
import './MainPage.css';

const MainPage = () => {
  // 변수 선언: 페이지 이동 기능을 가진 navigate 객체를 생성합니다.
  const navigate = useNavigate();

  // 로그인 페이지로 이동하는 이벤트 핸들러 함수
  const handleLoginClick = () => {
    // '/login' 주소로 화면을 즉시 전환합니다.
    navigate('/login');
  };

  return (
    // 메인 페이지의 전체를 감싸는 최상위 영역
    <div className="main-container">

      {/* 상단 네비게이션 바 (헤더) 영역 */}
      <header className="main-header">
        <div className="logo">
          <h2>SecureTech Intranet</h2> {/* 회사 이름 또는 로고 */}
        </div>
        <nav className="main-nav">
          <ul>
            <li><a href="#about">회사소개</a></li>
            <li><a href="#services">서비스</a></li>
            {/* 사내 시스템으로 들어가는 로그인 버튼 */}
            <li>
              <button className="login-btn" onClick={handleLoginClick}>
                그룹웨어 로그인
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* 메인 콘텐츠(인사말 등) 영역 */}
      <main className="main-content">
        <section className="hero-section">
          <h1>안전하고 혁신적인 IT 서비스</h1>
          <p>
            보안과 신뢰를 최우선으로 생각하는 기업입니다. <br />
            사내 임직원 및 허가된 회원은 우측 상단의 로그인을 통해 시스템에 접근해 주세요.
          </p>
        </section>
      </main>

      {/* 하단 바닥글 (푸터) 영역 */}
      <footer className="main-footer">
        <p>&copy; 2026 SecureTech Co., Ltd. All rights reserved.</p>
      </footer>

    </div>
  );
};

// 다른 파일에서 MainPage 컴포넌트를 가져다 쓸 수 있도록 내보냅니다.
export default MainPage;
