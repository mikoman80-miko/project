import axios from "axios";

// 환경 변수 끝의 슬래시(/)를 안전하게 제거하여 이중 슬래시 방지
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: cleanBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// 요청 인터셉터: 로그인 사용자 ID 헤더 자동 주입
api.interceptors.request.use(
  (config) => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      try {
        const user = JSON.parse(loggedInUser);
        const userId = user.employee_id || user.emp_id;
        if (userId) {
          config.headers["X-User-Id"] = userId;
        }
      } catch (e) {
        console.error("사용자 정보 파싱 실패:", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 응답 인터셉터: 공통 에러 핸들링
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 403 Forbidden: 망분리 접근 거부 또는 권한 없음
      if (error.response.status === 403) {
        console.warn(
          "접근 권한 거부 (403):",
          error.response.data?.message || "권한이 없습니다.",
        );
      }
    }
    return Promise.reject(error);
  },
);

export default api;
