import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [homeData, setHomeData] = useState({
    heroTitle: '', heroDesc: '', feature1Title: '', feature1Desc: '', feature2Title: '', feature2Desc: '', feature3Title: '', feature3Desc: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const userStr = sessionStorage.getItem('loggedInUser');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) setCurrentUser(user);

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

  const handleChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/homepage', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
      });
      const data = await res.json();
      if (data.success) { setHomeData(editData); setIsEditing(false); alert('수정되었습니다.'); }
    } catch (error) { alert('수정 실패: 서버 오류'); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    setCurrentUser(null);
    alert('로그아웃 되었습니다.');
  };

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === '관리자';

  // ★ 추가: 임직원(사원, 관리자)인지 확인하는 변수
  const isEmployee = currentUser && ['임직원', '사원', '관리자', 'ADMIN'].includes(currentUser.role);

  return (
    <div className="main-page-container">
      <header className="main-header">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SecureTech</div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentUser ? (
            <>
              <span className="welcome-msg" onClick={() => navigate('/mypage')} style={{ fontSize: '15px', color: '#2c3e50', cursor: 'pointer', textDecoration: 'underline' }}>
                <strong>{currentUser.name}</strong> 님 환영합니다.
              </span>

              {/* ★ 수정: isEmployee(임직원/관리자)일 때만 그룹웨어 입장 버튼 노출 */}
              {isEmployee && (
                <button className="dashboard-btn" onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  그룹웨어 입장
                </button>
              )}

              <button className="nav-btn" onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                로그아웃
              </button>

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
          {!currentUser && (<button className="hero-signup-btn" onClick={() => navigate('/signup')}>지금 접근 권한 요청하기</button>)}
        </div>
      </section>

      {/* 3. 특징 (Features) 카드 섹션 */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            {isEditing ? (<><input type="text" name="feature1Title" className="edit-input" value={editData.feature1Title} onChange={handleChange} /><textarea name="feature1Desc" className="edit-input" value={editData.feature1Desc} onChange={handleChange} /></>) : (<><h3>{homeData.feature1Title}</h3><p>{homeData.feature1Desc}</p></>)}
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            {isEditing ? (<><input type="text" name="feature2Title" className="edit-input" value={editData.feature2Title} onChange={handleChange} /><textarea name="feature2Desc" className="edit-input" value={editData.feature2Desc} onChange={handleChange} /></>) : (<><h3>{homeData.feature2Title}</h3><p>{homeData.feature2Desc}</p></>)}
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            {isEditing ? (<><input type="text" name="feature3Title" className="edit-input" value={editData.feature3Title} onChange={handleChange} /><textarea name="feature3Desc" className="edit-input" value={editData.feature3Desc} onChange={handleChange} /></>) : (<><h3>{homeData.feature3Title}</h3><p>{homeData.feature3Desc}</p></>)}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
