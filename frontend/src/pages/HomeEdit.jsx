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

const HomeEdit = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const saved = localStorage.getItem("home_content");
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("home_content", JSON.stringify(content));
    // 동일 창 내 상태 갱신 트리거
    window.dispatchEvent(new Event("storage"));
    alert(
      "홈페이지 안내 문구가 성공적으로 저장되었습니다.\n공개 홈페이지에 즉시 반영됩니다.",
    );
  };

  const handleReset = () => {
    if (window.confirm("모든 문구를 기본값으로 복원하시겠습니까?")) {
      setContent(defaultContent);
      localStorage.setItem("home_content", JSON.stringify(defaultContent));
      window.dispatchEvent(new Event("storage"));
      alert("기본 문구로 복원되었습니다.");
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="page-header">
        <h2 className="page-title">🛠️ 회사 홈페이지(공개용) 컨텐츠 관리</h2>
        <p className="page-subtitle">
          외부 방문자에게 노출되는 메인 홈페이지의 홍보 문구와 안내 정보를
          수정합니다.
        </p>
      </div>

      <div className="card form-container-card">
        <form onSubmit={handleSave} className="form-stack">
          <div className="form-group">
            <label className="form-label">상단 홍보 배지 문구</label>
            <input
              type="text"
              className="custom-input"
              value={content.badgeText}
              onChange={(e) =>
                setContent({ ...content, badgeText: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              메인 대표 타이틀 (엔터로 줄바꿈 가능)
            </label>
            <textarea
              className="custom-input"
              style={{ minHeight: "65px", resize: "vertical" }}
              value={content.mainTitle}
              onChange={(e) =>
                setContent({ ...content, mainTitle: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">서비스 소개 본문</label>
            <textarea
              className="custom-input"
              style={{ minHeight: "100px", resize: "vertical" }}
              value={content.subText}
              onChange={(e) =>
                setContent({ ...content, subText: e.target.value })
              }
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">기술지원 이메일</label>
              <input
                type="text"
                className="custom-input"
                value={content.supportEmail}
                onChange={(e) =>
                  setContent({ ...content, supportEmail: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">관제실 연락처</label>
              <input
                type="text"
                className="custom-input"
                value={content.supportPhone}
                onChange={(e) =>
                  setContent({ ...content, supportPhone: e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1, padding: "12px" }}
            >
              홈페이지 수정 내용 저장
            </button>
            <button
              type="button"
              className="btn-action btn-action-cancel"
              style={{ padding: "12px 18px" }}
              onClick={handleReset}
            >
              기본값 복원
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeEdit;
