import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const Dashboard = () => {
  const [authStatus, setAuthStatus] = useState([]);
  const [threatLogs, setThreatLogs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // VITE_API_BASE_URL 슬래시 정규화
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [resAuth, resThreat] = await Promise.all([
        axios.get(`${baseUrl}/dashboard/employee-auth-status/`),
        axios.get(`${baseUrl}/dashboard/threat-logs/`),
      ]);
      setAuthStatus(resAuth.data || []);
      setThreatLogs(resThreat.data || []);
    } catch (err) {
      console.warn("대시보드 동기화 일시 오류:", err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchData();
    // 4초마다 관제 현황 자동 갱신
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="dashboard-container">
      {/* 대시보드 헤더 */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 className="page-title">📊 통합 보안 관제 대시보드</h2>
          <p className="page-subtitle">
            사내 네트워크 및 사원 인증 상태를 실시간으로 모니터링합니다.
            <span className="live-status-indicator">
              <span className="live-dot">●</span> 실시간 연동 중 (4초 주기)
            </span>
          </p>
        </div>

        {/* 수동 새로고침 버튼 */}
        <button
          type="button"
          onClick={fetchData}
          className="btn-action"
          style={{
            padding: "8px 16px",
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
            fontWeight: "600",
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? "동기화 중..." : "🔄 지금 동기화"}
        </button>
      </div>

      {/* 2단 대시보드 그리드 */}
      <div className="dashboard-grid">
        {/* 1. 사원 인증 현황 카드 */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">👥 사원 인증 현황</h3>
            <span className="card-count-badge">총 {authStatus.length}건</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>사원명 (ID)</th>
                  <th>단말 IP</th>
                  <th>로그인 상태</th>
                  <th>외부 인터넷</th>
                  <th>로그인 시간</th>
                  <th>로그아웃 시간</th>
                </tr>
              </thead>
              <tbody>
                {authStatus.length > 0 ? (
                  authStatus.map((item) => (
                    <tr key={item.id}>
                      <td className="cell-emp-name">
                        {item.emp_name}{" "}
                        <span className="emp-sub-id">({item.emp_id})</span>
                      </td>
                      <td>
                        <span className="ip-badge">{item.ip}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${item.is_active ? "badge-green" : "badge-gray"}`}
                        >
                          {item.login_status}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">
                          {item.external_status}
                        </span>
                      </td>
                      <td className="cell-time">{item.login_time || "-"}</td>
                      <td className="cell-time cell-time-muted">
                        {item.logout_time || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="table-empty">
                      접속 및 인증 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. 위협 탐지 로그 카드 */}
        <div className="card dashboard-card card-threat">
          <div className="card-header">
            <h3 className="card-title text-threat">
              🚨 위협 탐지 로그 (차단됨)
            </h3>
            <span className="card-count-badge badge-threat-count">
              총 {threatLogs.length}건
            </span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>위반 사원</th>
                  <th>차단 목적지</th>
                  <th>탐지 시간</th>
                </tr>
              </thead>
              <tbody>
                {threatLogs.length > 0 ? (
                  threatLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="cell-emp-name">{log.violator}</td>
                      <td>
                        <span className="badge-danger-tag">
                          {log.blocked_domain}
                        </span>
                      </td>
                      <td className="cell-time">{log.time || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="table-empty">
                      탐지된 위협이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
