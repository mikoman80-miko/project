/**
 * 파일명: server.js
 * 역할: 로그인, 회원가입, 관리자 승인 로직을 처리하는 WAS 서버
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// [임시 데이터베이스 (서버 메모리에 저장)]
// ==========================================

// 1. 가입이 완료된(승인된) 사용자 목록 
// (기본적으로 시스템을 관리할 최고 관리자 계정을 하나 넣어둡니다)
let users = [
  { name: '윤두상', department: '보안개발팀', userId: 'admin', password: '1234', role: '관리자' }
];

// 2. 외부인/가입자가 시스템 접근 권한을 요청하여 대기 중인 목록
let pendingUsers = [];

// ==========================================
// [API 엔드포인트 라우팅]
// ==========================================

/** 1. 로그인 API */
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;

  // 가입 완료된 users 배열에서 아이디와 비밀번호가 일치하는 사람을 찾습니다.
  const user = users.find(u => u.userId === userId && u.password === password);

  if (user) {
    res.json({ success: true, message: "로그인 성공", user });
  } else {
    // 일치하는 사람이 없다면 반려되었거나 대기 중인 상태입니다.
    res.status(401).json({ success: false, message: "아이디/비밀번호가 틀렸거나, 아직 관리자 승인 대기 중입니다." });
  }
});

/** 2. 회원가입 (접근 권한 요청) API */
app.post('/api/signup', (req, res) => {
  const { name, department, userId, password } = req.body;

  // 이미 존재하는 아이디인지 중복 검사 (승인된 유저 목록과 대기자 목록 모두 검사)
  const isExist = users.find(u => u.userId === userId) || pendingUsers.find(u => u.userId === userId);

  if (isExist) {
    return res.status(400).json({ success: false, message: "이미 사용 중이거나 승인 대기 중인 아이디입니다." });
  }

  // 중복이 아니라면 새로운 유저 객체를 생성하여 대기자 목록(pendingUsers)에 넣습니다.
  const newUser = {
    id: Date.now(), // 현재 시간을 고유 ID로 사용
    name,
    department,
    userId,
    password,
    role: '일반회원', // 신규 가입자는 무조건 일반회원으로 고정
    date: new Date().toISOString().split('T')[0] // 오늘 날짜 (예: 2026-09-28)
  };

  pendingUsers.push(newUser);
  console.log(`[가입요청 접수] 이름: ${name}, 아이디: ${userId}`);

  res.json({ success: true, message: "가입 요청이 성공적으로 접수되었습니다." });
});

/** 3. 관리자용: 가입 대기자 목록 조회 API */
app.get('/api/admin/pending', (req, res) => {
  // 관리자 페이지에 접속하면 현재 pendingUsers 배열을 그대로 프론트엔드로 보내줍니다.
  res.json({ success: true, pendingUsers });
});

/** 4. 관리자용: 가입 승인 API */
app.post('/api/admin/approve', (req, res) => {
  const { userId } = req.body;

  // 대기자 목록에서 승인할 유저를 찾습니다.
  const userIndex = pendingUsers.findIndex(u => u.userId === userId);

  if (userIndex > -1) {
    // 1. 대기자 목록에서 해당 유저 데이터를 빼냅니다.
    const approvedUser = pendingUsers[userIndex];
    // 2. 정식 회원(users) 배열에 추가합니다. (이제 이 아이디로 로그인 가능해집니다)
    users.push(approvedUser);
    // 3. 대기자 목록에서는 삭제합니다.
    pendingUsers.splice(userIndex, 1);

    console.log(`[승인완료] 아이디: ${userId}`);
    res.json({ success: true, message: "승인 처리되었습니다." });
  } else {
    res.status(404).json({ success: false, message: "대기자를 찾을 수 없습니다." });
  }
});

/** 5. 관리자용: 가입 반려 API */
app.post('/api/admin/reject', (req, res) => {
  const { userId } = req.body;
  // filter 함수를 사용해 반려된 아이디를 제외한 나머지 사람들로 대기자 목록을 갱신합니다.
  pendingUsers = pendingUsers.filter(u => u.userId !== userId);

  console.log(`[반려완료] 아이디: ${userId}`);
  res.json({ success: true, message: "반려 처리되었습니다." });
});

// 서버 가동
app.listen(PORT, () => {
  console.log(`WAS 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
