/**
 * @file App.jsx
 * @description React 애플리케이션의 최상위 컴포넌트입니다.
 * 모든 라우팅(페이지 이동) 및 전역 상태(보안 관제 토스트 알림 등)를 관리합니다.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// -----------------------------------------------------
// 1. 컴포넌트 및 페이지 Import (알파벳 순 정렬)
// -----------------------------------------------------
import Layout from './components/Layout'; // ★ 사이드바/헤더 중복 제거를 위한 공통 레이아웃

import AdminApprovalPage from './pages/AdminApprovalPage';
import ApprovalPage from './pages/ApprovalPage';
import AssetIpManagementPage from './pages/AssetIpManagementPage';
import BoardPage from './pages/BoardPage';
import DashboardPage from './pages/DashboardPage';
import FirewallRulePage from './pages/FirewallRulePage';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MyPage from './pages/MyPage';
import NoticePage from './pages/NoticePage';
import OrgChartPage from './pages/OrgChartPage';
import SecurityMonitorPage from './pages/SecurityMonitorPage';
import SignupPage from './pages/SignupPage';

// -----------------------------------------------------
// 2. 글로벌 CSS Import
// -----------------------------------------------------
import './pages/SecurityToast.css';

const App = () => {
  // 전역 토스트 알림 상태 관리
  const [toasts, setToasts] = useState([]);

  // -----------------------------------------------------
  // 3. 실시간 SOC 관제 알림 로직 (인터벌)
  // -----------------------------------------------------
  useEffect(() => {
    const alertInterval = setInterval(() => {
      const mockAlerts = [
        { level: 'CRITICAL', msg: '비정상 포트 스캔 감지 (대상 IP: 192.168.0.55)' },
        { level: 'WARN', msg: '다중 로그인 실패 감지 (인사팀 계정)' },
        { level: 'CRITICAL', msg: '대용량 트래픽 발생 (DDoS 공격 의심)' },
        { level: 'INFO', msg: '방화벽 룰(iptables) 동기화 완료' }
      ];

      const randomAlert = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
      const newToastId = Date.now();

      // 알림창 띄우기
      setToasts(prev => [...prev, { id: newToastId, ...randomAlert }]);

      // 5초 뒤 자동 삭제
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToastId));
      }, 5000);
    }, 15000); // 15초마다 발생

    // ★ 최적화: 페이지가 변경되거나 컴포넌트가 꺼질 때 인터벌을 초기화(메모리 누수 방지)
    return () => clearInterval(alertInterval);
  }, []);

  // 수동으로 알림 닫기
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <Router>
      <div className="app-wrapper">

        {/* ====================================================
            [글로벌 UI] 토스트 알림 컨테이너 (어느 페이지든 최상단에 고정)
        ==================================================== */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`soc-toast toast-${toast.level.toLowerCase()}`} onClick={() => removeToast(toast.id)}>
              <div className="toast-icon">
                {toast.level === 'CRITICAL' ? '🚨' : toast.level === 'WARN' ? '⚠️' : '✅'}
              </div>
              <div className="toast-content">
                <h4>[SOC {toast.level}] 보안 시스템 알림</h4>
                <p>{toast.msg}</p>
              </div>
              <button className="toast-close">×</button>
            </div>
          ))}
        </div>

        {/* ====================================================
            [라우터] 페이지 이동 정의 영역
        ==================================================== */}
        <Routes>
          {/* 1. 레이아웃이 필요 없는 단일 페이지 */}
          <Route path="/" element={<MainPage />} />           {/* ★ 기본 주소 접속 시 메인(랜딩) 페이지 노출 */}
          <Route path="/login" element={<LoginPage />} />     {/* ★ 로그인 페이지는 /login 주소로 분리 */}
          <Route path="/signup" element={<SignupPage />} />

          {/* 2. <Layout>이 감싸진 인트라넷 핵심 페이지 (사이드바 자동 적용) */}
          <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
          <Route path="/notice" element={<Layout><NoticePage /></Layout>} />
          <Route path="/board" element={<Layout><BoardPage /></Layout>} />
          <Route path="/approval" element={<Layout><ApprovalPage /></Layout>} />
          <Route path="/orgchart" element={<Layout><OrgChartPage /></Layout>} />
          <Route path="/mypage" element={<Layout><MyPage /></Layout>} />

          {/* 3. <Layout>이 감싸진 관리자/관제 전용 페이지 */}
          <Route path="/admin/approval" element={<Layout><AdminApprovalPage /></Layout>} />
          <Route path="/admin/assets" element={<Layout><AssetIpManagementPage /></Layout>} />
          <Route path="/security" element={<Layout><SecurityMonitorPage /></Layout>} />
          <Route path="/firewall" element={<Layout><FirewallRulePage /></Layout>} />
        </Routes>

      </div>
    </Router>
  );
};

export default App;
