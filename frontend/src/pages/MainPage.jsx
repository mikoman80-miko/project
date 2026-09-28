/**
 * 파일명: MainPage.jsx
 * 역할: 일반인 대상 회사 소개 홈페이지 및 관리자 실시간 수정(CMS) 기능
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // 홈페이지에 보여줄 텍스트 데이터 상태
  const [pageData, setPageData] = useState({
    heroTitle: '', heroDesc: '',
    feature1Title: '', feature1Desc: '',
    feature2Title: '', feature2Desc: '',
    feature3Title: '', feature3Desc: ''
  });

  // 관리자 수정 모드 관련 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // 커스텀 모달 상태
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { } });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal({ ...modal, isOpen: false }) });

  // 1. 화면이 켜지면 유저 정보 확인 및 서버에서 홈페이지 텍스트 가져오기
  useEffect(() => {
    // 세션 스토리지에서 현재 로그인한 유저 확인 (관리자인지 체크하기 위함)
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (storedUserData) {
      setCurrentUser(JSON.parse(storedUserData));
    }
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/homepage');
      const data = await response.json();
      if (data.success) {
        setPageData(data.homepageData);
      }
    } catch (error) {
      console.error("홈페이지 데이터를 불러오지 못했습니다.");
    }
  };

  // 2. [관리자] 수정 모드 켜기
  const startEditing = () => {
    setEditData(pageData); // 현재 화면에 보이는 데이터를 수정 폼에 그대로 복사
    setIsEditing(true);
  };

  // 3. [관리자] 수정 폼 입력 시 데이터 변경
  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // 4. [관리자] 수정 완료 후 서버로 전송
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      const data = await response.json();

      if (data.success) {
        showAlert('수정 완료', data.message);
        setPageData(editData); // 화면에 즉시 새 데이터 반영
        setIsEditing(false);   // 수정 모드 종료
      }
    } catch (error) {
      showAlert('오류', '수정 내용을 저장할 수 없습니다.');
    }
  };

  return (
    <div className="main-container">
      <CustomModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} />

      {/* 헤더 네비게이션 */}
      <header className="main-header">
        <div className="logo">SecureTech</div>
        <nav className="header-nav">
          {/* 현재 로그인한 사람이 관리자라면 '홈페이지 수정' 버튼 노출 */}
          {currentUser && currentUser.role === '관리자' && !isEditing && (
            <button className="edit-mode-btn" onClick={startEditing}>홈페이지 수정</button>
          )}
          {isEditing && (
            <div className="edit-actions">
              <button className="cancel-edit-btn" onClick={() => setIsEditing(false)}>취소</button>
              <button className="save-edit-btn" onClick={handleSave}>변경사항 저장</button>
            </div>
          )}

          {/* 로그인 상태에 따라 버튼 변경 */}
          {currentUser ? (
            <button className="nav-login-btn" onClick={() => navigate('/dashboard')}>인트라넷 입장</button>
          ) : (
            <button className="nav-login-btn" onClick={() => navigate('/login')}>임직원 로그인</button>
          )}
        </nav>
      </header>

      {/* 메인 배너 영역 */}
      <main className="hero-section">
        <div className="hero-content">
          {isEditing ? (
            <div className="edit-field">
              <input name="heroTitle" value={editData.heroTitle} onChange={handleChange} className="edit-input title-input" />
              <textarea name="heroDesc" value={editData.heroDesc} onChange={handleChange} className="edit-input desc-input" rows="2" />
            </div>
          ) : (
            <>
              <h1>{pageData.heroTitle}</h1>
              <p>{pageData.heroDesc}</p>
            </>
          )}
        </div>
      </main>

      {/* 회사 특징(Feature) 소개 영역 */}
      <section className="features-section">
        {[1, 2, 3].map((num) => (
          <div className="feature-card" key={num}>
            <div className="feature-icon">{num === 1 ? '🔒' : num === 2 ? '💻' : '⚡'}</div>
            {isEditing ? (
              <div className="edit-field">
                <input name={`feature${num}Title`} value={editData[`feature${num}Title`]} onChange={handleChange} className="edit-input feature-title-input" />
                <textarea name={`feature${num}Desc`} value={editData[`feature${num}Desc`]} onChange={handleChange} className="edit-input feature-desc-input" rows="3" />
              </div>
            ) : (
              <>
                <h3>{pageData[`feature${num}Title`]}</h3>
                <p>{pageData[`feature${num}Desc`]}</p>
              </>
            )}
          </div>
        ))}
      </section>

      {/* 회사 정보 푸터 */}
      <footer className="main-footer">
        <p>상호명: (주)SecureTech | 대표: 윤두상 | 사업자등록번호: 123-45-67890</p>
        <p>&copy; 2026 SecureTech Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainPage;
