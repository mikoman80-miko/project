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
    WhiteListAddr,
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

# 기본 시스템 필수 예약 도메인 (DB에 없어도 상시 보호)
DEFAULT_STATIC_WHITELIST = {
    'localhost',
    '127.0.0.1',
    'st.co.kr',
    'securetech.co.kr',
}

# 💡 차단 예외 화이트리스트 도메인 (사내 필수 시스템, 포털, 루프백 등)
WHITELIST_DOMAINS = {
    'localhost',
    '127.0.0.1',
    'st.co.kr',
    'portal.st.co.kr',
    'gw.st.co.kr',
    'securetech.co.kr',
}


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


# PCAP C 패킷 엔진용 JSON 파일 자동 동기화 헬퍼 함수
def sync_pcap_json_files():
    try:
        # 1. 차단 주소 목록 동기화 (no_access_addr.json)
        active_policies = NoAccessAddr.objects.filter(deleted_at__isnull=True)
        policy_list = []
        for p in active_policies:
            try:
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
                "employee_id": log.employee.employee_id,
                "online_ip": log.online_ip,
                "login_time": log.login_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            for log in active_ips
        ]
        with open('online_ip.json', 'w', encoding='utf-8') as f:
            json.dump(ip_list, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"[PCAP Sync Error] {e}")


# 1. 회원가입 신청
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


# 2. 로그인
@api_view(['POST'])
def login(request):
    emp_id = request.data.get('employee_id')
    raw_password = request.data.get('password')

    employee = Employees.objects.filter(
        employee_id=emp_id, deleted_at__isnull=True
    ).first()

    if employee and check_password(raw_password, employee.password):
        client_ip = get_client_ip(request)

        ALLOWED_ADMIN_PREFIX = os.getenv('ADMIN_ALLOWED_IP_PREFIX', '192.168.3.')
        ALLOWED_ADMIN_IPS = {'127.0.0.1', 'localhost', '::1', '192.168.3.50'}

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


# 2-1. 사내망 캡티브 포털 1회 인증
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
        sync_pcap_json_files()

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


# 3. 차단 정책 목록 불러오기
@api_view(['GET'])
def get_blocklist(request):
    policies = NoAccessAddr.objects.filter(deleted_at__isnull=True).values('no_access_domain')
    return Response(list(policies))


# 3-1. 차단 예외(화이트리스트) 목록 불러오기 (DB + 기본 도메인)
@api_view(['GET'])
def get_whitelist(request):
    db_items = WhiteListAddr.objects.all().values('domain', 'description', 'created_at')
    # 기본 시스템 도메인이 DB에 없다면 추가하여 반환
    domain_set = {item['domain'] for item in db_items}
    results = list(db_items)
    for default_domain in DEFAULT_STATIC_WHITELIST:
        if default_domain not in domain_set:
            results.append({
                'domain': default_domain,
                'description': '시스템 기본 보호 도메인',
                'created_at': None
            })
    results.sort(key=lambda x: x['domain'])
    return Response(results)


