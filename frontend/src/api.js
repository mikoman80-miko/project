import axios from 'axios';

const api = axios.create({
  // 💡 [서버 배포 시 필수 확인]
  // frontend/.env 파일에 정의된 주소를 자동으로 가져옵니다.
  // - 로컬 테스트 시: VITE_API_BASE_URL=http://localhost:8000
  // - 서버 배포 시:   VITE_API_BASE_URL=http://192.168.1.23:8000
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.23:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      config.headers['X-User-Id'] = user.employee_id; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;