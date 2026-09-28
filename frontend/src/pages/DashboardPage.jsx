/**
 * 파일명: DashboardPage.jsx
 * 역할: 로그인에 성공한 관리자 및 허가된 가입자만 볼 수 있는 사내 시스템(그룹웨어) 메인 화면
 * 
 * [주요 변수 및 함수 안내]
 * @variable {function} navigate - 페이지 이동을 위한 함수 (비로그인자 접근 차단 및 로그아웃 시 사용)
 * @variable {object} currentUser - 세션 스토리지에서 불러온 현재 로그인한 사용자의 실제 데이터
 * @function useEffect - 컴포넌트(화면)가 처음 렌더링될 때 한 번 실행되어 로그인 여부를 검사하는 리액트 훅
 * @function handleLogout - 로그아웃 버튼 클릭 시 세션 데이터를 삭제하고 메인으로 이동하는 함수
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();

  // 로그인한 사용자 정보를 담을 State (초기값은 null)
  const [currentUser, setCurrentUser] = useState(null);

  // 화면이 처음 켜질 때(렌더링 될 때) 로그인 상태를 확인합니다.
  useEffect(() => {
    // 1. 브라우저 세션 스토리지에서 'loggedInUser'라는 이름으로 저장된 데이터를 꺼냅니다.
    const storedUserData = sessionStorage.getItem('loggedInUser');

    // 2. 만약 저장된 데이터가 없다면 (비정상적인 접근 또는 로그인 안 함)
    if (!storedUserData) {
      alert('로그인이 필요한 서비스입니다. 안전한 사용을 위해 로그인 페이지로 이동합니다.');
      navigate('/login'); // 로그인 페이지로 강제 이동시킵니다.
    } else {
      // 3. 데이터가 있다면, 문자열로 저장된 JSON 데이터를 다시 자바스크립트 객체로 변환(parse)하여 State에 저장합니다.
      setCurrentUser(JSON.parse(storedUserData));
    }
  }, [navigate]); // navigate 객체가 변경될 때마다(거의 변경 안됨) 이 useEffect를 주시합니다.

  // 로그아웃 처리 함수
  const handleLogout = () => {
    // 1. 세션 스토리지에 저장되어 있던 사용자 정보를 완전히 삭제합니다. (보안 처리)
    sessionStorage.removeItem('loggedInUser');

    // 2. 로그아웃 알림 후 외부인용 메인 홈페이지(기본 주소)로 돌려보냅니다.
    alert('안전하게 로그아웃 되었습니다.');
    navigate('/');
  };

  // currentUser 데이터가 세팅되기 전 아주 짧은 찰나에 에러가 나지 않도록 로딩 화면을 보여줍니다.
  if (!currentUser) {
    return <div>사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="dashboard-container">

      {/* 1. 좌측 사이드바 영역 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SecureTech</h2>
          <p>Intranet System</p>
        </div>
        <ul className="sidebar-menu">
          <li className="active" onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li onClick={() => navigate('/notice')}>공지사항</li>
          <li onClick={() => navigate('/board')}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {currentUser.role === '관리자' && (
            <li onClick={() => navigate('/admin/approval')}>회원 관리 (관리자용)</li>
          )}
        </ul>
      </aside>

      {/* 2. 우측 메인 콘텐츠 영역 */}
      <main className="dashboard-main">

        {/* 상단 헤더 (사용자 정보 및 로그아웃) */}
        <header className="dashboard-header">
          <div className="user-info">
            {/* 백엔드에서 받아온 실제 데이터(currentUser)를 화면에 렌더링합니다. */}
            <span className="user-name">
              <strong>{currentUser.name}</strong> {currentUser.role}님 환영합니다.
            </span>
            <span className="user-dept">[{currentUser.department}]</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </header>

        {/* 본문 내용 (위젯 및 요약 정보) */}
        <section className="dashboard-content">
          <h3>오늘의 업무 요약</h3>

          <div className="widget-grid">
            <div className="widget-card">
              <h4>새로운 공지사항</h4>
              <p className="widget-number">2건</p>
              <button>바로가기</button>
            </div>
            <div className="widget-card">
              <h4>결재 대기 문서</h4>
              <p className="widget-number">5건</p>
              <button>바로가기</button>
            </div>
            <div className="widget-card">
              <h4>시스템 접근 로그</h4>
              <p className="widget-status safe">안전</p>
              <button>로그 확인</button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default DashboardPage;
