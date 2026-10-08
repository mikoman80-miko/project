import axios from "axios";

// 도메인 주소 정제 헬퍼 (프로토콜, www, 포트, 경로 제거)
export const normalizeDomain = (url) => {
  if (!url) return "";
  let cleaned = String(url).trim().toLowerCase();
  cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
  cleaned = cleaned.split("/")[0].split(":")[0];
  return cleaned;
};

// 도메인 검사 및 위협 차단 인터셉트 함수
export const checkAndInterceptDomain = async (inputUrl) => {
  const targetDomain = normalizeDomain(inputUrl);
  if (!targetDomain) return false;

  const currentHost = window.location.hostname;
  const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL || `http://${currentHost}:8000`;
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  try {
    // 1. 차단 정책 목록 가져오기 (정확한 엔드포인트: /policies/blocklist/)
    const res = await axios.get(`${baseUrl}/policies/blocklist/`);
    const policyList = Array.isArray(res.data) ? res.data : [];

    // 2. 도메인 및 서브도메인 일치 여부 확인
    const isBlocked = policyList.some((item) => {
      const blocked = typeof item === "string" ? item : item.no_access_domain;
      if (!blocked) return false;
      const normalizedBlocked = normalizeDomain(blocked);
      return (
        targetDomain === normalizedBlocked ||
        targetDomain.endsWith(`.${normalizedBlocked}`)
      );
    });

    if (isBlocked) {
      // 차단 팝업 경고
      alert(
        `🚨 [사내 보안 차단 알림]\n\n'${targetDomain}' 주소는 사내 보안 정책에 의해 차단된 유해 사이트입니다.\n접근 시도가 보안 관제 대시보드에 즉시 보고되었습니다.`,
      );

      // 세션에서 로그인한 사원 식별
      const savedUser = localStorage.getItem("user");
      let violatorId = "UNKNOWN";
      let clientIp = "127.0.0.1";

      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          violatorId =
            user.employee_id || user.emp_id || user.name || "UNKNOWN";
          if (user.online_ip) clientIp = user.online_ip;
        } catch (e) {
          console.error("사용자 세션 파싱 오류:", e);
        }
      }

      // 백엔드 위협 로그(/threats/report/) 자동 전송
      await axios.post(`${baseUrl}/threats/report/`, {
        violator: violatorId,
        blocked_domain: targetDomain,
        source_ip: clientIp,
      });

      return true; // 차단됨
    }

    return false; // 정상 허용
  } catch (err) {
    console.error("도메인 보안 정책 검사 오류:", err);
    return false;
  }
};
