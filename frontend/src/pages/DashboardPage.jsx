import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [accessLogs, setAccessLogs] = useState([]);
  const [networkRequests, setNetworkRequests] = useState([]);

  const [noticeCount, setNoticeCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const [targetIp, setTargetIp] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const storedUserData = sessionStorage.getItem('loggedInUser');
    if (!storedUserData) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
    } else {
      setCurrentUser(JSON.parse(storedUserData));
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [logsRes, netRes, noticeRes, appRes] = await Promise.all([
        fetch('http://localhost:5000/api/logs'),
        fetch('http://localhost:5000/api/network-requests'),
        fetch('http://localhost:5000/api/notices'),
        fetch('http://localhost:5000/api/approvals')
      ]);
      const logsData = await logsRes.json();
      const netData = await netRes.json();
      const noticeData = await noticeRes.json();
      const appData = await appRes.json();

      if (logsData.success) setAccessLogs(logsData.logs);
      if (netData.success) setNetworkRequests(netData.requests);

      if (noticeData.success) setNoticeCount(noticeData.notices.length);
      if (appData.success) {
        const pending = appData.approvals.filter(a => a.status === '대기');
        setPendingApprovalCount(pending.length);
      }
    } catch (error) {
      console.error("데이터 불러오기 실패", error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    alert('안전하게 로그아웃 되었습니다.');
    navigate('/');
  };

  const handleNetworkRequest = async (e) => {
    e.preventDefault();
    if (!targetIp || !reason) { alert('모두 입력해주세요.'); return; }
    await fetch('http://localhost:5000/api/network-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester: currentUser.name, userId: currentUser.userId, targetIp, reason, date: new Date().toLocaleString() })
    });
    alert('외부망 사용 요청이 접수되었습니다.');
    setTargetIp(''); setReason(''); fetchDashboardData();
  };

  const handleNetworkStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/network-requests/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    });
    alert(`요청이 ${status} 처리되었습니다.`);
    fetchDashboardData();
  };

  if (!currentUser) return <div>사용자 정보를 불러오는 중입니다...</div>;
  const isAdmin = currentUser.role === '관리자' || currentUser.role === 'ADMIN';

  // ★ 3번 반영: 관리자는 모두, 사원은 본인 요청(userId 일치)만 필터링해서 보여줌
  const displayedRequests = isAdmin ? networkRequests : networkRequests.filter(req => req.userId === currentUser.userId);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2>SecureTech</h2><p>Groupware System</p>
        </div>
        <ul className="sidebar-menu">
          <li className="active" onClick={() => navigate('/dashboard')}>홈 (대시보드)</li>
          <li onClick={() => navigate('/notice')}>공지사항</li>
          <li onClick={() => navigate('/board')}>사내 게시판</li>
          <li onClick={() => navigate('/approval')}>전자결재</li>
          {isAdmin && <li onClick={() => navigate('/admin/approval')}>인사/계정 관리</li>}
        </ul>
      </aside>

      <main className="dashboard-main">
        {/* ★ 4번 반영: display: flex와 justifyContent: flex-end로 우측 상단 쏠림 처리 */}
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '15px 30px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="user-info" onClick={() => navigate('/mypage')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              <span className="user-name"><strong>{currentUser.name}</strong> 님</span>
              <span className="user-dept">[{currentUser.department || '일반회원'}]</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          </div>
        </header>

        <section className="dashboard-content">
          <h3>오늘의 업무 요약</h3>
          <div className="widget-grid" style={{ marginBottom: '40px' }}>
            <div className="widget-card">
              <h4>새로운 공지사항</h4>
              <p className="widget-number">{noticeCount}건</p>
              <button onClick={() => navigate('/notice')}>바로가기</button>
            </div>

            <div className="widget-card">
              <h4>결재 대기 문서</h4>
              <p className="widget-number">{pendingApprovalCount}건</p>
              <button onClick={() => navigate('/approval')}>바로가기</button>
            </div>

            <div className="widget-card">
              <h4>마이페이지</h4>
              <p className="widget-status safe">정상</p>
              <button onClick={() => navigate('/mypage')}>정보 수정</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '400px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3>🌐 사내 외부망 사용 요청 (디폴트: 차단)</h3>
              <form onSubmit={handleNetworkRequest} style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <input type="text" placeholder="목적지 (예: 8.8.8.8 또는 github.com)" value={targetIp} onChange={(e) => setTargetIp(e.target.value)} style={{ padding: '8px', flex: 1 }} required />
                <input type="text" placeholder="요청 사유" value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '8px', flex: 1 }} required />
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>사용 요청</button>
              </form>

              <table className="board-table" style={{ fontSize: '13px' }}>
                <thead><tr><th>요청자</th><th>목적지</th><th>사유</th><th>상태</th>{isAdmin && <th>관리</th>}</tr></thead>
                <tbody>
                  {/* ★ 3번 반영: displayedRequests 렌더링 */}
                  {displayedRequests.length === 0 ? (<tr><td colSpan={isAdmin ? "5" : "4"} style={{ textAlign: 'center' }}>요청 내역이 없습니다.</td></tr>) : (
                    displayedRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.requester}</td>
                        <td>{req.targetIp}</td>
                        <td>{req.reason}</td>
                        <td style={{ fontWeight: 'bold', color: req.status === '허가' ? '#2ecc71' : req.status === '차단' ? '#e74c3c' : '#f39c12' }}>{req.status}</td>
                        {isAdmin && (
                          <td>
                            <button onClick={() => handleNetworkStatus(req.id, '허가')} style={{ padding: '4px 8px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>허가</button>
                            <button onClick={() => handleNetworkStatus(req.id, '차단')} style={{ padding: '4px 8px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>차단</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isAdmin && (
              <div style={{ flex: 1, minWidth: '400px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>🛡️ 시스템 접근 IP 로그</h3>
                  <button onClick={fetchDashboardData} style={{ padding: '6px 12px', cursor: 'pointer' }}>🔄 새로고침</button>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="board-table" style={{ fontSize: '13px' }}>
                    <thead><tr><th>접속 시간</th><th>아이디</th><th>이름</th><th>접속 IP</th></tr></thead>
                    <tbody>
                      {accessLogs.length === 0 ? (<tr><td colSpan="4" style={{ textAlign: 'center' }}>접속 기록이 없습니다.</td></tr>) : (
                        accessLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{log.timestamp}</td>
                            <td>{log.userId}</td>
                            <td>{log.name}</td>
                            <td>{log.ip}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
