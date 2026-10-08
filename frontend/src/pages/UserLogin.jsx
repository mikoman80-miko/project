import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const UserLogin = ({ setUser }) => {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${baseUrl}/auth/login/`, {
        employee_id: empId.trim(),
        password: password,
      });

      if (response.data.status === "success") {
        const rawUser = response.data.user;
        const userData = {
          ...rawUser,
          employee_id: rawUser.employee_id || rawUser.emp_id,
          emp_id: rawUser.emp_id || rawUser.employee_id,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        if (setUser) setUser(userData);

        alert(`${userData.name} 님, 환영합니다.`);
        // 일반 홈페이지 로그인 시에는 관리자 여부와 무관하게 항상 메인 홈으로 이동
        navigate("/");
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "아이디 또는 비밀번호가 올바르지 않습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-icon">🛡️</div>
          <h2 className="auth-title">SecureTech 로그인</h2>
          <p className="auth-subtitle">
            아이디와 비밀번호를 입력해 로그인해 주세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">아이디</label>
            <input
              type="text"
              className="custom-input"
              placeholder="아이디 입력"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="custom-input"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16px",
            fontSize: "13px",
          }}
        >
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>
            ← 홈으로
          </Link>
          <Link
            to="/signup"
            style={{
              color: "#2563eb",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            신규 계정 신청
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
