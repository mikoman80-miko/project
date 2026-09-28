/**
 * 파일명: SignupPage.jsx
 * 역할: 외부인이 사내 시스템 접속을 위해 관리자에게 가입(접근 권한)을 요청하는 화면
 * 
 * [주요 변수 및 함수 안내]
 * @variable {object} formData - 사용자가 입력한 이름, 부서, 아이디, 비밀번호를 한 번에 관리하는 상태 객체
 * @variable {function} navigate - 가입 요청 완료 후 페이지를 이동시키기 위한 함수
 * @function handleChange - 입력칸(input)에 값을 입력할 때마다 formData를 실시간으로 업데이트하는 함수
 * @function handleSubmit - '가입 요청' 버튼을 눌렀을 때 백엔드로 데이터를 전송하는 함수
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css'; // 전용 CSS 스타일 불러오기

const SignupPage = () => {
  const navigate = useNavigate();

  // 여러 개의 입력값을 하나의 객체(Object)로 깔끔하게 관리합니다.
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    userId: '',
    password: ''
  });

  // 입력칸에 변화가 생길 때 실행되는 함수
  const handleChange = (e) => {
    // 이벤트가 발생한 입력칸의 name 속성과 현재 입력된 value를 가져옵니다.
    const { name, value } = e.target;

    // 기존 데이터(...formData)는 유지하되, 현재 입력 중인 항목([name])만 업데이트합니다.
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 폼 전송 이벤트 처리 함수
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.userId || !formData.password) {
      alert('이름, 아이디, 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    try {
      // WAS 서버로 회원가입 데이터 전송 (POST 요청)
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // 서버에서 성공 응답이 오면 알림을 띄우고 로그인 페이지로 이동
        alert(`[${formData.name}]님의 가입 요청이 완료되었습니다.\n관리자 승인 후 로그인할 수 있습니다.`);
        navigate('/login');
      } else {
        // 아이디 중복 등 서버에서 에러를 보냈을 경우
        alert(`가입 실패: ${data.message}`);
      }
    } catch (error) {
      console.error('가입 요청 중 오류 발생:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        {/* 뒤로 가기 버튼 */}
        <button className="back-btn" onClick={() => navigate('/login')}>
          ← 로그인 화면으로
        </button>

        <h2>사내 시스템 접근 요청</h2>
        <p className="signup-desc">관리자의 승인 후 그룹웨어 이용이 가능합니다.</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="name">이름 (실명)</label>
            <input
              type="text"
              id="name"
              name="name" // handleChange에서 식별하기 위한 이름
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 홍길동"
            />
          </div>

          <div className="input-group">
            <label htmlFor="department">소속 / 부서 (선택)</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="예: 외부협력업체, 보안개발팀"
            />
          </div>

          <div className="input-group">
            <label htmlFor="userId">사용할 아이디</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="영문, 숫자 조합"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호 입력"
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
