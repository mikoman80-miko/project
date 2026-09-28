import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './BoardPage.css'; // 사이드바 CSS 공유
import './AdminApprovalPage.css'; // 하단에 추가할 CSS

const AdminApprovalPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [activeTab, setActiveTab] = useState('pending'); // pending, users, teams

  // 데이터 상태
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 승인용 모달 상태
  const [approveModal, setApproveModal] = useState({ isOpen: false, targetUser: null, role: '일반회원', team: '' });

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }, onCancel: () => { } });
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal({ ...modal, isOpen: false }) });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user || user.role !== '관리자') { alert('권한이 없습니다.'); navigate('/'); }
    else { setCurrentUser(user); fetchPendingAndTeams(); fetchAllUsers(); }
  }, [navigate]);

  const fetchPendingAndTeams = async () => {
    const res = await fetch('http://localhost:5000/api/admin/pending');
    const data = await res.json();
    if (data.success) { setPendingUsers(data.pendingUsers); setTeams(data.teams); }
  };

  const fetchAllUsers = async () => {
    const res = await fetch('http://localhost:5000/api/admin/users');
    const data = await res.json();
    if (data.success) setAllUsers(data.users);
  };

  // 1. 가입 승인 버튼 클릭 시 -> 역할 지정 모달 띄우기
  const openApproveDialog = (user) => {
    setApproveModal({ isOpen: true, targetUser: user, role: '일반회원', team: teams[0] || '' });
  };

  // 2. 최종 승인 처리 실행
  const executeApprove = async () => {
    const res = await fetch('http://localhost:5000/api/admin/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: approveModal.targetUser.email, role: approveModal.role, team: approveModal.team })
    });
    const data = await res.json();
    if (data.success) {
      let msg = `${approveModal.targetUser.name}님이 승인되었습니다.`;
      if (approveModal.role === '임직원') {
        msg += `\n[사번: ${data.user.empId}]\n[계정: ${data.user.email}]로 변경 발급되었습니다.`;
      }
      showAlert('승인 완료', msg);
      setApproveModal({ ...approveModal, isOpen: false });
      fetchPendingAndTeams(); fetchAllUsers();
    }
  };

  const handleReject = async (email) => {
    await fetch('http://localhost:5000/api/admin/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    showAlert('반려 완료', '삭제되었습니다.'); fetchPendingAndTeams();
  };

  const handleAddTeam = async () => {
    const newTeam = prompt('추가할 팀(부서) 이름을 입력하세요:');
    if (newTeam) {
      await fetch('http://localhost:5000/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team: newTeam }) });
      showAlert('팀 추가', `${newTeam}이(가) 추가되었습니다.`); fetchPendingAndTeams();
    }
  };

  // 검색 필터링 로직
  const filteredUsers = allUsers.filter(u =>
    u.name.includes(searchKeyword) ||
    (u.empId && u.empId.includes(searchKeyword)) ||
    (u.department && u.department.includes(searchKeyword))
  );

  if (!currentUser) return null;

  return (
    <div className="board-container">
      <CustomModal isOpen={modal.isOpen} {...modal} />

      {/* 승인 시 권한 부여 커스텀 모달 (인라인) */}
      {approveModal.isOpen && (
        <div className="overlay">
          <div className="modal-box">
            <h3>{approveModal.targetUser.name} 님 권한 부여</h3>
            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>구분:</label>
              <select value={approveModal.role} onChange={(e) => setApproveModal({ ...approveModal, role: e.target.value })} style={{ width: '100%', padding: '10px' }}>
                <option value="일반회원">일반 회원 (외부 협력사 등)</option>
                <option value="임직원">사내 임직원 (사번 발급)</option>
              </select>

              {approveModal.role === '임직원' && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '10px' }}>소속 부서(팀):</label>
                  <select value={approveModal.team} onChange={(e) => setApproveModal({ ...approveModal, team: e.target.value })} style={{ width: '100%', padding: '10px' }}>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setApproveModal({ ...approveModal, isOpen: false })} style={{ padding: '10px 20px', cursor: 'pointer' }}>취소</button>
              <button onClick={executeApprove} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', cursor: 'pointer' }}>최종 승인</button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header"><h2>SecureTech</h2><p>Admin</p></div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/')}>메인 홈페이지</li>
          <li onClick={() => navigate('/dashboard')}>인트라넷 홈</li>
          <li className="active">인사/계정 관리</li>
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header">
          <h2>통합 인사 관리 시스템</h2>
        </header>

        <section className="board-content">
          <div className="admin-tabs">
            <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>승인 대기함 ({pendingUsers.length})</button>
            <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>임직원/회원 현황 조회</button>
            <button className={activeTab === 'teams' ? 'active' : ''} onClick={() => setActiveTab('teams')}>조직(팀) 관리</button>
          </div>

          {activeTab === 'pending' && (
            <div className="board-list-view">
              <table className="board-table">
                <thead><tr><th>신청일</th><th>이름</th><th>연락처</th><th>가입 이메일</th><th>관리</th></tr></thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.date}</td><td>{user.name}</td><td>{user.contact}</td><td>{user.email}</td>
                      <td>
                        <button onClick={() => openApproveDialog(user)} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>권한심사</button>
                        <button onClick={() => handleReject(user.email)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>반려</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="board-list-view">
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <h3>전체 등록 현황</h3>
                <input type="text" placeholder="이름, 사번, 팀명 검색..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ padding: '8px', width: '250px' }} />
              </div>
              <table className="board-table">
                <thead><tr><th>상태</th><th>사번/권한</th><th>이름</th><th>소속</th><th>시스템 계정(이메일)</th><th>연락처</th></tr></thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr key={idx} style={{ color: user.status === '퇴사' ? '#999' : '#333', textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>
                      <td style={{ fontWeight: 'bold', color: user.status === '재직' ? '#2ecc71' : user.status === '퇴사' ? '#e74c3c' : '#f39c12' }}>{user.status}</td>
                      <td>{user.empId || '일반회원'}</td>
                      <td>{user.name}</td>
                      <td>{user.department || '-'}</td>
                      <td>{user.email}</td>
                      <td>{user.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="board-list-view">
              <button onClick={handleAddTeam} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>+ 새 부서 추가</button>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {teams.map((team, idx) => (
                  <li key={idx} style={{ padding: '15px', borderBottom: '1px solid #eee', fontSize: '16px' }}>🏢 {team}</li>
                ))}
              </ul>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default AdminApprovalPage;
