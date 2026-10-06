// src/api.js

import axios from 'axios';

const api = axios.create({
  // 💡 Nginx 같은 웹 서버로 프록시 설정을 하지 않았다면, 
  // 아래처럼 WAS 서버의 실제 IP와 포트를 명시해야 합니다.
  baseURL: 'http://192.168.1.23:8000/api', 
  
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 💡 최적화: API 요청을 보낼 때마다 중간에 가로채서 헤더에 인증 정보를 자동 삽입
api.interceptors.request.use(
  (config) => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      // 토큰 기반 인증을 사용한다면 아래와 같이 추가
      // config.headers.Authorization = `Bearer ${user.token}`;
      
      // 세션이나 다른 방식으로 검증한다면 사용자 ID를 보낼 수도 있습니다.
      config.headers['X-User-Id'] = user.employee_id; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;