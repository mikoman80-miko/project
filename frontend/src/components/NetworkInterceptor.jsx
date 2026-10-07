import { useEffect } from 'react';
import axios from 'axios';

export const checkAndBlockDomain = async (targetDomain) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  try {
    // 1. 차단 정책 목록 가져오기
    const res = await axios.get(`${baseUrl}/policies/`);
    const blockedList = res.data.map(p => p.no_access_domain.toLowerCase());

    // 2. 입력/접속 시도 도메인 검사
    if (blockedList.includes(targetDomain.toLowerCase())) {
      // 💡 사용자 브라우저에 즉시 Alert 팝업
      alert(`🚨 [사내 보안 경고]\n접속 시도하신 '${targetDomain}' 은(는) 사내 보안 규정에 의해 차단된 사이트입니다.\n해당 접속 시도는 보안 관제 서버로 전송됩니다.`);

      // 💡 관리자 관제 서버로 위협 보고 자동 전송
      await axios.post(`${baseUrl}/threats/report/`, {
        source_ip: '127.0.0.1', // 현재 단말 IP
        blocked_domain: targetDomain
      });
      return false; // 접속 차단
    }
  } catch (err) {
    console.error('보안 정책 확인 에러:', err);
  }
  return true; // 접속 허용
};