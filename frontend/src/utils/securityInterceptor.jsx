import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 도메인 주소 정제 헬퍼 (http://, https://, www, 슬래시 제거)
export const normalizeDomain = (url) => {
  if (!url) return '';
  let cleaned = url.trim().toLowerCase();
  if (cleaned.startsWith('http://')) cleaned = cleaned.replace('http://', '');
  if (cleaned.startsWith('https://')) cleaned = cleaned.replace('https://', '');
  cleaned = cleaned.split('/')[0].split(':')[0];
  if (cleaned.startsWith('www.')) cleaned = cleaned.replace('www.', '');
  return cleaned;
};

// 도메인 검사 및 차단 인터셉트 함수
export const checkAndInterceptDomain = async (inputUrl) => {
  const targetDomain = normalizeDomain(inputUrl);
  if (!targetDomain) return false;

  try {
    const res = await axios.get(`${baseUrl}/policies/blocklist/`);
    const policyList = Array.isArray(res.data) ? res.data : [];

    const isBlocked = policyList.some((item) => {
      const blocked = typeof item === 'string' ? item : item.no_access_domain;
      if (!blocked) return false;
      const normalizedBlocked = normalizeDomain(blocked);
      return targetDomain === normalizedBlocked || targetDomain.endsWith(`.${normalizedBlocked}`);
    });

    if (isBlocked) {
      alert(`🚨 [보안 차단 알림]\n\n'${targetDomain}' 주소는 사내 보안 정책상 차단된 유해 사이트입니다.\n접근 시도가 관제 센터에 보고되었습니다.`);

      const savedUser = localStorage.getItem('user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      const violatorId = user ? (user.emp_id || user.employee_id) : 'admin';

      // 백엔드로 위협 보고
      await axios.post(`${baseUrl}/threats/report/`, {
        violator: violatorId,
        blocked_domain: targetDomain,
        source_ip: user?.online_ip || '127.0.0.1'
      });

      return true;
    }

    return false;
  } catch (err) {
    console.error('인터셉트 에러:', err);
    return false;
  }
};