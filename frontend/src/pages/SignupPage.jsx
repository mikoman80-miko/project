import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', password: '' });
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { } });
  const showAlert = (title, message, cb) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => { setModal({ ...modal, isOpen: false }); if (cb) cb(); } });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.contact || !formData.password) {
      return showAlert('입력 오류', '모든 항목을 입력해주세요.');
    }
    const response = await fetch('http://localhost:5000/api/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (data.success) showAlert('요청 완료', '가입 요청이 접수되었습니다. 관리자 승인 후 로그인 가능합니다.', () => navigate('/login'));
    else showAlert('가입 실패', data.message);
  };

  return (
    <div className="signup-container">
      <CustomModal isOpen={modal.isOpen} {...modal} />
      <div className="signup-box">
        <button className="back-btn" onClick={() => navigate('/')}>← 메인으로</button>
        <h2>시스템 가입 요청</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group"><label>이름 (실명)</label><input type="text" name="name" onChange={handleChange} placeholder="홍길동" /></div>
          <div className="input-group"><label>연락처</label><input type="text" name="contact" onChange={handleChange} placeholder="010-0000-0000" /></div>
          <div className="input-group"><label>개인 이메일</label><input type="email" name="email" onChange={handleChange} placeholder="example@gmail.com" /></div>
          <div className="input-group"><label>비밀번호</label><input type="password" name="password" onChange={handleChange} placeholder="비밀번호 입력" /></div>
          <button type="submit" className="submit-btn">가입 요청하기</button>
        </form>
      </div>
    </div>
  );
};
export default SignupPage;
