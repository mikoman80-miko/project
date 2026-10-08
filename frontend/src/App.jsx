import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import "./App.css";

// 페이지 컴포넌트 임포트
import Home from "./pages/Home";
import HomeEdit from "./pages/HomeEdit";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import SignupApproval from "./pages/SignupApproval";
import PolicyManage from "./pages/PolicyManage";
import MyPage from "./pages/MyPage";
import Login from "./pages/Login"; // 관리자 콘솔 로그인 (3.23 전용)
import UserLogin from "./pages/UserLogin"; // 일반 홈페이지 로그인 (1.23 전용)
import CaptiveAuth from "./pages/CaptiveAuth";
import EmployeeManage from "./pages/EmployeeManage";
import TestLab from "./pages/TestLab";

// -------------------------------------------------------------
// 상단 내비게이션 바 컴포넌트
// -------------------------------------------------------------
function NavigationBar({
  user,
  setUser,
  isInternalAdminNetwork,
  isAdminPortal,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentHost = window.location.hostname;

  const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL || `http://${currentHost}:8000`;
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  // 로그인 화면에서는 상단바 숨김
  if (["/login", "/admin-login", "/user-login"].includes(location.pathname)) {
    return null;
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;

    try {
      if (user && (user.employee_id || user.emp_id)) {
        await axios.post(`${baseUrl}/auth/logout/`, {
          employee_id: user.employee_id || user.emp_id,
        });
      }
    } catch (err) {
      console.error("로그아웃 요청 에러:", err);
    } finally {
      localStorage.removeItem("user");
      sessionStorage.removeItem("adminPortalMode");
      setUser(null);
      alert("로그아웃되었습니다.");
      navigate("/");
    }
  };

  // 💡 핵심 보안 규칙:
  // 1.23(일반 홈페이지)에서는 관리자 계정이라도 관리자 메뉴를 절대 노출하지 않음
  // 사내 관리망(3.23)이거나 관리자 로그인 창을 통해 정식 진입했을 때만 노출
  const showAdminMenu = Boolean(
    user && user.is_manager && isInternalAdminNetwork && isAdminPortal,
  );

  return (
    <header className="navbar">
      {/* 로고: 관리자망 진입 상태일 때만 대시보드로 이동, 일반 홈페이지에서는 항상 홈으로 이동 */}
      <Link to={showAdminMenu ? "/dashboard" : "/"} className="nav-logo">
        🛡️ SecureTech
      </Link>

      <nav className="nav-links">
        {/* 공통 기본 메뉴: 홈 */}
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          홈
        </NavLink>

        {/* 💡 사내 관리망(3.23) 콘솔에서만 노출되는 관리자 메뉴 */}
        {showAdminMenu && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              관제 대시보드
            </NavLink>
            <NavLink
              to="/policies"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              차단 정책 관리
            </NavLink>
            <NavLink
              to="/approvals"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              가입 승인
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              사원 관리
            </NavLink>
            <NavLink
              to="/home-edit"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              홈페이지 관리
            </NavLink>
          </>
        )}

        {/* 로그인 사용자 공통 마이페이지 */}
        {user && (
          <NavLink
            to="/mypage"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            마이페이지
          </NavLink>
        )}
      </nav>

      {/* 우측 상단 인증 버튼 영역 */}
      <div className="nav-right">
        <div className="user-info">
          {user ? (
            <>
              <span className="user-greeting">
                👤 <strong>{user.name}</strong> 님
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
              >
                로그아웃
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Link
                to="/user-login"
                className="nav-link"
                style={{
                  padding: "6px 14px",
                  border: "1px solid #475569",
                  borderRadius: "4px",
                  textDecoration: "none",
                }}
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                가입 신청
              </Link>
            </div>
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
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAdminPortal, setIsAdminPortal] = useState(false);

  const currentHost = window.location.hostname;

  // 192.168.3.x 대역 또는 로컬 테스트 환경
  const isInternalAdminNetwork =
    currentHost.startsWith("192.168.3.") ||
    currentHost === "localhost" ||
    currentHost === "127.0.0.1";

  const syncUserFromStorage = () => {
    const saved = localStorage.getItem("user");
    const adminFlag = sessionStorage.getItem("adminPortalMode") === "true";
    setIsAdminPortal(adminFlag);

    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUserFromStorage();
    setAuthLoaded(true);

    const handleStorageChange = (e) => {
      if (e.key === "user") {
        syncUserFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!authLoaded) return null;

  // 관리자 콘솔 접근 권한: 사내 관리망 환경 + 관리자 계정 + 관리자 콘솔 모드
  const canAccessAdmin = Boolean(
    user?.is_manager && isInternalAdminNetwork && isAdminPortal,
  );

  return (
    <BrowserRouter>
      <div className="app-container">
        <NavigationBar
          user={user}
          setUser={setUser}
          isInternalAdminNetwork={isInternalAdminNetwork}
          isAdminPortal={isAdminPortal}
        />
        <main className="main-content">
          <Routes>
            {/* 1. 일반 홈페이지 공개 페이지 (192.168.1.23) */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/user-login"
              element={<UserLogin setUser={setUser} />}
            />

            {/* 2. 사내 관리자 콘솔 로그인 (192.168.3.23) */}
            <Route
              path="/login"
              element={
                isInternalAdminNetwork ? <Login setUser={setUser} /> : <Home />
              }
            />
            <Route
              path="/admin-login"
              element={
                isInternalAdminNetwork ? <Login setUser={setUser} /> : <Home />
              }
            />

            {/* 3. 관리자 전용 관제 콘솔 라우트 (일반 홈페이지에서는 홈으로 원천 차단) */}
            <Route
              path="/dashboard"
              element={canAccessAdmin ? <Dashboard /> : <Home />}
            />
            <Route
              path="/approvals"
              element={canAccessAdmin ? <SignupApproval /> : <Home />}
            />
            <Route
              path="/policies"
              element={canAccessAdmin ? <PolicyManage /> : <Home />}
            />
            <Route
              path="/employees"
              element={canAccessAdmin ? <EmployeeManage /> : <Home />}
            />
            <Route
              path="/home-edit"
              element={canAccessAdmin ? <HomeEdit /> : <Home />}
            />
            <Route
              path="/test-lab"
              element={canAccessAdmin ? <TestLab /> : <Home />}
            />

            {/* 4. 사용자 공통 및 인증 라우트 */}
            <Route path="/mypage" element={user ? <MyPage /> : <Home />} />
            <Route path="/captive" element={<CaptiveAuth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
