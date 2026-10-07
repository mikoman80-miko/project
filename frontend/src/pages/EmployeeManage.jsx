import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeManage = () => {
  const [employees, setEmployees] = useState([]);
  const [editingEmp, setEditingEmp] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${baseUrl}/employees/`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error('사원 목록 조회 실패:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEditClick = (emp) => {
    setEditingEmp(emp.employee_id);
    setPhone(emp.phone_number || '');
    setAddress(emp.address || '');
  };

  const handleUpdate = async (empId) => {
    try {
      const res = await axios.post(`${baseUrl}/employees/update/`, {
        employee_id: empId,
        phone_number: phone,
        address: address
      });
      if (res.data.status === 'success') {
        alert('사원 정보가 수정되었습니다.');
        setEditingEmp(null);
        fetchEmployees();
      }
    } catch (err) {
      alert('수정 실패');
    }
  };

  // 💡 DB 명세서 규격: 5년 보관 Soft Delete 처리
  const handleDelete = async (empId, empName) => {
    if (!window.confirm(`'${empName}' 사원을 퇴사/비활성화 처리하시겠습니까? (5년간 보관 후 자동 파기)`)) return;

    try {
      const res = await axios.post(`${baseUrl}/employees/delete/`, {
        employee_id: empId
      });
      if (res.data.status === 'success') {
        alert('사원 정보가 비활성화되었습니다.');
        fetchEmployees();
      }
    } catch (err) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 주민등록번호 마스킹 표시 함수 (앞 6자리 - *******)
  const formatMaskedJumin = (jumin) => {
    if (!jumin) return '-';
    const clean = String(jumin).replace(/[^0-9]/g, '');
    if (clean.length >= 6) {
      return `${clean.substring(0, 6)}-*******`;
    }
    return '******-*******';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">👥 사원 관리 명부</h2>
        <p className="page-subtitle">재직 중인 사원의 인적 사항 및 통신 인가를 관리합니다.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">재직 사원 목록</h3>
          <span className="card-count-badge">총 {employees.length}명</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>사번</th>
                <th style={{ width: '100px' }}>이름</th>
                <th style={{ width: '130px' }}>아이디</th>
                <th>사내 이메일</th>
                <th style={{ width: '140px' }}>연락처</th>
                <th>주소</th>
                <th style={{ width: '130px' }}>주민번호</th>
                <th style={{ width: '150px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td className="cell-emp-name">{emp.emp_code}</td>
                    <td style={{ fontWeight: '500' }}>{emp.name}</td>
                    <td className="emp-sub-id">{emp.employee_id}</td>
                    <td className="cell-email">{emp.email}</td>
                    <td>
                      {editingEmp === emp.employee_id ? (
                        <input
                          type="text"
                          className="custom-input inline-edit-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      ) : (
                        <span className="cell-phone">{emp.phone_number}</span>
                      )}
                    </td>
                    <td>
                      {editingEmp === emp.employee_id ? (
                        <input
                          type="text"
                          className="custom-input inline-edit-input"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      ) : (
                        <span className="cell-address">{emp.address}</span>
                      )}
                    </td>
                    <td className="cell-time">{formatMaskedJumin(emp.jumin_no)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {editingEmp === emp.employee_id ? (
                        <div className="action-btn-group">
                          <button
                            type="button"
                            className="btn-action btn-action-save"
                            onClick={() => handleUpdate(emp.employee_id)}
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-cancel"
                            onClick={() => setEditingEmp(null)}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="action-btn-group">
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            onClick={() => handleEditClick(emp)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-reject"
                            onClick={() => handleDelete(emp.employee_id, emp.name)}
                          >
                            퇴사/삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="table-empty">
                    등록된 사원 데이터가 없습니다.
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

export default EmployeeManage;