import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SignupPage from './pages/SignupPage';
import AdminApprovalPage from './pages/AdminApprovalPage';
import BoardPage from './pages/BoardPage';
import NoticePage from './pages/NoticePage';
import ApprovalPage from './pages/ApprovalPage';
import MyPage from './pages/MyPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = sessionStorage.getItem('loggedInUser');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    alert('로그인이 필요한 서비스입니다.');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert('접근 권한이 없습니다.');
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* 그룹웨어 전용 라우트 (임직원 이상) */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', '사원', '임직원', 'ADMIN', '관리자']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/board" element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', '사원', '임직원', 'ADMIN', '관리자']}>
            <BoardPage />
          </ProtectedRoute>
        } />
        <Route path="/notice" element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', '사원', '임직원', 'ADMIN', '관리자']}>
            <NoticePage />
          </ProtectedRoute>
        } />
        <Route path="/approval" element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', '사원', '임직원', 'ADMIN', '관리자']}>
            <ApprovalPage />
          </ProtectedRoute>
        } />

        {/* ★ 1번 반영: 마이페이지는 일반 회원도 접근 가능하도록 권한 추가 */}
        <Route path="/mypage" element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', '사원', '임직원', 'ADMIN', '관리자', '일반', '일반회원']}>
            <MyPage />
          </ProtectedRoute>
        } />

        {/* 관리자 전용 */}
        <Route path="/admin/approval" element={
          <ProtectedRoute allowedRoles={['ADMIN', '관리자']}>
            <AdminApprovalPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
