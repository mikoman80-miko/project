import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';

const EmployeeManage = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ phone_number: '', address: '' });

  // 💡 최적화: useCallback으로 감싸서 무의미한 함수 재생성 방지
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('직원 목록 로드 오류:', error);
    }
  }, []);

  useEffect(() => { 
    fetchEmployees(); 
  }, [fetchEmployees]);

  const handleEditClick = (emp) => {
    setEditId(emp.employee_id);
    setEditForm({ phone_number: emp.phone_number, address: emp.address });
  };

  const handleSaveClick = async (empId) => {
    try {
      await api.post('/employees/update/', {
        employee_id: empId,
        ...editForm
      });
      alert('수정되었습니다.');
      setEditId(null);
      fetchEmployees();
    } catch (error) {
      alert('수정 중 오류 발생');
    }
  };

  // 💡 보안: 주민등록번호 뒷자리 마스킹 함수
  const maskJuminNo = (jumin) => {
    if (!jumin) return '';
    return jumin.length >= 14 ? `${jumin.substring(0, 8)}******` : '[RRN Omitted]';
  };

  // 💡 최적화: 검색어(searchTerm)나 직원 목록(employees)이 바뀔 때만 재연산
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.includes(searchTerm) || emp.emp_code.includes(searchTerm)
    );
  }, [employees, searchTerm]);

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
      {/* ... 기존 헤더 영역 ... */}
      
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ minWidth: '1000px' }}>
          {/* ... 기존 thead ... */}
          <tbody>
            {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
              <tr key={emp.employee_id}>
                <td><span className="badge badge-green">{emp.emp_code}</span></td>
                <td style={{ fontWeight: 'bold' }}>{emp.name}</td>
                <td style={{ color: '#64748b' }}>{emp.employee_id}</td>
                {/* 💡 마스킹 함수 적용 */}
                <td style={{ color: '#64748b' }}>{maskJuminNo(emp.jumin_no)}</td>
                <td>{emp.email}</td>
                {/* ... 나머지 td 및 관리 버튼들 기존과 동일 ... */}
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>검색된 사원이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManage;