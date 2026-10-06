import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    member_id: '', password: '', name: '', email: '', 
    phone_number: '', jumin_no: '', address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkDuplicate = async (field, value) => {
    try {
      const response = await api.post('/auth/check-duplicate/', {
        field: field,
        value: value
      });
      return response.data; 
    } catch (error) {
      console.error("중복 검사 중 오류:", error);
      return { is_duplicate: false }; 
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    const cleanPhoneNumber = formData.phone_number.replace(/-/g, '');
    const cleanJuminNo = formData.jumin_no.replace(/-/g, '');

    // 💡 최적화: 4개의 중복 검사 API를 동시에 호출하여 대기 시간 획기적 단축
    const [idCheck, emailCheck, phoneCheck, juminCheck] = await Promise.all([
      checkDuplicate('member_id', formData.member_id),
      checkDuplicate('email', formData.email),
      checkDuplicate('phone_number', cleanPhoneNumber),
      checkDuplicate('jumin_no', cleanJuminNo)
    ]);

    // 에러가 있다면 첫 번째 에러 메시지만 띄우고 중단
    if (idCheck.is_duplicate) { alert(idCheck.message); return; }
    if (emailCheck.is_duplicate) { alert(emailCheck.message); return; }
    if (phoneCheck.is_duplicate) { alert(phoneCheck.message); return; }
    if (juminCheck.is_duplicate) { alert(juminCheck.message); return; }

    try {
      const submitData = { 
        member_id: formData.member_id, 
        password: formData.password,
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phone_number: cleanPhoneNumber,
        jumin_no: cleanJuminNo
      };

      const response = await api.post('/auth/apply/', submitData);
      
      if (response.status === 201) {
        alert('가입 신청이 완료되었습니다! 관리자 승인을 대기해주세요.');
        navigate('/login');
      }
    } catch (error) {
      alert('가입 신청 중 서버 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>📝 사원 가입 신청</h2>
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
        <input name="member_id" placeholder="희망 아이디 (로그인용)" onChange={handleChange} required style={{ padding: '10px' }} />
        <input name="password" type="password" placeholder="비밀번호" onChange={handleChange} required style={{ padding: '10px' }} />
        <input name="name" placeholder="이름 (동명이인 허용)" onChange={handleChange} required style={{ padding: '10px' }} />
        <input name="email" type="email" placeholder="개인 이메일" onChange={handleChange} required style={{ padding: '10px' }} />
        <input name="phone_number" placeholder="전화번호 (예: 010-1234-5678)" onChange={handleChange} required style={{ padding: '10px' }} />
        {/* 💡 보안: 코드 상의 민감 정보 포맷 예시 텍스트 블라인드 처리 */}
        <input name="jumin_no" placeholder="주민번호 앞/뒷자리 (예: [RRN Omitted])" onChange={handleChange} required style={{ padding: '10px' }} />
        <input name="address" placeholder="주소" onChange={handleChange} required style={{ padding: '10px' }} />
        
        <button type="submit" style={{ padding: '12px', marginTop: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          가입 신청하기
        </button>
        <button type="button" onClick={() => navigate('/login')} style={{ padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          취소하고 돌아가기
        </button>
      </form>
    </div>
  );
};

export default Signup;