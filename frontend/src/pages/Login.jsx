import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // 💡 최적화: SPA 라우팅을 위한 훅 추가

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!empId || !password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await api.post('/auth/login/', {
        employee_id: empId, 
        password: password
      });

      if (response.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // 💡 최적화: 전체 새로고침 없이 대시보드로 즉시 라우팅 (App.jsx의 상태관리에 따라 window.location.href를 유지해도 무방함)
        window.location.href = '/'; 
      } else {
        alert(response.data.message || '아이디 또는 비밀번호가 일치하지 않습니다.');
      }
      
    } catch (error) {
      console.error("로그인 에러:", error);

      if (!error.response) {
        alert('백엔드 서버와 통신할 수 없습니다.\n파이참(PyCharm)에서 서버(runserver)가 켜져 있는지 확인해 주세요!');
        return;
      }

      const serverData = error.response.data;
      if (serverData && serverData.message) {
        alert(serverData.message);
      } else if (serverData && serverData.error) {
        alert(serverData.error);
      } else {
        alert('등록되지 않은 아이디이거나 비밀번호가 일치하지 않습니다.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '30px', color: '#1e293b' }}>🔒 인트라넷 로그인</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="개인 아이디 (ID)" 
          value={empId} 
          onChange={(e) => setEmpId(e.target.value)} 
          className="custom-input" 
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="custom-input" 
        />
        <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '10px' }}>
          로그인
        </button>
      </form>
      
      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          아직 계정이 없으신가요? <Link to="/signup" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>사원 가입 신청</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;