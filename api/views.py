import datetime
import json
import os
import re
import socket
from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Employees,
    NoAccessAddr,
    NoAccessAddrLog,
    OnlineIpLog,
    ProspectiveMembers,
)

RESTRICTED_IDS = {
    'admin',
    'administrator',
    'root',
    'manager',
    'sysadmin',
    'true',
    'false',
    'null',
    'undefined',
    'test',
    'guest',
}


def get_client_ip(request):
  x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
  if x_forwarded_for:
    ip = x_forwarded_for.split(',')[0].strip()
  else:
    ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
  return ip


# 💡 PCAP C 패킷 엔진용 JSON 파일 자동 동기화 헬퍼 함수
def sync_pcap_json_files():
    try:
        # 1. 차단 주소 목록 동기화 (no_access_addr.json)
        active_policies = NoAccessAddr.objects.filter(deleted_at__isnull=True)
        policy_list = []
        for p in active_policies:
            try:
                # 도메인을 IP로 변환 (DNS Lookup)
                resolved_ip = socket.gethostbyname(p.no_access_domain)
            except Exception:
                resolved_ip = "0.0.0.0"
            policy_list.append({
                "no_access_domain": p.no_access_domain,
                "no_access_ip": resolved_ip
            })

        with open('no_access_addr.json', 'w', encoding='utf-8') as f:
            json.dump(policy_list, f, indent=4, ensure_ascii=False)

        # 2. 인가된 실시간 접속 단말 목록 동기화 (online_ip.json)
        active_ips = OnlineIpLog.objects.select_related('employee').order_by('-login_time')[:100]
        ip_list = [
            {
                "employee_id": log.employee.employee_number,
                "online_ip": log.online_ip,
                "login_time": log.login_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            for log in active_ips
        ]
        with open('online_ip.json', 'w', encoding='utf-8') as f:
            json.dump(ip_list, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"[PCAP Sync Error] {e}")


# 1. 회원가입 신청 (일반인 가입 vs 사원 가입 신청 구분)
@api_view(['POST'])
def apply_signup(request):
  try:
    data = request.data
    member_id = str(data.get('member_id', '')).strip().lower()

    if not member_id or member_id in RESTRICTED_IDS:
      return Response(
          {'error': f"'{member_id}'는 사용할 수 없는 아이디입니다."},
          status=status.HTTP_400_BAD_REQUEST,
      )

    raw_phone = str(data.get('phone_number', ''))
    clean_phone = re.sub(r'[^0-9]', '', raw_phone)[:11]

    raw_jumin = str(data.get('jumin_no', ''))
    clean_jumin = re.sub(r'[^0-9]', '', raw_jumin)[:13]

    # 프론트엔드에서 전달받은 사원 지원 여부 (기본값 True)
    is_emp = data.get('is_employee_applicant', True)
    if isinstance(is_emp, str):
      is_emp = is_emp.lower() in ('true', '1')

    ProspectiveMembers.objects.create(
        member_id=member_id,
        password=make_password(data.get('password')),
        email=str(data.get('email', '')).strip(),
        address=str(data.get('address', '')).strip(),
        phone_number=clean_phone,
        jumin_no=clean_jumin,
        name=str(data.get('name', '')).strip(),
        is_employee_applicant=is_emp,
    )
    return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
  except Exception as e:
    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# 2. 로그인 (관리자 계정은 사내 특정 IP/로컬에서만 허용)
@api_view(['POST'])
def login(request):
  emp_id = request.data.get('employee_id')
  raw_password = request.data.get('password')

  employee = Employees.objects.filter(
      employee_id=emp_id, deleted_at__isnull=True
  ).first()

  if employee and check_password(raw_password, employee.password):
    client_ip = get_client_ip(request)

    # 💡 요구사항 2: 관리자는 사내 특정 보안망/지정 IP(또는 127.0.0.1)에서만 로그인 허용
    ALLOWED_ADMIN_PREFIX = os.getenv(
        'ADMIN_ALLOWED_IP_PREFIX', '192.168.3.'
    )  # 사내 관리망 대역
    ALLOWED_ADMIN_IPS = {'127.0.0.1', 'localhost', '192.168.3.50'}  # 특정 관리 PC

    if employee.is_manager:
      if not (
          client_ip in ALLOWED_ADMIN_IPS
          or client_ip.startswith(ALLOWED_ADMIN_PREFIX)
      ):
        return Response(
            {
                'status': 'error',
                'message': (
                    '접근 거부: 관리자 계정은 지정된 사내 관리 전용 PC에서만'
                    ' 로그인할 수 있습니다.'
                ),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # 접속 로그 생성 (기존 미종료 세션은 유지 또는 신규 등록)
    OnlineIpLog.objects.create(employee=employee, online_ip=client_ip)
    sync_pcap_json_files()

    return Response({
        'status': 'success',
        'user': {
            'emp_id': employee.employee_id,
            'name': employee.name,
            'is_manager': employee.is_manager,
            'online_ip': client_ip,
        },
    })
  return Response(
      {'status': 'error', 'message': '아이디 또는 비밀번호가 일치하지 않습니다.'},
      status=status.HTTP_401_UNAUTHORIZED,
  )


# 2-1. 사내망 캡티브 포털 1회 인증 (외부 사이트 접속 시 1회 경고 후 인증용)
@api_view(['POST'])
def captive_login(request):
    emp_id = request.data.get('employee_id')
    raw_password = request.data.get('password')

    employee = Employees.objects.filter(employee_id=emp_id, deleted_at__isnull=True).first()

    if employee and check_password(raw_password, employee.password):
        client_ip = get_client_ip(request)

        OnlineIpLog.objects.create(
            employee=employee,
            online_ip=client_ip
        )
        sync_pcap_json_files()  # PCAP 엔진에 인가 IP 등록 동기화

        return Response({
            "status": "success",
            "message": f"{employee.name} 사원님 인증 완료. 외부 인터넷 접속이 승인되었습니다.",
            "user": {
                "emp_id": employee.employee_id,
                "name": employee.name,
                "online_ip": client_ip
            }
        })
    return Response({
        "status": "error",
        "message": "인증 정보(사번 또는 비밀번호)가 일치하지 않습니다."
    }, status=status.HTTP_401_UNAUTHORIZED)


# 3. 차단 정책 목록 불러오기 (DB 명세서: no_access_domain, deleted_at만 존재)
@api_view(['GET'])
def get_blocklist(request):
    # 삭제되지 않은 활성 정책만 반환
    policies = NoAccessAddr.objects.filter(deleted_at__isnull=True).values('no_access_domain')
    return Response(list(policies))


# 4. 차단 정책 추가
@api_view(['POST'])
def add_policy(request):
    domain = str(request.data.get('no_access_domain', '')).strip().lower()
    if not domain:
        return Response({"error": "차단할 도메인 주소를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 기존에 삭제 처리(Soft Delete)되었던 도메인이면 복구, 없으면 새로 생성
        policy = NoAccessAddr.objects.filter(no_access_domain=domain).first()
        if policy:
            policy.deleted_at = None
            policy.save()
        else:
            NoAccessAddr.objects.create(no_access_domain=domain)

        sync_pcap_json_files()  # PCAP 엔진용 JSON 갱신
        return Response({"status": "success"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# 4-1. 차단 정책 삭제 (DB 명세서: 5년 보관 Soft Delete)
@api_view(['POST'])
def delete_policy(request):
    domain = request.data.get('no_access_domain')
    try:
        policy = NoAccessAddr.objects.get(no_access_domain=domain, deleted_at__isnull=True)
        policy.deleted_at = timezone.now().date()
        policy.save()

        sync_pcap_json_files()  # PCAP 엔진용 JSON 갱신
        return Response({"status": "success", "message": "차단 정책이 임시 삭제되었습니다."})
    except NoAccessAddr.DoesNotExist:
        return Response({"status": "error", "message": "해당 정책을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

# 5. 위협 로그 수집 (웹 모의 테스트 및 PCAP 엔진 연동)
@api_view(['POST'])
def report_violation(request):
    source_ip = request.data.get('source_ip') or request.data.get('src_ip')
    blocked_domain = request.data.get('blocked_domain', '').strip()
    violator = request.data.get('violator')

    try:
        # 1. 차단 도메인 객체 매칭 (없으면 자동 생성)
        policy, _ = NoAccessAddr.objects.get_or_create(no_access_domain=blocked_domain)

        # 2. 사원 매칭 (IP 또는 아이디/사번)
        employee = None
        if source_ip:
            online_log = OnlineIpLog.objects.filter(online_ip=source_ip).order_by('-login_time').first()
            if online_log:
                employee = online_log.employee

        if not employee and violator:
            employee = Employees.objects.filter(employee_id=str(violator)).first()

        if not employee:
            # 매칭 사원이 없을 경우 첫 번째 사원(관리자)으로 매칭
            employee = Employees.objects.first()

        # 3. 위협 로그 DB 레코드 생성
        NoAccessAddrLog.objects.create(
            employee=employee,
            no_access_domain=policy,
            access_time=timezone.now()
        )

        # 실시간 반영을 위해 대시보드 캐시 즉각 삭제
        cache.delete('dashboard_threat_logs')

        return Response({"status": "success"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# [추가] 로그아웃 API: 현재 IP의 접속 기록에 logout_time 기록
@api_view(['POST'])
def logout_user(request):
    emp_id = request.data.get('employee_id')
    client_ip = get_client_ip(request)

    # 해당 사원의 가장 최근 로그인 기록에 로그아웃 시간 업데이트
    log = OnlineIpLog.objects.filter(employee__employee_id=emp_id, logout_time__isnull=True).order_by('-login_time').first()
    if log:
        log.logout_time = timezone.now()
        log.save()
    return Response({"status": "success", "message": "로그아웃 처리되었습니다."})


# 6. [수정] 대시보드 - 홈페이지 접속자 (로그인 상태, 로그인 시간, 로그아웃 시간)
@api_view(['GET'])
def get_online_users(request):
    # 최근 15개 접속 이력
    logs = OnlineIpLog.objects.select_related('employee').order_by('-login_time')[:15]

    data = []
    for log in logs:
        is_online = log.logout_time is None
        data.append({
            "id": log.id,
            "emp_name": log.employee.name,
            "emp_id": log.employee.employee_id,
            "ip": log.online_ip,
            "is_online": is_online,
            "status_text": "접속 중" if is_online else "로그아웃",
            "login_time": log.login_time.strftime("%Y-%m-%d %H:%M:%S") if log.login_time else "-",
            "logout_time": log.logout_time.strftime("%Y-%m-%d %H:%M:%S") if log.logout_time else "-"
        })
    return Response(data)


# 6-1. [수정] 대시보드 - 외부 인터넷 접속 승인 목록 (IP별 중복 제거: 최신 1건만 유지)
@api_view(['GET'])
def get_external_access_logs(request):
    # 전체 승인 로그 중 IP별 가장 최신 건만 유니크하게 필터링
    logs = OnlineIpLog.objects.select_related('employee').exclude(online_ip__startswith='192.168.1.').order_by('-login_time')

    seen_ips = set()
    unique_data = []

    for log in logs:
        if log.online_ip not in seen_ips:
            seen_ips.add(log.online_ip)
            unique_data.append({
                "id": log.id,
                "emp_name": log.employee.name,
                "emp_id": log.employee.employee_id,
                "ip": log.online_ip,
                "access_time": log.login_time.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "허용됨"
            })
            if len(unique_data) >= 10:
                break

    return Response(unique_data)


# 7. 대시보드 - 위협 탐지 로그 (캐시 지연 없는 즉시 조회)
@api_view(['GET'])
def get_threat_logs(request):
    logs = NoAccessAddrLog.objects.select_related('employee', 'no_access_domain').order_by('-access_time')[:15]
    data = [
        {
            "id": log.id,
            "violator": f"{log.employee.name} ({log.employee.employee_id})" if log.employee else "외부 단말",
            "blocked_domain": log.no_access_domain.no_access_domain,
            "time": log.access_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        for log in logs
    ]
    return Response(data)


# 8. 사원 목록 조회 (백엔드 마스킹 및 5년 삭제 필터링)
@api_view(['GET'])
def get_employees(request):
    # 삭제되지 않은 정직원만 조회
    employees = Employees.objects.filter(deleted_at__isnull=True).values(
        'employee_id', 'employee_number', 'hire_date', 'name',
        'phone_number', 'email', 'jumin_no', 'address'
    )

    data = []
    for emp in employees:
        current_ym = emp['hire_date'].strftime('%Y%m') if emp['hire_date'] else datetime.datetime.now().strftime('%Y%m')
        emp_code = f"ST{current_ym}{emp['employee_number']:02d}"

        # 💡 보안: 민감 식별정보 마스킹 처리
        raw_jumin = str(emp.get('jumin_no', ''))
        masked_jumin = f"{raw_jumin[:6]}-*******" if len(raw_jumin) >= 6 else "[RRN Omitted]"

        data.append({
            "employee_id": emp['employee_id'],
            "emp_code": emp_code,
            "name": emp['name'],
            "phone_number": emp['phone_number'],
            "email": emp['email'],
            "jumin_no": masked_jumin,
            "address": emp['address']
        })
    return Response(data)


# 9. 사원 정보 업데이트 (주소, 연락처만 수정 가능)
@api_view(['POST'])
def update_employee(request):
    emp_id = request.data.get('employee_id')
    try:
        employee = Employees.objects.get(employee_id=emp_id, deleted_at__isnull=True)
        employee.phone_number = request.data.get('phone_number', employee.phone_number)
        employee.address = request.data.get('address', employee.address)
        employee.save()
        return Response({"status": "success", "message": "개인정보가 성공적으로 수정되었습니다."})
    except Employees.DoesNotExist:
        return Response({"status": "error", "message": "해당 사원 정보를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)


# 9-1. 사원 퇴사/임시 삭제 (DB 명세서: 5년 보관 Soft Delete)
@api_view(['POST'])
def delete_employee(request):
    emp_id = request.data.get('employee_id')
    try:
        employee = Employees.objects.get(employee_id=emp_id, deleted_at__isnull=True)
        employee.deleted_at = timezone.now().date()
        employee.save()
        return Response({"status": "success", "message": "사원 정보가 비활성화(임시 삭제)되었습니다."})
    except Employees.DoesNotExist:
        return Response({"status": "error", "message": "해당 사원을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)


# 10. 가입 대기자 목록 조회
@api_view(['GET'])
def get_pending_members(request):
  pending = ProspectiveMembers.objects.all().order_by('-date_of_request')
  data = [
      {
          'member_id': p.member_id,
          'name': p.name,
          'email': p.email,
          'phone_number': p.phone_number,
          'address': p.address,
          'is_employee_applicant': p.is_employee_applicant,
          'type_label': (
              '사원 지원' if p.is_employee_applicant else '일반 회원'
          ),
          'date_of_request': (
              p.date_of_request.strftime('%Y-%m-%d')
              if p.date_of_request
              else '-'
          ),
      }
      for p in pending
  ]
  return Response(data)


# 11. 가입 승인 (관리자가 '사원' 또는 '일반' 승인 버튼 선택)
@api_view(['POST'])
def approve_member(request):
  member_id = request.data.get('member_id')
  approval_role = request.data.get(
      'role', 'employee'
  )  # 'employee' 또는 'general'

  try:
    pending_user = ProspectiveMembers.objects.get(member_id=member_id)

    if approval_role == 'employee':
      # [사원 승인]: 공식 사번 발급 및 사내 도메인 메일 부여
      personal_email_id = pending_user.email.split('@')[0]
      company_email = f'{personal_email_id}@ST.co.kr'

      emp = Employees.objects.create(
          employee_id=pending_user.member_id,
          password=pending_user.password,
          email=company_email,
          address=pending_user.address,
          phone_number=pending_user.phone_number,
          jumin_no=pending_user.jumin_no,
          name=pending_user.name,
          is_manager=False,
      )

      current_ym = datetime.datetime.now().strftime('%Y%m')
      emp_code = f'ST{current_ym}{emp.employee_number:02d}'
      msg = (
          f'정규 사원 임용 승인 완료!\n- 성명: {emp.name}\n- 공식 사번:'
          f' {emp_code}\n- 사내 메일: {company_email}'
      )
    else:
      # [일반 회원 승인]: 사번 없이 기본 회원 등록 (개인 이메일 유지)
      emp = Employees.objects.create(
          employee_id=pending_user.member_id,
          password=pending_user.password,
          email=pending_user.email,
          address=pending_user.address,
          phone_number=pending_user.phone_number,
          jumin_no=pending_user.jumin_no,
          name=pending_user.name,
          is_manager=False,
      )
      msg = (
          f'일반 회원 승인 완료!\n{emp.name} 님의 계정이 정상 활성화되었습니다.'
      )

    pending_user.delete()
    return Response({'status': 'success', 'message': msg})

  except ProspectiveMembers.DoesNotExist:
    return Response(
        {'status': 'error', 'message': '해당 가입 대기자를 찾을 수 없습니다.'},
        status=status.HTTP_404_NOT_FOUND,
    )
  except Exception as e:
    return Response(
        {'status': 'error', 'message': str(e)},
        status=status.HTTP_400_BAD_REQUEST,
    )


# 12. 가입 거절
@api_view(['POST'])
def reject_member(request):
    member_id = request.data.get('member_id')
    try:
        pending_user = ProspectiveMembers.objects.get(member_id=member_id)
        pending_user.delete()
        return Response({"status": "success", "message": "가입 요청이 거절되었습니다."})
    except ProspectiveMembers.DoesNotExist:
        return Response({"status": "error"}, status=status.HTTP_404_NOT_FOUND)


# 통합 대시보드 - 사원 인증 현황 API
@api_view(['GET'])
def get_employee_auth_status(request):
    # 최근 접속 로그 가져오기
    logs = OnlineIpLog.objects.select_related('employee').order_by('-login_time')

    seen_ips = set()
    status_list = []

    for log in logs:
        # 단말 IP 기준으로 가장 최신 상태 1건씩 취합
        if log.online_ip not in seen_ips:
            seen_ips.add(log.online_ip)

            is_active = (log.logout_time is None)

            # 외부 인터넷 승인 여부 판정 (캡티브 인증 완료된 단말인지)
            # 관리자망 외의 대역 또는 로컬 테스트 IP 허용
            external_approved = True  # 현재 OnlineIpLog에 등재된 IP는 인증을 마친 상태로 간주

            status_list.append({
                "id": log.id,
                "emp_name": log.employee.name,
                "emp_id": log.employee.employee_id,
                "ip": log.online_ip,
                "login_status": "접속 중" if is_active else "로그아웃",
                "is_active": is_active,
                "external_status": "승인 완료" if external_approved else "미승인",
                "login_time": log.login_time.strftime("%Y-%m-%d %H:%M:%S") if log.login_time else "-",
                "logout_time": log.logout_time.strftime("%Y-%m-%d %H:%M:%S") if log.logout_time else "-"
            })
            if len(status_list) >= 15:
                break

    return Response(status_list)

# 13. 마이페이지 내 정보 조회
@api_view(['POST'])
def get_my_info(request):
  emp_id = request.data.get('employee_id')
  if not emp_id:
    return Response(
        {'status': 'error', 'message': '사원 ID가 제공되지 않았습니다.'},
        status=status.HTTP_400_BAD_REQUEST,
    )

  try:
    emp = Employees.objects.get(employee_id=emp_id, deleted_at__isnull=True)
    current_ym = (
        emp.hire_date.strftime('%Y%m')
        if emp.hire_date
        else datetime.datetime.now().strftime('%Y%m')
    )
    emp_code = f'ST{current_ym}{emp.employee_number:02d}'

    raw_jumin = str(emp.jumin_no) if emp.jumin_no else ''
    masked_jumin = (
        f'{raw_jumin[:6]}-*******'
        if len(raw_jumin) >= 6
        else '[RRN Omitted]'
    )

    return Response({
        'status': 'success',
        'data': {
            'emp_code': emp_code,
            'employee_id': emp.employee_id,
            'name': emp.name,
            'email': emp.email,
            'address': emp.address,
            'phone_number': emp.phone_number,
            'jumin_no': masked_jumin,
            'is_manager': emp.is_manager,
        },
    })
  except Employees.DoesNotExist:
    return Response(
        {'status': 'error', 'message': '해당 사원 정보를 찾을 수 없습니다.'},
        status=status.HTTP_404_NOT_FOUND,
    )
  except Exception as e:
    return Response(
        {'status': 'error', 'message': str(e)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

# 마이페이지 회원 정보 조회 및 수정
@api_view(['GET', 'PUT'])
def my_profile(request):
  emp_id = request.query_params.get('employee_id') or request.data.get(
      'employee_id'
  )
  try:
    emp = Employees.objects.get(employee_id=emp_id, deleted_at__isnull=True)
  except Employees.DoesNotExist:
    return Response(
        {'status': 'error', 'message': '사용자를 찾을 수 없습니다.'},
        status=status.HTTP_404_NOT_FOUND,
    )

  if request.method == 'GET':
    # 사번 포맷 생성 (ST202601 등)
    current_ym = emp.hire_date.strftime('%Y%m')
    emp_code = f'ST{current_ym}{emp.employee_number:02d}'

    return Response({
        'employee_id': emp.employee_id,
        'name': emp.name,
        'email': emp.email,
        'phone_number': emp.phone_number,
        'address': emp.address,
        'is_manager': emp.is_manager,
        'emp_code': emp_code,
        'hire_date': emp.hire_date.strftime('%Y-%m-%d'),
    })

  elif request.method == 'PUT':
    data = request.data
    emp.name = data.get('name', emp.name)
    emp.phone_number = data.get('phone_number', emp.phone_number)
    emp.address = data.get('address', emp.address)

    # 비밀번호 변경 요청이 있는 경우
    new_pw = data.get('new_password')
    if new_pw and len(new_pw.strip()) > 0:
      emp.password = make_password(new_pw.strip())

    emp.save()
    return Response(
        {'status': 'success', 'message': '개인정보가 성공적으로 수정되었습니다.'}
    )

# 14. 회원가입 중복 검사 API
@api_view(['POST'])
def check_duplicate(request):
    field = request.data.get('field')
    value = str(request.data.get('value', '')).strip()

    if not field or not value:
        return Response({"status": "error", "message": "잘못된 요청입니다."}, status=status.HTTP_400_BAD_REQUEST)

    if field == 'member_id' and value.lower() in RESTRICTED_IDS:
        return Response({
            "is_duplicate": True,
            "message": f"'{value}'는 시스템 예약어로 사용할 수 없습니다."
        })

    # 💡 ProspectiveMembers 컬럼명(member_id)과 Employees 컬럼명(employee_id) 매핑 분기
    emp_field = 'employee_id' if field == 'member_id' else field
    member_field = field

    is_duplicate = (
        ProspectiveMembers.objects.filter(**{member_field: value}).exists() or
        Employees.objects.filter(**{emp_field: value}, deleted_at__isnull=True).exists()
    )

    if is_duplicate:
        field_names = {
            'member_id': '아이디',
            'email': '이메일',
            'phone_number': '전화번호',
            'jumin_no': '주민등록번호'
        }
        name_kr = field_names.get(field, field)
        return Response({
            "is_duplicate": True,
            "message": f"이미 사용 중이거나 가입 대기 중인 {name_kr}입니다."
        })
    else:
        return Response({"is_duplicate": False})