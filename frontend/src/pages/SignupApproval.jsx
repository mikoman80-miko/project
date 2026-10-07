import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SignupApproval = () => {
  const [pendingList, setPendingList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${baseUrl}/approvals/pending/`);
      if (Array.isArray(res.data)) {
        setPendingList(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setPendingList(res.data.data);
      }
    } catch (err) {
      console.error('가입 대기자 목록 조회 실패:', err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // 승인 처리 (role: 'employee' 또는 'general')
  const handleApprove = async (memberId, name, role) => {
    const roleName = role === 'employee' ? '정규 사원(사번/사내메일 발급)' : '일반 회원';
    if (!window.confirm(`${name}(${memberId}) 님을 [${roleName}]으로 승인하시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/approvals/approve/`, {
        member_id: memberId,
        role: role
      });
      if (res.data.status === 'success') {
        alert(res.data.message);
        fetchPending();
      }
    } catch (err) {
      alert(err.response?.data?.message || '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 반려 처리
  const handleReject = async (memberId, name) => {
    if (!window.confirm(`${name}(${memberId}) 님의 가입 요청을 반려(삭제)하시겠습니까?`)) return;

    try {
      const res = await axios.post(`${baseUrl}/approvals/reject/`, {
        member_id: memberId
      });
      if (res.data.status === 'success') {
        alert('가입 요청이 반려되었습니다.');
        fetchPending();
      }
    } catch (err) {
      alert('반려 처리 중 오류 발생');
    }
  };

  // 검색 필터링 (아이디, 성명, 연락처, 이메일)
  const filteredList = pendingList.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      (m.member_id && m.member_id.toLowerCase().includes(term)) ||
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.phone_number && m.phone_number.includes(term)) ||
      (m.email && m.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">📝 신규 회원 가입 승인 관리</h2>
        <p className="page-subtitle">
          신청자를 검색하고 [사원 승인] 또는 [일반 승인]을 선택하여 계정을 발급합니다.
        </p>
      </div>

      <div className="card">
        {/* 상단 검색 툴바 */}
        <div className="card-toolbar">
          <div className="search-box">
            <input
              type="text"
              className="custom-input search-input"
              placeholder="🔍 아이디, 이름, 연락처, 이메일 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-stats">
            대기 신청: <strong className="stat-count">{filteredList.length}</strong> 건
          </div>
        </div>

        {/* 대기자 목록 테이블 */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>신청 일자</th>
                <th style={{ width: '130px' }}>신청 ID</th>
                <th style={{ width: '100px' }}>이름</th>
                <th>개인 이메일</th>
                <th style={{ width: '130px' }}>연락처</th>
                <th>주소</th>
                <th style={{ width: '240px', textAlign: 'center' }}>승인 / 반려</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length > 0 ? (
                filteredList.map((m) => (
                  <tr key={m.member_id}>
                    <td className="cell-time">{m.date_of_request}</td>
                    <td className="cell-emp-name">{m.member_id}</td>
                    <td style={{ fontWeight: '500' }}>{m.name}</td>
                    <td className="cell-email">{m.email}</td>
                    <td className="cell-phone">{m.phone_number}</td>
                    <td className="cell-address">{m.address || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-btn-group">
                        <button
                          type="button"
                          className="btn-action btn-action-employee"
                          onClick={() => handleApprove(m.member_id, m.name, 'employee')}
                          disabled={loading}
                          title="공식 사번 및 사내 이메일 부여"
                        >
                          💼 사원 승인
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action-general"
                          onClick={() => handleApprove(m.member_id, m.name, 'general')}
                          disabled={loading}
                          title="기본 회원 활성화"
                        >
                          👤 일반 승인
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action-reject"
                          onClick={() => handleReject(m.member_id, m.name)}
                          disabled={loading}
                        >
                          반려
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="table-empty">
                    {searchTerm ? '검색 조건과 일치하는 가입 신청 내역이 없습니다.' : '현재 대기 중인 가입 신청 내역이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SignupApproval;