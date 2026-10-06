// src/App.jsx (최적화 적용)
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PolicyManage from './pages/PolicyManage';
import EmployeeManage from './pages/EmployeeManage';
import SignupApproval from './pages/SignupApproval';
import MyPage from './pages/MyPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  // 💡 최적화: useEffect 제거하고 useState 지연 초기화 패턴 적용
  // 이렇게 하면 컴포넌트 마운트 시 한 번만 로컬 스토리지를 읽어와 성능이 향상됩니다.
  const [user, setUser] = useState(() => {
    const loggedInUser = localStorage.getItem('user');
    return loggedInUser ? JSON.parse(loggedInUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/home'; 
  };

  return (
    <Router>
      <div>
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/home" style={{ color: 'white', textDecoration: 'none' }}>🛡 SecureTech</Link>
          </div>
          
          {user ? (
            <>
              <div className="nav-links">
                <Link to="/" className="nav-link">대시보드</Link>
                <Link to="/policy" className="nav-link">정책 관리</Link>
                
                {user.is_manager && (
                  <>
                    <Link to="/employees" className="nav-link">사원 관리</Link>
                    <Link to="/approvals" className="nav-link">가입 승인</Link>
                  </>
                )}
              </div>
              <div className="user-info">
                <Link to="/mypage" style={{ textDecoration: 'none' }}>
                  <span className="user-greeting" style={{ cursor: 'pointer' }}>🧑‍💻 <b>{user.name}</b>님 접속 중</span>
                </Link>
                <button onClick={handleLogout} className="btn-logout">로그아웃</button>
              </div>
            </>
          ) : (
            <div className="user-info">
              <Link to="/login" className="btn-login" style={{ textDecoration: 'none' }}>로그인</Link>
            </div>
          )}
        </nav>

        <div style={{ padding: '40px 20px' }}>
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {user && (
              <>
                <Route path="/policy" element={<PolicyManage />} />
                <Route path="/mypage" element={<MyPage />} />
                
                {user.is_manager && (
                  <>
                    <Route path="/employees" element={<EmployeeManage />} />
                    <Route path="/approvals" element={<SignupApproval />} />
                  </>
                )}
              </>
            )}
            <Route path="*" element={user ? <Dashboard /> : <Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
