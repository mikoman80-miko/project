import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 연락처 자동 하이픈 함수
const formatPhoneNumber = (value) => {
  if (!value) return '';
  const clean = value.replace(/[^0-9]/g, '');
  if (clean.length < 4) return clean;
  if (clean.length < 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  if (clean.length < 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
};

const MyPage = () => {
  const [profile, setProfile] = useState({
    employee_id: '',
    name: '',
    email: '',
    phone_number: '',
    address: '',
    emp_code: '',
    hire_date: '',
    new_password: ''
  });
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.emp_id) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
      return;
    }
    axios.get(`${baseUrl}/auth/profile/?employee_id=${user.emp_id}`)
      .then(res => {
        const data = res.data || {};
        setProfile(prev => ({
          ...prev,
          ...data,
          phone_number: formatPhoneNumber(data.phone_number || '')
        }));
      })
      .catch(err => console.error(err));
  }, []);

  const handlePhoneChange = (e) => {
    setProfile(prev => ({
      ...prev,
      phone_number: formatPhoneNumber(e.target.value)
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // DB 저장 시 하이픈 제거한 순수 숫자로 전송
    const payload = {
      ...profile,
      phone_number: profile.phone_number.replace(/[^0-9]/g, '')
    };

    try {
      const res = await axios.put(`${baseUrl}/auth/profile/`, payload);
      if (res.data.status === 'success') {
        alert(res.data.message || '회원 정보가 성공적으로 수정되었습니다.');
        setProfile(prev => ({ ...prev, new_password: '' }));
      }
    } catch (err) {
      alert(err.response?.data?.message || '수정 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="page-header">
        <h2 className="page-title">👤 내 정보 관리 (마이페이지)</h2>
        <p className="page-subtitle">개인 인적사항 및 비밀번호를 안전하게 변경할 수 있습니다.</p>
      </div>

      <div className="card form-container-card">
        <form onSubmit={handleUpdate} className="form-stack">
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">아이디</label>
              <input 
                type="text" 
                value={profile.employee_id} 
                disabled 
                className="custom-input input-disabled" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">발급 사번</label>
              <input 
                type="text" 
                value={profile.emp_code || '일반 회원'} 
                disabled 
                className="custom-input input-disabled" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">이메일</label>
            <input 
              type="text" 
              value={profile.email} 
              disabled 
              className="custom-input input-disabled" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">성명</label>
            <input 
              type="text" 
              className="custom-input"
              value={profile.name} 
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">연락처</label>
            <input 
              type="text" 
              className="custom-input"
              maxLength={13}
              placeholder="숫자만 입력 (자동 하이픈)"
              value={profile.phone_number} 
              onChange={handlePhoneChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">주소</label>
            <input 
              type="text" 
              className="custom-input"
              value={profile.address} 
              onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
              required 
            />
          </div>

          <div className="form-divider-section">
            <div className="form-group">
              <label className="form-label text-danger">새 비밀번호 (변경 시에만 입력)</label>
              <input 
                type="password" 
                className="custom-input"
                placeholder="변경할 새 비밀번호 입력" 
                value={profile.new_password} 
                onChange={(e) => setProfile({ ...profile, new_password: e.target.value })} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary form-submit-btn"
          >
            {loading ? '수정 중...' : '회원 정보 수정 저장'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyPage;