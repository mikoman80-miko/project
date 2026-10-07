import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setUser }) => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const adminServerUrl = import.meta.env.VITE_ADMIN_SERVER_URL || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/auth/login/`, {
        employee_id: empId.trim(),
        password: password
      });

      if (response.data.status === 'success') {
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        if (setUser) setUser(userData);

        if (userData.is_manager) {
          if (adminServerUrl && !window.location.href.startsWith(adminServerUrl)) {
            window.location.href = `${adminServerUrl}/dashboard`;
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          window.location.href = '/';
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert(error.response.data.message || '관리자 계정은 사내 관리망 IP에서만 접근 가능합니다.');
      } else {
        alert('등록되지 않은 관리자 아이디이거나 비밀번호가 일치하지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-icon">🛡️</div>
          <h2 className="auth-title">관리자 로그인</h2>
          <p className="auth-subtitle">보안 관제 콘솔 접속을 위해 관리자 계정을 입력해 주세요.</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">관리자 아이디</label>
            <input 
              type="text" 
              className="custom-input" 
              placeholder="관리자 아이디 입력" 
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
            {loading ? '인증 중...' : '관리자 로그인'}
          </button>
        </form>

        <div className="auth-footer-notice">
          ※ 관리자 콘솔은 인가된 사내 보안망 IP 대역에서만 접속이 허용됩니다[cite: 32].
        </div>
      </div>
    </div>
  );
};

export default Login;