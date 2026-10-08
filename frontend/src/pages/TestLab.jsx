import React, { useState } from "react";
import axios from "axios";

export default function TestLab() {
  // 1. 외부 도메인 차단 상태
  const [targetUrl, setTargetUrl] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. 물리적 망분리 인가 테스트 상태
  const [mockIp, setMockIp] = useState("192.168.1.105");
  const [isolationResult, setIsolationResult] = useState(null);
  const [loadingIso, setLoadingIso] = useState(false);

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");

  // 외부 사이트 차단 시뮬레이션
  const handleTestAccess = async (e) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setTestResult(null);

    try {
      const res = await axios.post(`${baseUrl}/network/simulate-access/`, {
        target: targetUrl.trim(),
      });
      setTestResult(res.data);
    } catch (err) {
      setTestResult({
        status: "ERROR",
        message:
          err.response?.data?.error || "서버 통신 실패 또는 네트워크 오류",
      });
    } finally {
      setLoading(false);
    }
  };

  // 물리적 망분리 인가 시뮬레이션
  const handleTestIsolation = async (targetIp) => {
    const testTargetIp = targetIp || mockIp;
    setLoadingIso(true);
    setIsolationResult(null);

    try {
      const res = await axios.post(`${baseUrl}/network/test-isolation/`, {
        mock_ip: testTargetIp,
      });
      setIsolationResult(res.data);
    } catch (err) {
      setIsolationResult({
        status: "ERROR",
        message: err.response?.data?.error || "망분리 검증 통신 실패",
      });
    } finally {
      setLoadingIso(false);
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="page-header">
        <h2 className="page-title">🧪 네트워크 보안 & 패킷 관제 시뮬레이션</h2>
        <p className="page-subtitle">
          외부 유해 사이트 접속 차단(RST/302 Redirect) 및 물리적 망 분리 인가
          정책을 실시간 모의 검증합니다.
        </p>
      </div>

      {/* 1. 외부 도메인 차단 및 패킷 인젝션 테스트 카드 */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <h3 className="card-title">
            1. 외부 사이트 유해 접속 / 패킷 차단 테스트
          </h3>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
          사내 단말이 유해 도메인에 접근할 때 패킷 인젝션(RST 주입 및 격리 포털
          이동) 동작을 검증합니다.
        </p>

        <form
          onSubmit={handleTestAccess}
          style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
        >
          <input
            type="text"
            className="custom-input"
            style={{ flex: 1 }}
            placeholder="접속 대상 도메인 (예: test-block.com, badsite.org, youtube.com)"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              backgroundColor: "#ef4444",
              color: "#ffffff",
              minWidth: "110px",
            }}
            disabled={loading}
          >
            {loading ? "검증 중..." : "접속 시도"}
          </button>
        </form>

        {testResult && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border:
                testResult.status === "BLOCKED"
                  ? "1px solid #fecaca"
                  : "1px solid #bbf7d0",
              backgroundColor:
                testResult.status === "BLOCKED" ? "#fef2f2" : "#f0fdf4",
              color: testResult.status === "BLOCKED" ? "#991b1b" : "#166534",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                fontSize: "15px",
                marginBottom: "6px",
              }}
            >
              결과 판정: [{testResult.status}]
            </div>
            <div>{testResult.message}</div>
            {testResult.injection_action && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "#dc2626",
                }}
              >
                ⚡ Action: {testResult.injection_action}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 물리적 망분리 인가 시뮬레이션 카드 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            2. 물리적 망 분리 & 관리자 접근 제어 테스트
          </h3>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
          접속 단말의 IP 대역에 따른 관리자 콘솔 접근 권한 통제(사내 보안망
          192.168.3.x vs 외부 일반망 192.168.1.x)를 실시간 검증합니다.
        </p>

        {/* 원클릭 테스트 프리셋 버튼 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn-action"
            style={{
              padding: "8px 14px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              fontWeight: "600",
            }}
            onClick={() => {
              setMockIp("192.168.1.55");
              handleTestIsolation("192.168.1.55");
            }}
            disabled={loadingIso}
          >
            🚨 외부 일반망 (192.168.1.55) 모의 접속
          </button>
          <button
            type="button"
            className="btn-action"
            style={{
              padding: "8px 14px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              border: "1px solid #bbf7d0",
              fontWeight: "600",
            }}
            onClick={() => {
              setMockIp("192.168.3.100");
              handleTestIsolation("192.168.3.100");
            }}
            disabled={loadingIso}
          >
            🛡️ 사내 보안망 (192.168.3.100) 모의 접속
          </button>
        </div>

        {/* 직접 IP 입력 폼 */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            className="custom-input"
            style={{ flex: 1 }}
            placeholder="검증할 단말 IP 주소 입력 (예: 192.168.1.20, 192.168.3.50)"
            value={mockIp}
            onChange={(e) => setMockIp(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              minWidth: "110px",
            }}
            onClick={() => handleTestIsolation(mockIp)}
            disabled={loadingIso}
          >
            {loadingIso ? "검증 중..." : "망 인가 검증"}
          </button>
        </div>

        {/* 결과 표시 */}
        {isolationResult && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border:
                isolationResult.status === "ALLOWED"
                  ? "1px solid #bbf7d0"
                  : "1px solid #fecaca",
              backgroundColor:
                isolationResult.status === "ALLOWED" ? "#f0fdf4" : "#fef2f2",
              color:
                isolationResult.status === "ALLOWED" ? "#166534" : "#991b1b",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                fontSize: "15px",
                marginBottom: "6px",
              }}
            >
              판정 결과: [{isolationResult.status}] ({isolationResult.client_ip}
              )
            </div>
            <div>{isolationResult.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
