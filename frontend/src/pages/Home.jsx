import React, { useState, useEffect } from "react";

const defaultContent = {
  badgeText: "Next-Generation Enterprise Network Security",
  mainTitle:
    "지능형 인프라 통제와 실시간 패킷 관제\nSecureTech 차세대 보안 플랫폼",
  subText:
    "SecureTech는 고성능 패킷 스니핑/인젝션 엔진과 물리적 망 분리 기술을 융합하여, 비인가 단말의 사내망 침입 차단 및 실시간 위험 트래픽 분석을 단일 중앙 콘솔에서 실현합니다.",
  supportEmail: "support@ST.co.kr",
  supportPhone: "내선 1004",
};

const Home = () => {
  const [content, setContent] = useState(defaultContent);

  const loadContent = () => {
    const saved = localStorage.getItem("home_content");
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (e) {
        console.error("컨텐츠 파싱 오류:", e);
      }
    }
  };

  useEffect(() => {
    loadContent();

    // 관리자 페이지에서 수정 시 실시간 즉시 반영 (새로고침 불필요)
    const handleStorageChange = (e) => {
      if (e.key === "home_content" && e.newValue) {
        try {
          setContent(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px 24px 60px 24px",
      }}
    >
      {/* 1. 메인 히어로 섹션 */}
      <section
        style={{
          textAlign: "center",
          padding: "70px 20px 60px 20px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e2e8f0",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            backgroundColor: "#e0f2fe",
            color: "#0284c7",
            borderRadius: "9999px",
            fontWeight: "700",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          {content.badgeText}
        </div>

        <h1
          style={{
            fontSize: "38px",
            color: "#0f172a",
            fontWeight: "800",
            lineHeight: "1.35",
            marginBottom: "20px",
            whiteSpace: "pre-line",
          }}
        >
          {content.mainTitle}
        </h1>

        <p
          style={{
            fontSize: "17px",
            color: "#475569",
            lineHeight: "1.7",
            maxWidth: "740px",
            margin: "0 auto",
            wordBreak: "keep-all",
            whiteSpace: "pre-line",
          }}
        >
          {content.subText}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginTop: "40px",
            paddingTop: "30px",
            borderTop: "1px solid #f1f5f9",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}
            >
              0.01s
            </div>
            <div
              style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}
            >
              패킷 인젝션 응답속도
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: "26px", fontWeight: "800", color: "#0284c7" }}
            >
              100%
            </div>
            <div
              style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}
            >
              비인가 단말 격리율
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: "26px", fontWeight: "800", color: "#10b981" }}
            >
              24 / 7
            </div>
            <div
              style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}
            >
              실시간 정책 동기화
            </div>
          </div>
        </div>
      </section>

      {/* 2. 핵심 기술 카드 */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "50px",
        }}
      >
        <div className="card" style={{ padding: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🛡️</div>
          <h3
            style={{
              fontSize: "19px",
              color: "#1e293b",
              marginBottom: "12px",
              fontWeight: "700",
            }}
          >
            패킷 인젝션 기반 즉시 격리
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            사내 미인가 단말이 외부 인터넷 접속을 요청할 때 즉시 RST 패킷과 HTTP
            302 Found 리다이렉트를 주입하여 비인가 트래픽을 원천 차단합니다.
          </p>
        </div>
        <div className="card" style={{ padding: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>📊</div>
          <h3
            style={{
              fontSize: "19px",
              color: "#1e293b",
              marginBottom: "12px",
              fontWeight: "700",
            }}
          >
            실시간 트래픽 & 위협 관제
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            사내 접속 단말의 온라인 세션 상태와 차단 도메인 접속 시도를 실시간
            동기화하여 보안 관리자에게 상황판을 제공합니다.
          </p>
        </div>
        <div className="card" style={{ padding: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔒</div>
          <h3
            style={{
              fontSize: "19px",
              color: "#1e293b",
              marginBottom: "12px",
              fontWeight: "700",
            }}
          >
            통합 계정 & 사내망 인가
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            공식 사번 조합 부여 및 도메인 이메일 자동 발급 체계를 구축하며,
            관리자 IP 대역 통제를 통해 내부 침해를 방지합니다.
          </p>
        </div>
      </section>

      {/* 3. 안내 섹션 */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "36px",
          border: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h4
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 6px 0",
            }}
          >
            사내 인트라넷 계정이 필요하신가요?
          </h4>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            신규 입사자 및 임직원은 상단 우측의 <strong>[가입 신청]</strong>을
            통해 계정 발급을 요청하실 수 있습니다.
          </p>
        </div>
        <div style={{ fontSize: "13px", color: "#94a3b8" }}>
          기술 지원 문의: {content.supportEmail} | 보안 관제실:{" "}
          {content.supportPhone}
        </div>
      </section>

      <footer
        style={{
          marginTop: "60px",
          borderTop: "1px solid #e2e8f0",
          paddingTop: "24px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        <p>
          © 2026 SecureTech Inc. All rights reserved. 네트워크 경계 보안 &
          캡티브 포털 관제 시스템
        </p>
      </footer>
    </div>
  );
};

export default Home;
