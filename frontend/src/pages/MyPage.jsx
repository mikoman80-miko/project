import { useState, useEffect } from 'react';
import api from '../api';

const MyPage = () => {
  const [info, setInfo] = useState(null);
  const [editForm, setEditForm] = useState({ phone_number: '', address: '' });
  
  // 💡 최적화: 현재 로그인된 사번을 저장할 상태 (원시 타입으로 저장하여 무한 루프 방지)
  const [empId, setEmpId] = useState(null);

  useEffect(() => {
    // 💡 최적화: 로컬 스토리지 파싱을 렌더링 사이클 밖(또는 최초 1회)으로 분리
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const parsedUser = JSON.parse(loggedInUser);
      // 로그인 객체의 속성명에 맞게 안전하게 할당 (emp_id 또는 employee_id)
      const currentEmpId = parsedUser.emp_id || parsedUser.employee_id;
      setEmpId(currentEmpId);

      api.post('/auth/me/', { employee_id: currentEmpId })
        .then(res => {
          setInfo(res.data.data);
          setEditForm({ 
            phone_number: res.data.data.phone_number, 
            address: res.data.data.address 
          });
        })
        .catch(err => console.error(err));
    }
  }, []); // 의존성 배열을 비워 최초 마운트 시 1회만 호출

  const handleUpdate = async () => {
    try {
      await api.post('/employees/update/', {
        employee_id: empId, // 상태에서 가져온 사번 사용
        ...editForm
      });
      alert('내 정보가 안전하게 수정되었습니다.');
    } catch (error) {
      alert('정보 수정 중 오류가 발생했습니다.');
    }
  };

  if (!info) return <div style={{ textAlign: 'center', marginTop: '50px' }}>로딩 중...</div>;

  return (
    <div className="dashboard-container" style={{ maxWidth: '600px', marginTop: '20px' }}>
      <div className="card">
        <h2 className="page-title" style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
          🧑‍💻 내 정보 관리 (마이페이지)
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#475569' }}>공식 사번</span>
            <span className="badge badge-green">{info.emp_code}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#475569' }}>이름 / 아이디</span>
            <span style={{ color: '#334155' }}>{info.name} ({info.employee_id})</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#475569' }}>회사 이메일</span>
            <span style={{ color: '#334155' }}>{info.email}</span>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>* 아래 항목만 개인이 직접 수정할 수 있습니다.</p>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>연락처 수정</label>
            <input type="text" value={editForm.phone_number} onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} className="custom-input" style={{ width: '95%', marginTop: '5px' }} />
          </div>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>거주지 주소 수정</label>
            <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="custom-input" style={{ width: '95%', marginTop: '5px' }} />
          </div>

          <button onClick={handleUpdate} className="btn-primary" style={{ marginTop: '20px', padding: '12px' }}>
            수정 내용 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;