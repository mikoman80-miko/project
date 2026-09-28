import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 수정 가능한 개인정보 상태
  const [editForm, setEditForm] = useState({
    password: '',
    phone: '',
    department: '',
  });

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (!storedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditForm({
        password: '', // 비밀번호는 보통 빈칸으로 둡니다
        phone: parsedUser.phone || '',
        department: parsedUser.department || '',
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // 10번 반영: 백엔드의 사용자 정보 업데이트 API 연동 부분
      /*
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      */

      // 임시 성공 알림 (백엔드 연동 후 위 주석을 해제하여 사용하세요)
      alert('개인정보가 성공적으로 수정되었습니다.');

      // 수정 완료 후 sessionStorage를 갱신하는 로직이 필요할 수 있습니다.
    } catch (error) {
      alert('수정 실패: 서버 오류');
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #2c3e50', paddingBottom: '10px', marginBottom: '20px' }}>My Page</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>개인정보 및 계정 상태를 관리할 수 있습니다.</p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

        {/* 수정 불가능한 기본 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>아이디 (사원번호)</label>
          <input type="text" value={user.userId || user.email || '사번 정보 없음'} disabled style={{ padding: '10px', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>이름</label>
          <input type="text" value={user.name || ''} disabled style={{ padding: '10px', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>권한</label>
          <input type="text" value={user.role || '권한 없음'} disabled style={{ padding: '10px', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '4px', color: '#e74c3c', fontWeight: 'bold' }} />
        </div>

        {/* 수정 가능한 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>소속 부서</label>
          <input type="text" name="department" value={editForm.department} onChange={handleChange} placeholder="부서를 입력하세요" style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>연락처</label>
          <input type="text" name="phone" value={editForm.phone} onChange={handleChange} placeholder="010-0000-0000" style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>새 비밀번호</label>
          <input type="password" name="password" value={editForm.password} onChange={handleChange} placeholder="변경할 비밀번호 입력 (변경하지 않으려면 비워두세요)" style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            저장하기
          </button>
          <button type="button" onClick={() => navigate('/')} style={{ flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            홈으로 돌아가기
          </button>
        </div>
      </form>
    </div>
  );
};

export default MyPage;
