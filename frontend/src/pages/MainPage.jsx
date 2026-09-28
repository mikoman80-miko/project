import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css'; // 기존 홈페이지 CSS 적용

const MainPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [homeData, setHomeData] = useState({
    heroTitle: '', heroDesc: '',
    feature1Title: '', feature1Desc: '',
    feature2Title: '', feature2Desc: '',
    feature3Title: '', feature3Desc: ''
  });

  // CMS(관리자 수정) 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    // 1. 세션 확인 (중요: 로그인이 안 되어 있어도 튕겨내지 않습니다!)
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (user) setCurrentUser(user);

    // 2. 홈페이지 텍스트 데이터 불러오기
    fetch('http://localhost:5000/api/homepage')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHomeData(data.homepageData);
          setEditData(data.homepageData);
        }
      })
      .catch(err => console.error("데이터 불러오기 실패:", err));
  }, []);

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      const data = await res.json();
      if (data.success) {
        setHomeData(editData);
        setIsEditing(false);
        alert('홈페이지 내용이 성공적으로 수정되었습니다.');
      }
    } catch (error) {
      alert('수정 실패: 서버 오류');
    }
  };

  const isAdmin = currentUser?.role === '관리자';

  return (
    <div className="main-page-container">
      {/* 1. 상단 네비게이션 바 */}
      <header className="main-header">
        <div className="logo" onClick={() => navigate('/')}>SecureTech</div>
        <div className="header-actions">
          {currentUser ? (
            <>
              <span className="welcome-msg"><strong>{currentUser.name}</strong> 님 환영합니다</span>
              <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>인트라넷 입장</button>
              {isAdmin && (
                <button className="edit-toggle-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                  {isEditing ? '💾 저장하기' : '⚙️ 홈페이지 수정'}
                </button>
              )}
            </>
          ) : (
            <>
              <button className="login-link-btn" onClick={() => navigate('/login')}>로그인</button>
              <button className="signup-link-btn" onClick={() => navigate('/signup')}>가입하기</button>
            </>
          )}
        </div>
      </header>

      {/* 2. 히어로 (메인 배너) 섹션 */}
      <section className="hero-section">
        <div className="hero-content">
          {isEditing ? (
            <>
              <input type="text" name="heroTitle" className="edit-input hero-title-edit" value={editData.heroTitle} onChange={handleChange} />
              <textarea name="heroDesc" className="edit-input hero-desc-edit" value={editData.heroDesc} onChange={handleChange} />
            </>
          ) : (
            <>
              <h1 className="hero-title">{homeData.heroTitle}</h1>
              <p className="hero-desc">{homeData.heroDesc}</p>
            </>
          )}

          {/* 비로그인 방문자에게만 보여지는 가입 유도 버튼 */}
          {!currentUser && (
            <button className="hero-signup-btn" onClick={() => navigate('/signup')}>
              지금 접근 권한 요청하기
            </button>
          )}
        </div>
      </section>

      {/* 3. 특징 (Features) 카드 섹션 */}
      <section className="features-section">
        <div className="features-grid">
          {/* 카드 1 */}
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            {isEditing ? (
              <><input type="text" name="feature1Title" className="edit-input" value={editData.feature1Title} onChange={handleChange} /><textarea name="feature1Desc" className="edit-input" value={editData.feature1Desc} onChange={handleChange} /></>
            ) : (
              <><h3>{homeData.feature1Title}</h3><p>{homeData.feature1Desc}</p></>
            )}
          </div>
          {/* 카드 2 */}
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            {isEditing ? (
              <><input type="text" name="feature2Title" className="edit-input" value={editData.feature2Title} onChange={handleChange} /><textarea name="feature2Desc" className="edit-input" value={editData.feature2Desc} onChange={handleChange} /></>
            ) : (
              <><h3>{homeData.feature2Title}</h3><p>{homeData.feature2Desc}</p></>
            )}
          </div>
          {/* 카드 3 */}
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            {isEditing ? (
              <><input type="text" name="feature3Title" className="edit-input" value={editData.feature3Title} onChange={handleChange} /><textarea name="feature3Desc" className="edit-input" value={editData.feature3Desc} onChange={handleChange} /></>
            ) : (
              <><h3>{homeData.feature3Title}</h3><p>{homeData.feature3Desc}</p></>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