# 3-2. 차단 예외(화이트리스트) 도메인 추가
@api_view(['POST'])
def add_whitelist(request):
    domain = str(request.data.get('domain', '')).strip().lower()
    desc = str(request.data.get('description', '')).strip()

    if not domain:
        return Response({'error': '예외 처리할 도메인을 입력해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1) 이미 차단 정책에 등록된 도메인인 경우 차단 목록에서 자동 해제 또는 알림
    active_block = NoAccessAddr.objects.filter(no_access_domain=domain, deleted_at__isnull=True).first()
    if active_block:
        # 차단 정책에서 제거(Soft Delete)
        active_block.deleted_at = timezone.now().date()
        active_block.save()

    # 2) 화이트리스트 등록 (중복 검사)
    item, created = WhiteListAddr.objects.get_or_create(
        domain=domain,
        defaults={'description': desc or '관리자 지정 예외 도메인'}
    )
    if not created:
        return Response({'error': f"'{domain}'은(는) 이미 등록된 예외 도메인입니다."}, status=status.HTTP_400_BAD_REQUEST)

    sync_pcap_json_files()
    return Response({'status': 'success', 'message': f"'{domain}'이(가) 차단 예외 도메인으로 등록되었습니다."},
                    status=status.HTTP_201_CREATED)


# 3-3. 차단 예외(화이트리스트) 도메인 삭제 (기본 도메인 포함 전체 삭제 가능 버전)
@api_view(['POST'])
def delete_whitelist(request):
    domain = str(request.data.get('domain', '')).strip().lower()

    if not domain:
        return Response({'error': '삭제할 도메인을 지정해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

    deleted_any = False

    # 1. DB에 등록된 예외 도메인이면 삭제
    try:
        item = WhiteListAddr.objects.get(domain=domain)
        item.delete()
        deleted_any = True
    except WhiteListAddr.DoesNotExist:
        pass

    # 2. 만약 메모리 기본 화이트리스트에 들어있는 도메인이면 세트에서도 제거
    if domain in DEFAULT_STATIC_WHITELIST:
        DEFAULT_STATIC_WHITELIST.remove(domain)
        deleted_any = True

    if deleted_any:
        sync_pcap_json_files()  # 삭제 후 PCAP 엔진/JSON 동기화
        return Response({'status': 'success', 'message': f"'{domain}' 예외 설정이 삭제되었습니다."})
    else:
        return Response({'error': '해당 도메인을 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)


# 4. 차단 정책 추가 (화이트리스트 DB 실시간 검증)
@api_view(['POST'])
def add_policy(request):
    domain = str(request.data.get('no_access_domain', '')).strip().lower()
    if not domain:
        return Response({"error": "차단할 도메인 주소를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

    # 1) 화이트리스트(DB + 기본)에 존재하는지 실시간 검사
    db_whitelist = set(WhiteListAddr.objects.values_list('domain', flat=True))
    all_whitelist = DEFAULT_STATIC_WHITELIST.union(db_whitelist)

    for allowed in all_whitelist:
        if domain == allowed or domain.endswith('.' + allowed):
            return Response(
                {"error": f"'{domain}'은(는) 차단 예외(화이트리스트)로 등록된 도메인이므로 차단할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

    try:
        policy = NoAccessAddr.objects.filter(no_access_domain=domain).first()

        # 이미 활성화 상태인 경우
        if policy and policy.deleted_at is None:
            return Response(
                {"error": f"'{domain}'은(는) 이미 등록되어 있는 차단 도메인입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Soft Delete된 기록 재활성화
        if policy and policy.deleted_at is not None:
            policy.deleted_at = None
            policy.save()
            sync_pcap_json_files()
            return Response({
                "status": "success",
                "message": f"'{domain}' 차단 정책이 다시 활성화되었습니다."
            }, status=status.HTTP_200_OK)

        # 신규 생성
        NoAccessAddr.objects.create(no_access_domain=domain)
        sync_pcap_json_files()
        return Response({
            "status": "success",
            "message": f"'{domain}' 차단 도메인이 성공적으로 등록되었습니다."
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# 4-1. 차단 정책 삭제 (Soft Delete 처리)
@api_view(['POST'])
def delete_policy(request):
    domain = request.data.get('no_access_domain')
    try:
        policy = NoAccessAddr.objects.get(no_access_domain=domain, deleted_at__isnull=True)
        policy.deleted_at = timezone.now().date()
        policy.save()

        sync_pcap_json_files()
        return Response({"status": "success", "message": "차단 정책이 임시 삭제되었습니다."})
    except NoAccessAddr.DoesNotExist:
        return Response({"status": "error", "message": "해당 정책을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)


# 5. 위협 로그 수집
@api_view(['POST'])
def report_violation(request):
    source_ip = request.data.get('source_ip') or request.data.get('src_ip')
    blocked_domain = request.data.get('blocked_domain', '').strip()
    violator = request.data.get('violator')

    try:
        policy, _ = NoAccessAddr.objects.get_or_create(no_access_domain=blocked_domain)

        employee = None
        if source_ip:
            online_log = OnlineIpLog.objects.filter(online_ip=source_ip).order_by('-login_time').first()
            if online_log:
                employee = online_log.employee

        if not employee and violator:
            employee = Employees.objects.filter(employee_id=str(violator)).first()

        if not employee:
            employee = Employees.objects.first()

        NoAccessAddrLog.objects.create(
            employee=employee,
            no_access_domain=policy,
            access_time=timezone.now()
        )

        cache.delete('dashboard_threat_logs')
        return Response({"status": "success"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 로그아웃 API
@api_view(['POST'])
def logout_user(request):
    emp_id = request.data.get('employee_id')
    log = OnlineIpLog.objects.filter(employee__employee_id=emp_id, logout_time__isnull=True).order_by(
        '-login_time').first()
    if log:
        log.logout_time = timezone.now()
        log.save()
    return Response({"status": "success", "message": "로그아웃 처리되었습니다."})


# 6. 대시보드 - 최근 접속자 목록
@api_view(['GET'])
def get_online_users(request):
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


# 6-1. 대시보드 - 외부 인터넷 접속 승인 목록
@api_view(['GET'])
def get_external_access_logs(request):
    logs = OnlineIpLog.objects.select_related('employee').exclude(online_ip__startswith='192.168.1.').order_by(
        '-login_time')
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


# 7. 대시보드 - 위협 탐지 로그
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


# 8. 사원 목록 조회
@api_view(['GET'])
def get_employees(request):
    employees = Employees.objects.filter(deleted_at__isnull=True).values(
        'employee_id', 'employee_number', 'hire_date', 'name',
        'phone_number', 'email', 'jumin_no', 'address'
    )

    data = []
    for emp in employees:
        current_ym = emp['hire_date'].strftime('%Y%m') if emp['hire_date'] else datetime.datetime.now().strftime('%Y%m')
        emp_code = f"ST{current_ym}{emp['employee_number']:02d}"

        masked_jumin = "[RRN Omitted]"

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


# 9. 사원 정보 수정
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


# 9-1. 사원 퇴사/임시 삭제
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
            'type_label': '사원 지원' if p.is_employee_applicant else '일반 회원',
            'date_of_request': p.date_of_request.strftime('%Y-%m-%d') if p.date_of_request else '-',
        }
        for p in pending
    ]
    return Response(data)


# 11. 가입 승인
@api_view(['POST'])
def approve_member(request):
    member_id = request.data.get('member_id')
    approval_role = request.data.get('role', 'employee')

    try:
        pending_user = ProspectiveMembers.objects.get(member_id=member_id)

        if approval_role == 'employee':
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
            msg = f'일반 회원 승인 완료!\n{emp.name} 님의 계정이 정상 활성화되었습니다.'

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
    logs = OnlineIpLog.objects.select_related('employee').order_by('-login_time')
    seen_ips = set()
    status_list = []

    for log in logs:
        if log.online_ip not in seen_ips:
            seen_ips.add(log.online_ip)
            is_active = (log.logout_time is None)
            external_approved = True

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
        masked_jumin = "[RRN Omitted]"

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
    emp_id = request.query_params.get('employee_id') or request.data.get('employee_id')
    try:
        emp = Employees.objects.get(employee_id=emp_id, deleted_at__isnull=True)
    except Employees.DoesNotExist:
        return Response(
            {'status': 'error', 'message': '사용자를 찾을 수 없습니다.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
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

        new_pw = data.get('new_password')
        if new_pw and len(new_pw.strip()) > 0:
            emp.password = make_password(new_pw.strip())

        emp.save()
        return Response({'status': 'success', 'message': '개인정보가 성공적으로 수정되었습니다.'})


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


# 15. 보안 테스트실 - 모의 패킷 접속 및 차단 인젝션 시뮬레이션 API
@api_view(['POST'])
def simulate_network_access(request):
    raw_target = str(request.data.get('target', '')).strip().lower()
    if not raw_target:
        return Response({'error': '검증할 대상 도메인을 입력해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

    clean_domain = re.sub(r'^(?:https?:\/\/)?(?:www\.)?', '', raw_target).split('/')[0].split(':')[0]
    client_ip = get_client_ip(request)

    # 1. 화이트리스트 검사 (최우선 허용)
    db_whitelist = set(WhiteListAddr.objects.values_list('domain', flat=True))
    all_whitelist = DEFAULT_STATIC_WHITELIST.union(db_whitelist)
    for allowed in all_whitelist:
        if clean_domain == allowed or clean_domain.endswith('.' + allowed):
            return Response({
                'status': 'ALLOWED',
                'domain': clean_domain,
                'is_whitelist': True,
                'message': f"'{clean_domain}'은(는) 사내망 필수 예외(화이트리스트)로 등록되어 정상 통신이 허용됩니다."
            })

    # 2. 차단 도메인 검사 (NoAccessAddr)
    is_blocked = NoAccessAddr.objects.filter(no_access_domain=clean_domain, deleted_at__isnull=True).exists()

    if is_blocked:
        # 위협 로그(NoAccessAddrLog)에 자동 적재하여 대시보드에 즉시 노출
        policy = NoAccessAddr.objects.get(no_access_domain=clean_domain, deleted_at__isnull=True)
        employee = Employees.objects.filter(deleted_at__isnull=True).first()

        NoAccessAddrLog.objects.create(
            employee=employee,
            no_access_domain=policy,
            access_time=timezone.now()
        )
        cache.delete('dashboard_threat_logs')

        return Response({
            'status': 'BLOCKED',
            'domain': clean_domain,
            'injection_action': 'TCP RST Packet Injected & HTTP 302 Captive Portal Redirected',
            'message': f"경고: '{clean_domain}'은(는) 유해/차단 정책 대상입니다. RST 패킷 주입 및 격리 포털로 리다이렉트되었습니다."
        })

    return Response({
        'status': 'ALLOWED',
        'domain': clean_domain,
        'message': f"'{clean_domain}'은(는) 차단 목록에 등록되지 않은 정상 도메인입니다. 외부 통신이 허용됩니다."
    })


@api_view(['POST'])
def test_network_isolation(request):
    mock_ip = request.data.get('mock_ip', '').strip()
    emp_id = request.data.get('employee_id', '').strip()

    if not mock_ip:
        return Response({'error': '검증할 가상 IP를 입력해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

    employee = Employees.objects.filter(employee_id=emp_id, deleted_at__isnull=True).first()
    if not employee:
        # 사번 미입력 시 임의의 최고관리자 계정으로 검증
        employee = Employees.objects.filter(is_manager=True, deleted_at__isnull=True).first()

    ALLOWED_ADMIN_PREFIX = os.getenv('ADMIN_ALLOWED_IP_PREFIX', '192.168.3.')
    ALLOWED_ADMIN_IPS = {'127.0.0.1', 'localhost', '::1', '192.168.3.50'}

    is_allowed = (mock_ip in ALLOWED_ADMIN_IPS or mock_ip.startswith(ALLOWED_ADMIN_PREFIX))

    if is_allowed:
        return Response({
            'status': 'ALLOWED',
            'client_ip': mock_ip,
            'user': f"{employee.name} (관리자)",
            'message': f"[접근 승인] 사내 전용 보안망({ALLOWED_ADMIN_PREFIX}x) 대역으로 확인되어 관리 콘솔 접속이 허용됩니다."
        })
    else:
        return Response({
            'status': 'DENIED',
            'client_ip': mock_ip,
            'user': f"{employee.name} (관리자)",
            'message': f"[접근 거부 - 403 Forbidden] 외부망/비인가 대역({mock_ip})에서의 관리자 권한 접근이 물리적 망분리 정책에 의해 원천 차단되었습니다."
        })
