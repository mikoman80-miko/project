const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// [데이터베이스 (메모리)]
// ==========================================
let teams = ['보안개발팀', '인사팀', '영업팀', '경영지원팀']; // 사내 부서 목록

// 7번 반영: email 필드 대신 userId 사용 (일반 아이디 체계)
// ★ 초기 관리자 계정 아이디: admin / 비밀번호: 1234
let users = [
  { name: '윤두상', userId: 'admin', contact: '010-1234-5678', password: '1234', role: '관리자', department: '보안개발팀', empId: 'ST20260901', status: '재직' }
];

let pendingUsers = [];
let posts = [];
let homepageData = {
  heroTitle: "혁신적인 IT 보안 솔루션, SecureTech", heroDesc: "가장 안전하고 든든한 파트너가 되겠습니다.",
  feature1Title: "최고 수준의 보안", feature1Desc: "외부 위협으로부터 보호합니다.",
  feature2Title: "맞춤형 시스템", feature2Desc: "최적화된 인트라넷을 구축합니다.",
  feature3Title: "무중단 유지보수", feature3Desc: "365일 시스템을 모니터링합니다."
};
let notices = [];
let approvals = [];

// 8번 반영: 접속 로그 및 14번 반영: 외부망 요청 리스트 배열 추가
let accessLogs = [];
let networkRequests = [];

// ==========================================
// [API 엔드포인트]
// ==========================================

// 1. 로그인 (7번 반영: 일반 아이디 기준)
app.post('/api/login', (req, res) => {
  const user = users.find(u => u.userId === req.body.userId && u.password === req.body.password);

  if (user && user.status !== '퇴사') {
    // 8번 반영: 로그인 성공 시 접속 IP 및 타임스탬프 기록
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    accessLogs.unshift({ id: Date.now(), userId: user.userId, name: user.name, ip: ip, timestamp: new Date().toLocaleString() });

    res.json({ success: true, message: "로그인 성공", user });
  } else {
    res.status(401).json({ success: false, message: "아이디/비밀번호 오류, 또는 접근 권한이 없습니다." });
  }
});

// 2. 회원가입 (7번 반영: email 대신 userId 검증)
app.post('/api/signup', (req, res) => {
  const isExist = users.find(u => u.userId === req.body.userId) || pendingUsers.find(u => u.userId === req.body.userId);
  if (isExist) return res.status(400).json({ success: false, message: "이미 존재하는 아이디입니다." });

  pendingUsers.push({ id: Date.now(), ...req.body, date: new Date().toISOString().split('T')[0] });
  res.json({ success: true });
});

// 3. 관리자: 대기자 목록 및 팀 목록 조회
app.get('/api/admin/pending', (req, res) => res.json({ success: true, pendingUsers, teams }));

// 4. 관리자: 전체 직원(회원) 현황 조회 (13번 검색용)
app.get('/api/admin/users', (req, res) => res.json({ success: true, users }));

// 5. ★ 관리자: 승인 처리 (7번 반영: email -> userId 변경)
app.post('/api/admin/approve', (req, res) => {
  const { userId, role, team } = req.body;
  const index = pendingUsers.findIndex(u => u.userId === userId);

  if (index > -1) {
    let approvedUser = { ...pendingUsers[index], role };

    if (role === '임직원' || role === '사원') {
      const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
      const empCount = users.filter(u => u.empId && u.empId.startsWith('ST' + dateStr)).length + 1;
      approvedUser.empId = `ST${dateStr}${String(empCount).padStart(2, '0')}`;
      approvedUser.department = team;
      approvedUser.status = '재직';
    } else {
      approvedUser.status = '일반';
    }

    users.push(approvedUser);
    pendingUsers.splice(index, 1);
    res.json({ success: true, user: approvedUser });
  } else {
    res.status(404).json({ success: false });
  }
});

// 6. 관리자: 가입 반려
app.post('/api/admin/reject', (req, res) => {
  pendingUsers = pendingUsers.filter(u => u.userId !== req.body.userId);
  res.json({ success: true });
});

