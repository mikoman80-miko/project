import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// 페이지 컴포넌트 임포트
import Home from './pages/Home';
import HomeEdit from './pages/HomeEdit';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import SignupApproval from './pages/SignupApproval';
import PolicyManage from './pages/PolicyManage';
import MyPage from './pages/MyPage';
import Login from './pages/Login';
import CaptiveAuth from './pages/CaptiveAuth';
import EmployeeManage from './pages/EmployeeManage';

import { checkAndInterceptDomain } from './utils/securityInterceptor';

// -------------------------------------------------------------
// 상단 내비게이션 바 컴포넌트
// -------------------------------------------------------------
function NavigationBar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [testUrl, setTestUrl] = useState('');
  const currentHost = window.location.hostname;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || `http://${currentHost}:8000`;

  // 1. 관리자 로그인 창(/login)에서는 상단바 자체를 렌더링하지 않음
  if (location.pathname === '/login') {
    return null;
  }

  // 모의 외부 접속 테스트 핸들러
  const handleTestNavigate = async (e) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    const isBlocked = await checkAndInterceptDomain(testUrl);
    if (!isBlocked) {
      window.open(testUrl.startsWith('http') ? testUrl : `https://${testUrl}`, '_blank');
    } else {
      // 차단 성공 시 대시보드 화면이면 즉시 새로고침 반영
      if (location.pathname === '/dashboard') {
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    }
    setTestUrl('');
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    try {
      if (user && user.emp_id) {
        await axios.post(`${baseUrl}/auth/logout/`, {
          employee_id: user.emp_id
        });
      }
    } catch (err) {
      console.error('로그아웃 통신 에러:', err);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      alert('로그아웃되었습니다.');
      navigate('/');
    }
  };

  const isManager = Boolean(user && user.is_manager);

  return (
    <header className="navbar">
      {/* 로고 */}
      <Link to={isManager ? "/dashboard" : "/"} className="nav-logo">
        🛡️ SecureTech
      </Link>

      {/* 네비게이션 메뉴 */}
      <nav className="nav-links">
        {/* 관리자가 아닌 경우(일반 외부 방문자): 메인 홈 메뉴 노출 */}
        {!isManager && (
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            홈
          </NavLink>
        )}

        {/* 사내 관리자 전용 메뉴 (홈 대신 '홈페이지 관리' 포함) */}
        {isManager && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              관제 대시보드
            </NavLink>
            <NavLink to="/policies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              차단 정책 관리
            </NavLink>
            <NavLink to="/approvals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              가입 승인
            </NavLink>
            <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              사원 관리
            </NavLink>
            <NavLink to="/home-edit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              홈페이지 관리
            </NavLink>
          </>
        )}

        {/* 로그인한 사용자 공통 메뉴 */}
        {user && (
          <NavLink to="/mypage" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            마이페이지
          </NavLink>
        )}
      </nav>

      {/* 우측 컨트롤 영역 */}
      <div className="nav-right">
        {/* 관리자 전용 모의 차단 테스트 입력창 */}
        {isManager && (
          <form onSubmit={handleTestNavigate} className="nav-test-form">
            <input
              type="text"
              placeholder="외부 접속 테스트 (예: asb.com)"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="nav-test-input"
            />
            <button type="submit" className="nav-test-btn">
              접속 시도
            </button>
          </form>
        )}

        {/* 인증 상태별 버튼 분기 */}
        <div className="user-info">
          {user ? (
            <>
              <span className="user-greeting">
                👤 <strong>{user.name}</strong> 님
              </span>
              <button onClick={handleLogout} className="btn-logout">
                로그아웃
              </button>
            </>
          ) : (
            /* 비로그인 일반 방문자: 로그인 버튼 없이 [가입 신청]만 노출 */
            <Link to="/signup" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}>
              가입 신청
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

// -------------------------------------------------------------
// App 메인 컴포넌트
// -------------------------------------------------------------
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <NavigationBar user={user} setUser={setUser} />
        <main className="main-content">
          <Routes>
            {/* 누구나 접속 가능한 공개 페이지 */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login setUser={setUser} />} />

            {/* 관리자(is_manager) 전용 라우트 보호 (비인가 접근 시 홈으로 리다이렉트) */}
            <Route path="/dashboard" element={user?.is_manager ? <Dashboard /> : <Home />} />
            <Route path="/approvals" element={user?.is_manager ? <SignupApproval /> : <Home />} />
            <Route path="/policies" element={user?.is_manager ? <PolicyManage /> : <Home />} />
            <Route path="/employees" element={user?.is_manager ? <EmployeeManage /> : <Home />} />
            <Route path="/home-edit" element={user?.is_manager ? <HomeEdit /> : <Home />} />

            {/* 사원 공통 및 캡티브 인증 */}
            <Route path="/mypage" element={user ? <MyPage /> : <Login setUser={setUser} />} />
            <Route path="/captive" element={<CaptiveAuth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
