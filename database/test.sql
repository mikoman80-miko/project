-- 1. 데이터베이스 생성 및 선택
-- 한글 깨짐을 방지하기 위해 utf8mb4 인코딩을 적용합니다.
CREATE DATABASE IF NOT EXISTS securetech_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE securetech_db;

-- ==========================================
-- [1] 사용자 (Users) 테이블
-- 메뉴: '로그인 화면', '인사/계정 관리', '조직도'
-- 사내 인트라넷을 사용하는 임직원 마스터 데이터입니다.
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id VARCHAR(20) UNIQUE NOT NULL,      -- 사번 (로그인 ID로 사용)
    password VARCHAR(255) NOT NULL,          -- 비밀번호
    name VARCHAR(50) NOT NULL,               -- 직원명
    department VARCHAR(50) NOT NULL,         -- 소속 부서/실 (예: 보안개발실, 인사팀)
    position VARCHAR(50) NOT NULL,           -- 직책/직급 (예: 팀장, 연구원)
    role VARCHAR(20) DEFAULT '일반',         -- 권한 ('일반', '관리자')
    status VARCHAR(20) DEFAULT '재직',       -- 상태 ('재직', '퇴사')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 계정 생성일
);

-- ==========================================
-- [2] 사내 게시판/공지사항 (Posts) 테이블
-- 메뉴: '공지사항', '사내 게시판'
-- 💡 최적화: 공지사항과 일반 게시판을 따로 만들지 않고 category 컬럼으로 통폐합했습니다.
-- ==========================================
CREATE TABLE IF NOT EXISTS posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(20) NOT NULL,           -- 분류 ('공지사항', '일반')
    title VARCHAR(100) NOT NULL,             -- 게시글 제목
    content TEXT NOT NULL,                   -- 게시글 본문 (HTML 태그 포함 가능)
    author_name VARCHAR(50) NOT NULL,        -- 작성자 이름
    views INT DEFAULT 0,                     -- 조회수
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 작성일시
);

-- ==========================================
-- [3] 전자결재 (Approvals) 테이블
-- 메뉴: '전자결재'
-- 기안된 문서의 상세 내용과 승인/반려 상태를 관리합니다.
-- ==========================================
CREATE TABLE IF NOT EXISTS approvals (
    doc_id INT AUTO_INCREMENT PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL,           -- 양식 (기안서, 휴가신청서 등)
    title VARCHAR(100) NOT NULL,             -- 문서 제목
    content TEXT NOT NULL,                   -- 상세 사유 및 내용
    drafter VARCHAR(50) NOT NULL,            -- 기안자 이름
    department VARCHAR(50) NOT NULL,         -- 기안자 소속 부서
    status VARCHAR(20) DEFAULT '대기',       -- 결재 상태 ('대기', '승인', '반려')
    approver VARCHAR(50),                    -- 최종 결재를 처리한 사람
    approve_date DATE,                       -- 결재 처리된 날짜
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 기안 상신일시
);

-- ==========================================
-- [4] IT 자산 / IP 관리 (Assets) 테이블
-- 메뉴: 'IT 자산/IP 관리' (관리자 전용)
-- 사내망에 연결된 기기 및 할당된 IP를 추적합니다.
-- ==========================================
CREATE TABLE IF NOT EXISTS assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL,  -- 할당된 IP 주소 (중복 불가)
    device_name VARCHAR(50) NOT NULL,        -- 기기명 (예: PC-SEC-01)
    owner_name VARCHAR(50) NOT NULL,         -- 할당받은 사용자
    department VARCHAR(50) NOT NULL,         -- 사용자 부서
    status VARCHAR(20) DEFAULT '사용중',     -- 상태 ('사용중', '회수됨')
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 마지막 수정일
);

-- ==========================================
-- [5] 초기 테스트 데이터 (Mock Data) 자동 세팅
-- 서버와 DB 연결 후 즉시 로그인이 가능하도록 초기 데이터를 넣습니다.
-- ==========================================
-- 관리자 계정 생성
INSERT INTO users (emp_id, password, name, department, position, role) VALUES 
('admin', '1234', '윤두상', '보안1팀', '팀장', '관리자');

-- 일반 테스트 계정 생성
INSERT INTO users (emp_id, password, name, department, position, role) VALUES 
('user01', '1234', '최프론트', '보안1팀', '선임연구원', '일반');

-- 테스트 공지사항 생성
INSERT INTO posts (category, title, content, author_name) VALUES 
('공지사항', '[필독] 사내 보안 관제 시스템 오픈 안내', '<p>인트라넷과 보안 관제가 통합되었습니다.</p>', '윤두상');