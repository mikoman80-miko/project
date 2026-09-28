import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
// 새로 만든 두 페이지 불러오기
import SignupPage from './pages/SignupPage';
import AdminApprovalPage from './pages/AdminApprovalPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 회원가입 및 관리자 승인 페이지 주소 추가 */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/approval" element={<AdminApprovalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