// 7. 관리자: 팀(부서) 추가
app.post('/api/admin/teams', (req, res) => {
  if (!teams.includes(req.body.team)) { teams.push(req.body.team); }
  res.json({ success: true, teams });
});

// 13번 반영: 관리자 인사/계정 수정 (상태 및 소속 변경)
app.put('/api/admin/users/:userId', (req, res) => {
  const idx = users.findIndex(u => u.userId === req.params.userId);
  if (idx > -1) {
    if (req.body.status) users[idx].status = req.body.status;
    if (req.body.department) users[idx].department = req.body.department;
    res.json({ success: true, user: users[idx] });
  } else {
    res.status(404).json({ success: false });
  }
});

// 10번 반영: 마이페이지 개인정보 수정 API
app.put('/api/users/:userId', (req, res) => {
  const idx = users.findIndex(u => u.userId === req.params.userId);
  if (idx > -1) {
    if (req.body.password) users[idx].password = req.body.password; // 비밀번호 변경
    if (req.body.phone) users[idx].contact = req.body.phone;
    if (req.body.department) users[idx].department = req.body.department;
    res.json({ success: true, user: users[idx] });
  } else {
    res.status(404).json({ success: false });
  }
});

// 8번 반영: 대시보드 시스템 접근 로그(IP) 조회 API
app.get('/api/logs', (req, res) => res.json({ success: true, logs: accessLogs }));

// 14번 반영: 외부망 사용 요청 관련 API (iptables 제어 준비)
app.get('/api/network-requests', (req, res) => res.json({ success: true, requests: networkRequests }));
app.post('/api/network-requests', (req, res) => {
  networkRequests.unshift({ id: Date.now(), ...req.body, status: '대기' });
  res.json({ success: true });
});
app.put('/api/network-requests/:id/status', (req, res) => {
  const idx = networkRequests.findIndex(r => r.id === parseInt(req.params.id));
  if (idx > -1) {
    networkRequests[idx].status = req.body.status;
    // 향후 실제 Linux 서버에 배포 시 이곳에 iptables를 제어하는 C 모듈 연결 (예: child_process.exec(`iptables ...`))
    console.log(`[방화벽 제어 모의 실행] 목적지: ${networkRequests[idx].targetIp}, 상태 변경: ${req.body.status}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

// 게시판 및 공지사항 API (4, 6번 반영: ...req.body로 isImportant 등의 데이터 자동 저장)
app.get('/api/posts', (req, res) => res.json({ success: true, posts }));
app.post('/api/posts', (req, res) => { posts.unshift({ id: Date.now(), ...req.body }); res.json({ success: true }); });
app.delete('/api/posts/:id', (req, res) => { posts = posts.filter(p => p.id !== parseInt(req.params.id)); res.json({ success: true }); });
app.put('/api/posts/:id', (req, res) => { const idx = posts.findIndex(p => p.id === parseInt(req.params.id)); Object.assign(posts[idx], req.body); res.json({ success: true }); });

app.get('/api/notices', (req, res) => res.json({ success: true, notices }));
app.post('/api/notices', (req, res) => { notices.unshift({ id: Date.now(), ...req.body }); res.json({ success: true }); });
// 12번 삭제 기능 반영: 공지사항 개별 삭제 라우트 추가
app.delete('/api/notices/:id', (req, res) => { notices = notices.filter(p => p.id !== parseInt(req.params.id)); res.json({ success: true }); });

app.get('/api/homepage', (req, res) => res.json({ success: true, homepageData }));
app.put('/api/homepage', (req, res) => { homepageData = { ...homepageData, ...req.body }; res.json({ success: true }); });

app.get('/api/approvals', (req, res) => res.json({ success: true, approvals }));
app.post('/api/approvals', (req, res) => { approvals.unshift({ id: Date.now(), ...req.body, status: '대기' }); res.json({ success: true }); });
app.put('/api/approvals/:id/status', (req, res) => {
  const idx = approvals.findIndex(a => a.id === parseInt(req.params.id));
  if (idx > -1) { Object.assign(approvals[idx], req.body); res.json({ success: true }); }
});

app.listen(PORT, () => console.log(`WAS 서버 실행중: http://localhost:${PORT}`));
