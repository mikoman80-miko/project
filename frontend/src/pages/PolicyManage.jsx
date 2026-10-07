import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PolicyManage = () => {
  const [policies, setPolicies] = useState([]);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // 정책 목록 불러오기
  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${baseUrl}/policies/blocklist/`);
      setPolicies(res.data || []);
    } catch (err) {
      console.error('차단 정책 조회 실패:', err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // 차단 도메인 등록
  const handleAddPolicy = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/policies/add/`, {
        no_access_domain: domain.trim()
      });
      if (res.data.status === 'success') {
        alert('차단 도메인이 성공적으로 등록되었습니다.');
        setDomain('');
        fetchPolicies();
      }
    } catch (err) {
      alert(err.response?.data?.error || '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 차단 도메인 임시 삭제 (Soft Delete)
  const handleDeletePolicy = async (targetDomain) => {
    if (!window.confirm(`'${targetDomain}' 정책을 삭제하시겠습니까?`)) return;

    try {
      const res = await axios.post(`${baseUrl}/policies/delete/`, {
        no_access_domain: targetDomain
      });
      if (res.data.status === 'success') {
        alert('정책이 삭제되었습니다.');
        fetchPolicies();
      }
    } catch (err) {
      alert('삭제 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="page-header">
        <h2 className="page-title">🚫 유해/외부 사이트 차단 정책 관리</h2>
        <p className="page-subtitle">
          사내 단말이 접근할 수 없는 외부 도메인을 등록하고 제어합니다. (PCAP 엔진 자동 동기화)
        </p>
      </div>

      {/* 정책 등록 카드 */}
      <div className="card policy-register-card">
        <div className="card-header">
          <h3 className="card-title">➕ 신규 차단 도메인 추가</h3>
        </div>
        <form onSubmit={handleAddPolicy} className="policy-form">
          <input
            type="text"
            className="custom-input policy-input"
            placeholder="차단할 도메인 주소 입력 (예: youtube.com, badsite.org)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary policy-btn" disabled={loading}>
            {loading ? '등록 중...' : '정책 등록'}
          </button>
        </form>
      </div>

      {/* 활성 차단 목록 카드 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 현재 적용 중인 차단 목록</h3>
          <span className="card-count-badge">총 {policies.length}건</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>No</th>
                <th style={{ textAlign: 'left', paddingLeft: '24px' }}>차단 대상 도메인</th>
                <th style={{ width: '120px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {policies.length > 0 ? (
                policies.map((p, idx) => (
                  <tr key={p.no_access_domain}>
                    <td className="cell-time">{idx + 1}</td>
                    <td style={{ textAlign: 'left', paddingLeft: '24px' }}>
                      <span className="badge-danger-tag">
                        {p.no_access_domain}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeletePolicy(p.no_access_domain)}
                        className="btn-action btn-action-reject"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="table-empty">
                    등록된 차단 도메인이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PolicyManage;