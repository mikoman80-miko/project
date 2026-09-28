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

let users = [
  { name: '윤두상', email: 'admin@ST.co.kr', contact: '010-1234-5678', password: '1234', role: '관리자', department: '보안개발팀', empId: 'ST20260901', status: '재직' }
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

// ==========================================
// [API 엔드포인트]
// ==========================================

// 1. 로그인 (이메일 기준)
app.post('/api/login', (req, res) => {
  const user = users.find(u => u.email === req.body.email && u.password === req.body.password);
  // 퇴사자 로그인 차단 로직 추가 가능
  if (user && user.status !== '퇴사') res.json({ success: true, message: "로그인 성공", user });
  else res.status(401).json({ success: false, message: "이메일/비밀번호 오류, 또는 접근 권한이 없습니다." });
});

// 2. 회원가입 (이름, 연락처, 이메일, 비밀번호)
app.post('/api/signup', (req, res) => {
  const isExist = users.find(u => u.email === req.body.email) || pendingUsers.find(u => u.email === req.body.email);
  if (isExist) return res.status(400).json({ success: false, message: "이미 가입된 이메일입니다." });

  pendingUsers.push({ id: Date.now(), ...req.body, date: new Date().toISOString().split('T')[0] });
  res.json({ success: true });
});

// 3. 관리자: 대기자 목록 및 팀 목록 조회
app.get('/api/admin/pending', (req, res) => res.json({ success: true, pendingUsers, teams }));

// 4. 관리자: 전체 직원(회원) 현황 조회 (검색용)
app.get('/api/admin/users', (req, res) => res.json({ success: true, users }));

// 5. ★ 관리자: 승인 처리 (일반회원 vs 임직원 구분, 사번 및 이메일 생성)
app.post('/api/admin/approve', (req, res) => {
  const { email, role, team } = req.body;
  const index = pendingUsers.findIndex(u => u.email === email);

  if (index > -1) {
    let approvedUser = { ...pendingUsers[index], role };

    if (role === '임직원') {
      // (1) 사번 생성 로직 (ST + YYYYMM + 01...)
      const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // "202609"
      const empCount = users.filter(u => u.empId && u.empId.startsWith('ST' + dateStr)).length + 1;
      approvedUser.empId = `ST${dateStr}${String(empCount).padStart(2, '0')}`; // ST20260901 형태

      // (2) 사내 이메일 부여 (기존 아이디 추출 후 @ST.co.kr 붙이기)
      const originalId = approvedUser.email.split('@')[0];
      approvedUser.originalEmail = approvedUser.email; // 기존 개인 이메일 백업
      approvedUser.email = `${originalId}@ST.co.kr`;

      // (3) 소속 및 상태
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
  pendingUsers = pendingUsers.filter(u => u.email !== req.body.email); res.json({ success: true });
});

// 7. 관리자: 팀(부서) 추가
app.post('/api/admin/teams', (req, res) => {
  if (!teams.includes(req.body.team)) { teams.push(req.body.team); }
  res.json({ success: true, teams });
});

// 기존 게시판, 공지사항, 결재, 홈페이지 API는 그대로 유지합니다.
app.get('/api/posts', (req, res) => res.json({ success: true, posts }));
app.post('/api/posts', (req, res) => { posts.unshift({ id: Date.now(), ...req.body }); res.json({ success: true }); });
app.delete('/api/posts/:id', (req, res) => { posts = posts.filter(p => p.id !== parseInt(req.params.id)); res.json({ success: true }); });
app.put('/api/posts/:id', (req, res) => { const idx = posts.findIndex(p => p.id === parseInt(req.params.id)); Object.assign(posts[idx], req.body); res.json({ success: true }); });
app.get('/api/homepage', (req, res) => res.json({ success: true, homepageData }));
app.put('/api/homepage', (req, res) => { homepageData = { ...homepageData, ...req.body }; res.json({ success: true }); });
app.get('/api/notices', (req, res) => res.json({ success: true, notices }));
app.post('/api/notices', (req, res) => { notices.unshift({ id: Date.now(), ...req.body }); res.json({ success: true }); });
app.get('/api/approvals', (req, res) => res.json({ success: true, approvals }));
app.post('/api/approvals', (req, res) => { approvals.unshift({ id: Date.now(), ...req.body, status: '대기' }); res.json({ success: true }); });
app.put('/api/approvals/:id/status', (req, res) => {
  const idx = approvals.findIndex(a => a.id === parseInt(req.params.id));
  if (idx > -1) { Object.assign(approvals[idx], req.body); res.json({ success: true }); }
});

app.listen(PORT, () => console.log(`WAS 서버 실행중: http://localhost:${PORT}`));
