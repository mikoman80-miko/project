import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const formatPhoneNumber = (value) => {
  if (!value) return "";
  const clean = value.replace(/[^0-9]/g, "");
  if (clean.length < 4) return clean;
  if (clean.length < 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  if (clean.length < 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
};

const formatJuminNo = (value) => {
  if (!value) return "";
  const clean = value.replace(/[^0-9]/g, "");
  if (clean.length <= 6) return clean;
  return `${clean.slice(0, 6)}-${clean.slice(6, 13)}`;
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    member_id: "",
    password: "",
    password_confirm: "",
    name: "",
    email: "",
    phone_number: "",
    address: "",
    jumin_no: "",
  });

  const [idChecked, setIdChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "member_id") setIdChecked(false);

    if (name === "phone_number") {
      setFormData((prev) => ({
        ...prev,
        phone_number: formatPhoneNumber(value),
      }));
      return;
    }

    if (name === "jumin_no") {
      setFormData((prev) => ({ ...prev, jumin_no: formatJuminNo(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckDuplicate = async () => {
    if (!formData.member_id.trim()) {
      alert("아이디를 입력해주세요.");
      return;
    }
    try {
      const res = await axios.post(`${baseUrl}/auth/check-duplicate/`, {
        field: "member_id",
        value: formData.member_id.trim(),
      });
      if (res.data.is_duplicate) {
        alert("이미 사용 중인 아이디입니다.");
        setIdChecked(false);
      } else {
        alert("사용 가능한 아이디입니다.");
        setIdChecked(true);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "중복 확인 실패",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idChecked) {
      alert("아이디 중복 검사를 먼저 진행해 주세요.");
      return;
    }
    if (formData.password !== formData.password_confirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    const payload = {
      ...formData,
      member_id: formData.member_id.trim(),
      phone_number: formData.phone_number.replace(/[^0-9]/g, ""),
      jumin_no: formData.jumin_no.replace(/[^0-9]/g, ""),
    };

    if (payload.jumin_no.length !== 13) {
      alert("주민등록번호 13자리를 정확히 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/auth/apply/`, payload);
      if (res.data.status === "success") {
        alert(
          "가입 신청이 정상 접수되었습니다!\n관리자 검토 및 승인 후 정식 사번이 발급됩니다.",
        );
        // 요구사항 1: 가입 후 로그인 창이 아닌 홈페이지로 이동
        navigate("/");
      }
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "가입 신청 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon">📝</div>
          <h2 className="auth-title">회원가입 신청</h2>
          <p className="auth-subtitle">
            기본 인적사항을 입력하시면 관리자 승인 후 사번이 부여됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">아이디</label>
            <div className="input-with-button">
              <input
                type="text"
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                required
                placeholder="영문, 숫자 4자 이상"
                className="custom-input"
              />
              <button
                type="button"
                onClick={handleCheckDuplicate}
                className={`btn-check ${idChecked ? "btn-checked" : ""}`}
              >
                {idChecked ? "✓ 확인완료" : "중복검사"}
              </button>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="custom-input"
                placeholder="비밀번호 입력"
              />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호 확인</label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                className="custom-input"
                placeholder="비밀번호 확인"
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">성명</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="custom-input"
                placeholder="이름 입력"
              />
            </div>
            <div className="form-group">
              <label className="form-label">주민등록번호</label>
              <input
                type="text"
                name="jumin_no"
                maxLength={14}
                placeholder="숫자 13자리 입력"
                value={formData.jumin_no}
                onChange={handleChange}
                required
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">개인 이메일</label>
              <input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="custom-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">연락처</label>
              <input
                type="text"
                name="phone_number"
                maxLength={13}
                placeholder="숫자만 입력"
                value={formData.phone_number}
                onChange={handleChange}
                required
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">주소</label>
            <input
              type="text"
              name="address"
              placeholder="거주지 주소 입력"
              value={formData.address}
              onChange={handleChange}
              required
              className="custom-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary auth-submit-btn"
          >
            {loading ? "신청 접수 중..." : "가입 신청하기"}
          </button>
        </form>

        <div
          className="auth-footer-notice"
          style={{ textAlign: "center", marginTop: "16px" }}
        >
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>
            ← 홈페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
