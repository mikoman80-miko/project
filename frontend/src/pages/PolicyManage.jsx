import React, { useState, useEffect } from "react";
import axios from "axios";

const PolicyManage = () => {
  const [policies, setPolicies] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [blockDomain, setBlockDomain] = useState("");
  const [whiteDomain, setWhiteDomain] = useState("");
  const [whiteDesc, setWhiteDesc] = useState("");
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [loadingWhite, setLoadingWhite] = useState(false);

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");

  // 정책 목록 및 화이트리스트 조회
  const fetchData = async () => {
    try {
      const [resBlock, resWhite] = await Promise.all([
        axios.get(`${baseUrl}/policies/blocklist/`),
        axios.get(`${baseUrl}/policies/whitelist/`).catch(() => ({ data: [] })),
      ]);
      setPolicies(resBlock.data || []);
      setWhitelist(resWhite.data || []);
    } catch (err) {
      console.error("데이터 조회 실패:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sanitizeDomain = (input) => {
    let clean = input.trim().toLowerCase();
    return clean
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
      .split("/")[0]
      .split(":")[0];
  };

  // 1. 차단 도메인 추가
  const handleAddBlockPolicy = async (e) => {
    e.preventDefault();
    const clean = sanitizeDomain(blockDomain);
    if (!clean) {
      alert("유효한 도메인 주소를 입력해 주세요.");
      return;
    }

    setLoadingBlock(true);
    try {
      const res = await axios.post(`${baseUrl}/policies/add/`, {
        no_access_domain: clean,
      });
      if (res.data.status === "success") {
        alert(res.data.message || "차단 도메인이 등록되었습니다.");
        setBlockDomain("");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error || "차단 도메인 등록 실패");
    } finally {
      setLoadingBlock(false);
    }
  };

  // 2. 차단 도메인 삭제
  const handleDeleteBlockPolicy = async (targetDomain) => {
    if (!window.confirm(`'${targetDomain}' 차단 정책을 삭제하시겠습니까?`))
      return;

    try {
      const res = await axios.post(`${baseUrl}/policies/delete/`, {
        no_access_domain: targetDomain,
      });
      if (res.data.status === "success") {
        alert("차단 정책이 삭제되었습니다.");
        fetchData();
      }
    } catch (err) {
      alert("차단 정책 삭제 실패");
    }
  };

  // 3. 차단 예외(화이트리스트) 도메인 추가
  const handleAddWhitePolicy = async (e) => {
    e.preventDefault();
    const clean = sanitizeDomain(whiteDomain);
    if (!clean) {
      alert("유효한 예외 도메인 주소를 입력해 주세요.");
      return;
    }

    setLoadingWhite(true);
    try {
      const res = await axios.post(`${baseUrl}/policies/whitelist/add/`, {
        domain: clean,
        description: whiteDesc.trim(),
      });
      if (res.data.status === "success") {
        alert(res.data.message || "예외 도메인이 등록되었습니다.");
        setWhiteDomain("");
        setWhiteDesc("");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error || "예외 도메인 등록 실패");
    } finally {
      setLoadingWhite(false);
    }
  };

  // 4. 차단 예외(화이트리스트) 도메인 삭제
  const handleDeleteWhitePolicy = async (targetDomain) => {
    if (!window.confirm(`'${targetDomain}' 예외 지정을 해제하시겠습니까?`))
      return;

    try {
      const res = await axios.post(`${baseUrl}/policies/whitelist/delete/`, {
        domain: targetDomain,
      });
      if (res.data.status === "success") {
        alert(res.data.message || "예외 도메인이 삭제되었습니다.");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error || "예외 도메인 삭제 실패");
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="page-header">
        <h2 className="page-title">🚫 도메인 정책 및 차단 예외 관리</h2>
        <p className="page-subtitle">
          사내 차단 도메인(블랙리스트)과 차단 불가 도메인(화이트리스트)을 등록
          및 관리합니다.
        </p>
      </div>

      {/* [1] 차단 예외(화이트리스트) 카드 */}
      <div
        className="card"
        style={{ marginBottom: "28px", borderTop: "4px solid #10b981" }}
      >
        <div className="card-header">
          <h3 className="card-title" style={{ color: "#065f46" }}>
            🛡️ 차단 예외 도메인 (화이트리스트)
          </h3>
          <span
            className="card-count-badge"
            style={{ backgroundColor: "#d1fae5", color: "#065f46" }}
          >
            총 {whitelist.length}건
          </span>
        </div>

        {/* 예외 등록 폼 */}
        <form
          onSubmit={handleAddWhitePolicy}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            className="custom-input"
            style={{ flex: "1 1 200px" }}
            placeholder="예외 도메인 입력 (예: notion.so, github.com)"
            value={whiteDomain}
            onChange={(e) => setWhiteDomain(e.target.value)}
            required
          />
          <input
            type="text"
            className="custom-input"
            style={{ flex: "1 1 180px" }}
            placeholder="용도/비고 (예: 업무 협업용)"
            value={whiteDesc}
            onChange={(e) => setWhiteDesc(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              backgroundColor: "#10b981",
              color: "#fff",
              whiteSpace: "nowrap",
            }}
            disabled={loadingWhite}
          >
            {loadingWhite ? "등록 중..." : "예외 등록"}
          </button>
        </form>

        {/* 예외 도메인 뱃지 목록 (모든 도메인에 삭제 × 버튼 강제 표시) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {whitelist.length > 0 ? (
            whitelist.map((item) => (
              <span
                key={item.domain}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  fontFamily: "monospace",
                }}
              >
                <span>✓ {item.domain}</span>
                {item.description && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      fontWeight: "400",
                      fontFamily: "sans-serif",
                    }}
                  >
                    ({item.description})
                  </span>
                )}
                {/* 조건문 없이 무조건 삭제 X 버튼 출력 */}
                <button
                  type="button"
                  onClick={() => handleDeleteWhitePolicy(item.domain)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    padding: "0 4px",
                    lineHeight: "1",
                    marginLeft: "2px",
                  }}
                  title="예외 삭제"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              등록된 예외 도메인이 없습니다.
            </span>
          )}
        </div>
      </div>

      {/* [2] 신규 차단 도메인 추가 */}
      <div className="card policy-register-card">
        <div className="card-header">
          <h3 className="card-title">➕ 신규 차단 도메인 추가</h3>
        </div>
        <form onSubmit={handleAddBlockPolicy} className="policy-form">
          <input
            type="text"
            className="custom-input policy-input"
            placeholder="차단할 도메인 주소 입력 (예: badsite.org, test.com)"
            value={blockDomain}
            onChange={(e) => setBlockDomain(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn-primary policy-btn"
            disabled={loadingBlock}
          >
            {loadingBlock ? "등록 중..." : "차단 등록"}
          </button>
        </form>
      </div>

      {/* [3] 현재 적용 중인 차단 목록 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 현재 적용 중인 차단 목록</h3>
          <span className="card-count-badge">총 {policies.length}건</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>No</th>
                <th style={{ textAlign: "left", paddingLeft: "24px" }}>
                  차단 대상 도메인
                </th>
                <th style={{ width: "120px", textAlign: "center" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {policies.length > 0 ? (
                policies.map((p, idx) => (
                  <tr key={p.no_access_domain}>
                    <td className="cell-time">{idx + 1}</td>
                    <td style={{ textAlign: "left", paddingLeft: "24px" }}>
                      <span className="badge-danger-tag">
                        {p.no_access_domain}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteBlockPolicy(p.no_access_domain)
                        }
                        className="btn-action btn-action-reject"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="table-empty">
                    등록된 차단 도메인이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PolicyManage;
