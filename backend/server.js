/**
 * 파일명: server.js
 * 역할: 사내 시스템의 모든 기능(로그인, 회원관리, 게시판)을 처리하는 WAS 서버
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

// 1. 가입 완료 유저 목록
let users = [
  { name: '윤두상', department: '보안개발팀', userId: 'admin', password: '1234', role: '관리자' }
];

// 2. 가입 대기자 목록
let pendingUsers = [];

// 3. 사내 게시판 게시글 목록 (새로 추가됨)
let posts = [
  { id: 1, title: '사내 인트라넷 시스템 오픈 안내', author: '관리자', date: '2026-09-28', content: '환영합니다. 보안 수칙을 준수해 주세요.' },
  { id: 2, title: '이번 주 금요일 보안 교육 일정', author: '보안개발팀', date: '2026-09-28', content: '전 임직원 필참 교육입니다.' }
];

// ==========================================
// [API 엔드포인트 라우팅]
// ==========================================

// --- (기존: 로그인 및 회원관리 API 유지) ---
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const user = users.find(u => u.userId === userId && u.password === password);
  if (user) res.json({ success: true, message: "로그인 성공", user });
  else res.status(401).json({ success: false, message: "아이디/비밀번호 오류 또는 승인 대기중입니다." });
});

app.post('/api/signup', (req, res) => {
  const { name, department, userId, password } = req.body;
  const isExist = users.find(u => u.userId === userId) || pendingUsers.find(u => u.userId === userId);
  if (isExist) return res.status(400).json({ success: false, message: "이미 사용 중인 아이디입니다." });

  const newUser = {
    id: Date.now(), name, department, userId, password, role: '일반회원',
    date: new Date().toISOString().split('T')[0]
  };
  pendingUsers.push(newUser);
  res.json({ success: true, message: "가입 요청 완료" });
});

app.get('/api/admin/pending', (req, res) => res.json({ success: true, pendingUsers }));

app.post('/api/admin/approve', (req, res) => {
  const { userId } = req.body;
  const userIndex = pendingUsers.findIndex(u => u.userId === userId);
  if (userIndex > -1) {
    users.push(pendingUsers[userIndex]);
    pendingUsers.splice(userIndex, 1);
    res.json({ success: true, message: "승인 완료" });
  } else res.status(404).json({ success: false, message: "대기자 없음" });
});

app.post('/api/admin/reject', (req, res) => {
  pendingUsers = pendingUsers.filter(u => u.userId !== req.body.userId);
  res.json({ success: true, message: "반려 완료" });
});


// --- (신규: 사내 게시판 API) ---

/** 6. 게시글 목록 불러오기 (GET) */
app.get('/api/posts', (req, res) => {
  // 현재 서버에 저장된 posts 배열을 프론트엔드로 보내줍니다.
  res.json({ success: true, posts });
});

/** 7. 새 게시글 등록하기 (POST) */
app.post('/api/posts', (req, res) => {
  const { title, author, date, content } = req.body;

  // 프론트엔드에서 보낸 데이터를 바탕으로 새 게시글 객체 생성
  const newPost = {
    id: Date.now(), // 겹치지 않는 고유 번호(시간값)
    title,
    author,
    date,
    content
  };

  // 배열의 맨 앞(최신순)에 새 글을 밀어 넣습니다.
  posts.unshift(newPost);

  console.log(`[게시글 등록] 제목: ${title}, 작성자: ${author}`);
  res.json({ success: true, message: "게시글이 성공적으로 등록되었습니다." });
});

/** 8. 게시글 삭제하기 (DELETE) */
app.delete('/api/posts/:id', (req, res) => {
  // 프론트엔드에서 URL에 담아 보낸 삭제할 글 번호(id)를 가져옵니다.
  const postId = parseInt(req.params.id);

  // 전체 글 목록에서 해당 번호를 가진 글의 위치(index)를 찾습니다.
  const index = posts.findIndex(p => p.id === postId);

  if (index > -1) {
    // 글을 찾았다면 배열에서 해당 글을 제거합니다.
    posts.splice(index, 1);
    console.log(`[게시글 삭제] 글 번호: ${postId}`);
    res.json({ success: true, message: "게시글이 삭제되었습니다." });
  } else {
    res.status(404).json({ success: false, message: "삭제할 게시글을 찾을 수 없습니다." });
  }
});

/** 9. 게시글 수정하기 (PUT) */
app.put('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, content } = req.body;

  // 수정할 게시글의 위치를 찾습니다.
  const index = posts.findIndex(p => p.id === postId);

  if (index > -1) {
    // 찾은 게시글의 제목과 내용을 프론트엔드에서 보낸 새 데이터로 덮어씌웁니다.
    posts[index].title = title;
    posts[index].content = content;

    console.log(`[게시글 수정] 글 번호: ${postId}`);
    res.json({ success: true, message: "게시글이 성공적으로 수정되었습니다." });
  } else {
    res.status(404).json({ success: false, message: "수정할 게시글을 찾을 수 없습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`WAS 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
