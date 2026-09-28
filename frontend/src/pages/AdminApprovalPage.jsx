import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import './BoardPage.css';
import './AdminApprovalPage.css';

const AdminApprovalPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 테이블 헤더 소팅(필터)을 위한 상태
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [approveModal, setApproveModal] = useState({ isOpen: false, targetUser: null, role: '일반회원', team: '' });
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => { }, onCancel: () => { } });

  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: () => setModal({ ...modal, isOpen: false }) });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user || (user.role !== '관리자' && user.role !== 'ADMIN')) { alert('권한이 없습니다.'); navigate('/'); }
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

  const openApproveDialog = (user) => setApproveModal({ isOpen: true, targetUser: user, role: '일반회원', team: teams[0] || '' });

  const executeApprove = async () => {
    const res = await fetch('http://localhost:5000/api/admin/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: approveModal.targetUser.userId, role: approveModal.role, team: approveModal.team })
    });
    const data = await res.json();
    if (data.success) {
      let msg = `${approveModal.targetUser.name}님이 승인되었습니다.`;
      if (approveModal.role === '임직원') msg += `\n[사번: ${data.user.empId}]\n[계정: ${data.user.userId}]로 최종 발급되었습니다.`;
      showAlert('승인 완료', msg); setApproveModal({ ...approveModal, isOpen: false });
      fetchPendingAndTeams(); fetchAllUsers();
    }
  };

  const handleReject = async (userId) => {
    await fetch('http://localhost:5000/api/admin/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    showAlert('반려 완료', '요청이 삭제되었습니다.'); fetchPendingAndTeams();
  };

  const handleAddTeam = async () => {
    const newTeam = prompt('추가할 팀(부서) 이름을 입력하세요:');
    if (newTeam) {
      await fetch('http://localhost:5000/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team: newTeam }) });
      showAlert('팀 추가', `${newTeam}이(가) 추가되었습니다.`); fetchPendingAndTeams();
    }
  };

  // 13번 반영: 직원 상태 및 소속 부서 즉시 수정 API 호출
  const handleUpdateUser = async (userId, field, value) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (data.success) fetchAllUsers();
    } catch (error) {
      alert('수정 실패');
    }
  };

  // 통합 검색 및 필터링 적용
  const filteredUsers = allUsers.filter(u => {
    const keyword = searchKeyword.toLowerCase();
    const matchKeyword = (
      (u.name && u.name.toLowerCase().includes(keyword)) ||
      (u.empId && u.empId.toLowerCase().includes(keyword)) ||
      (u.department && u.department.toLowerCase().includes(keyword)) ||
      (u.userId && u.userId.toLowerCase().includes(keyword)) ||
      (u.contact && u.contact.toLowerCase().includes(keyword)) ||
      (u.status && u.status.toLowerCase().includes(keyword))
    );
    const matchStatus = statusFilter === '' || u.status === statusFilter;
    const matchDept = deptFilter === '' || (u.department === deptFilter);
    return matchKeyword && matchStatus && matchDept;
  });

  if (!currentUser) return null;

  return (
    <div className="board-container">
      <CustomModal isOpen={modal.isOpen} {...modal} />

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
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2>SecureTech</h2><p>Groupware Admin</p>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>그룹웨어 홈</li>
          <li className="active">인사/계정 관리</li>
        </ul>
      </aside>

      <main className="board-main">
        <header className="board-header"><h2>통합 인사 관리 시스템</h2></header>

        <section className="board-content">
          <div className="admin-tabs">
            <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>승인 대기함 ({pendingUsers.length})</button>
            <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>임직원/회원 현황 조회</button>
            <button className={activeTab === 'teams' ? 'active' : ''} onClick={() => setActiveTab('teams')}>조직(팀) 관리</button>
          </div>

          {activeTab === 'pending' && (
            <div className="board-list-view">
              <table className="board-table">
                {/* 누락된 승인 대기함 테이블 코드 복구 (이메일 및 아이디 모두 표시) */}
                <thead>
                  <tr>
                    <th>신청일</th>
                    <th>이름</th>
                    <th>연락처</th>
                    <th>개인 이메일</th>
                    <th>가입 아이디</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>승인 대기 중인 사용자가 없습니다.</td></tr>
                  ) : (
                    pendingUsers.map(user => (
                      <tr key={user.id}>
                        <td style={{ textAlign: 'center' }}>{user.date}</td>
                        <td style={{ textAlign: 'center' }}>{user.name}</td>
                        <td style={{ textAlign: 'center' }}>{user.contact}</td>
                        <td style={{ textAlign: 'center' }}>{user.email}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{user.userId}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => openApproveDialog(user)} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>권한심사</button>
                          <button onClick={() => handleReject(user.userId)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>반려</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="board-list-view">
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>전체 등록 현황</h3>
                <input type="text" placeholder="검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ padding: '8px', width: '250px' }} />
              </div>
              <table className="board-table">
                <thead>
                  <tr>
                    <th width="15%">
                      상태
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ marginLeft: '5px', border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', color: 'inherit', fontWeight: 'bold' }}>
                        <option value="">▼</option>
                        <option value="">전체</option><option value="재직">재직</option><option value="휴직">휴직</option><option value="퇴사">퇴사</option><option value="일반">일반</option>
                      </select>
                    </th>
                    <th width="15%">사번/권한</th>
                    <th width="10%">이름</th>
                    <th width="20%">
                      소속
                      <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ marginLeft: '5px', border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', color: 'inherit', fontWeight: 'bold' }}>
                        <option value="">▼</option>
                        <option value="">전체</option>
                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </th>
                    <th width="20%">시스템 아이디</th>
                    <th width="20%">연락처</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr key={idx} style={{ color: user.status === '퇴사' ? '#999' : '#333' }}>
                      <td style={{ fontWeight: 'bold', color: user.status === '재직' ? '#2ecc71' : user.status === '퇴사' ? '#e74c3c' : '#f39c12', textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>
                        {user.status}
                      </td>
                      <td style={{ textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>{user.empId || '일반회원'}</td>
                      <td style={{ textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>{user.name}</td>
                      <td style={{ textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>{user.department || '-'}</td>
                      <td style={{ textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>{user.userId}</td>
                      <td style={{ textDecoration: user.status === '퇴사' ? 'line-through' : 'none' }}>{user.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="board-list-view">
              {/* 누락된 조직(팀) 관리 코드 복구 */}
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
