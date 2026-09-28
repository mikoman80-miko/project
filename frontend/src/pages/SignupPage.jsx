/**
 * 파일명: SignupPage.jsx
 * 역할: 사내 시스템 접근 권한(가입) 요청 화면 (커스텀 모달 적용)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal'; // ★ 커스텀 모달 불러오기
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    userId: '',
    password: ''
  });

  // === [UX 추가] 커스텀 모달 제어를 위한 상태 ===
  const [modal, setModal] = useState({
    isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }
  });

  // 모달을 띄우는 도우미 함수 (콜백 함수 지원)
  const showAlert = (title, message, callback = null) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setModal({ ...modal, isOpen: false }); // 모달 닫기
        if (callback) callback();              // 전달받은 함수(예: 페이지 이동) 실행
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 필수 입력값 검증
    if (!formData.name || !formData.userId || !formData.password) {
      showAlert('입력 오류', '이름, 아이디, 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    // 2. WAS(Backend) 서버로 데이터 전송
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // ★ 성공 시 모달을 띄우고, [확인]을 누르면 로그인 페이지로 이동합니다.
        showAlert(
          '요청 완료',
          `[${formData.name}]님의 가입 요청이 접수되었습니다.\n관리자 승인 후 로그인할 수 있습니다.`,
          () => {
            navigate('/login');
          }
        );
      } else {
        // 아이디 중복 등 서버 에러 발생 시
        showAlert('가입 실패', data.message);
      }
    } catch (error) {
      console.error('가입 요청 중 오류 발생:', error);
      showAlert('네트워크 오류', '서버와 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.');
    }
  };

  return (
    <div className="signup-container">
      {/* 1. 커스텀 모달 마운트 */}
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />

      <div className="signup-box">
        <button className="back-btn" onClick={() => navigate('/login')}>
          ← 로그인 화면으로
        </button>

        <h2>사내 시스템 접근 요청</h2>
        <p className="signup-desc">관리자의 승인 후 그룹웨어 이용이 가능합니다.</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="name">이름 (실명)</label>
            <input
              type="text" id="name" name="name"
              value={formData.name} onChange={handleChange} placeholder="예: 홍길동"
            />
          </div>

          <div className="input-group">
            <label htmlFor="department">소속 / 부서 (선택)</label>
            <input
              type="text" id="department" name="department"
              value={formData.department} onChange={handleChange} placeholder="예: 외부협력업체, 보안개발팀"
            />
          </div>

          <div className="input-group">
            <label htmlFor="userId">사용할 아이디</label>
            <input
              type="text" id="userId" name="userId"
              value={formData.userId} onChange={handleChange} placeholder="영문, 숫자 조합"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password" id="password" name="password"
              value={formData.password} onChange={handleChange} placeholder="비밀번호 입력"
            />
          </div>

          <button type="submit" className="submit-btn">
            접근 권한 요청하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
