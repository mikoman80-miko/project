const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// [1. 임시 데이터베이스 배열]
// ==========================================
let users = [{ name: '윤두상', department: '보안개발팀', userId: 'admin', password: '1234', role: '관리자' }];
let pendingUsers = [];
let posts = [{ id: 1, title: '사내 인트라넷 오픈', author: '관리자', date: '2026-09-28', content: '환영합니다.' }];
let homepageData = {
  heroTitle: "혁신적인 IT 보안 솔루션, SecureTech", heroDesc: "가장 안전하고 든든한 파트너가 되겠습니다.",
  feature1Title: "최고 수준의 보안", feature1Desc: "외부 위협으로부터 보호합니다.",
  feature2Title: "맞춤형 시스템", feature2Desc: "최적화된 인트라넷을 구축합니다.",
  feature3Title: "무중단 유지보수", feature3Desc: "365일 시스템을 모니터링합니다."
};

// ★ [신규] 공지사항 데이터
let notices = [
  { id: 1, title: '[필독] 전사 정보보안 정기 교육 안내', author: '보안개발팀', date: '2026-09-28', content: '전 임직원은 9월 30일까지 보안 교육을 이수 바랍니다.', isImportant: true }
];

// ★ [신규] 전자결재 데이터
let approvals = [
  { id: 1, type: '휴가신청서', title: '10월 2일 개인 연차 신청의 건', content: '개인 사정으로 인한 연차 휴가 신청합니다.', drafter: '홍길동', department: '영업팀', date: '2026-09-28', status: '대기', approver: null, approveDate: null }
];

// ==========================================
// [2. API 엔드포인트]
// ==========================================
// (기존 로그인, 가입, 회원관리, 게시판, 홈페이지 API 유지)
app.post('/api/login', (req, res) => {
  const user = users.find(u => u.userId === req.body.userId && u.password === req.body.password);
  if (user) res.json({ success: true, message: "로그인 성공", user });
  else res.status(401).json({ success: false, message: "로그인 실패" });
});
app.post('/api/signup', (req, res) => { pendingUsers.push({ id: Date.now(), ...req.body, role: '일반회원', date: new Date().toISOString().split('T')[0] }); res.json({ success: true }); });
app.get('/api/admin/pending', (req, res) => res.json({ success: true, pendingUsers }));
app.post('/api/admin/approve', (req, res) => { const idx = pendingUsers.findIndex(u => u.userId === req.body.userId); users.push(pendingUsers[idx]); pendingUsers.splice(idx, 1); res.json({ success: true }); });
app.post('/api/admin/reject', (req, res) => { pendingUsers = pendingUsers.filter(u => u.userId !== req.body.userId); res.json({ success: true }); });
app.get('/api/posts', (req, res) => res.json({ success: true, posts }));
app.post('/api/posts', (req, res) => { posts.unshift({ id: Date.now(), ...req.body }); res.json({ success: true }); });
app.delete('/api/posts/:id', (req, res) => { posts = posts.filter(p => p.id !== parseInt(req.params.id)); res.json({ success: true }); });
app.put('/api/posts/:id', (req, res) => { const idx = posts.findIndex(p => p.id === parseInt(req.params.id)); Object.assign(posts[idx], req.body); res.json({ success: true }); });
app.get('/api/homepage', (req, res) => res.json({ success: true, homepageData }));
app.put('/api/homepage', (req, res) => { homepageData = { ...homepageData, ...req.body }; res.json({ success: true }); });

// --- ★ [신규] 공지사항 API ---
app.get('/api/notices', (req, res) => res.json({ success: true, notices }));
app.post('/api/notices', (req, res) => { notices.unshift({ id: Date.now(), ...req.body }); res.json({ success: true, message: '공지가 등록되었습니다.' }); });
app.delete('/api/notices/:id', (req, res) => { notices = notices.filter(n => n.id !== parseInt(req.params.id)); res.json({ success: true, message: '삭제 완료' }); });
app.put('/api/notices/:id', (req, res) => {
  const idx = notices.findIndex(n => n.id === parseInt(req.params.id));
  if (idx > -1) { Object.assign(notices[idx], req.body); res.json({ success: true, message: '수정 완료' }); }
});

// --- ★ [신규] 전자결재 API ---
app.get('/api/approvals', (req, res) => res.json({ success: true, approvals }));
app.post('/api/approvals', (req, res) => {
  // 기안 상신 (초기 상태는 무조건 '대기')
  approvals.unshift({ id: Date.now(), ...req.body, status: '대기', approver: null, approveDate: null });
  res.json({ success: true, message: '결재가 상신되었습니다.' });
});
app.put('/api/approvals/:id/status', (req, res) => {
  // 관리자가 승인/반려 처리
  const idx = approvals.findIndex(a => a.id === parseInt(req.params.id));
  if (idx > -1) {
    approvals[idx].status = req.body.status; // '승인' 또는 '반려'
    approvals[idx].approver = req.body.approver; // 결재자 이름
    approvals[idx].approveDate = new Date().toISOString().split('T')[0];
    res.json({ success: true, message: `결재 문서가 ${req.body.status} 처리되었습니다.` });
  }
});

app.listen(PORT, () => console.log(`WAS 서버 실행중: http://localhost:${PORT}`));
