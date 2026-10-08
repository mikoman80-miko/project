from django.db import models


# 1. 가입 대기자 테이블 (prospective_members)
class ProspectiveMembers(models.Model):
    member_id = models.CharField(max_length=50, primary_key=True)  # PK
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=11, unique=True)
    jumin_no = models.CharField(max_length=13, unique=True)
    is_employee_applicant = models.BooleanField(
        default=True
    )  # True: 사원 신청, False: 일반 회원
    date_of_request = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'prospective_members'


# 2. 정직원 테이블 (employees)
class Employees(models.Model):
    employee_number = models.AutoField(
        primary_key=True
    )  # PK (INT AUTO_INCREMENT)
    employee_id = models.CharField(
        max_length=50, unique=True
    )  # 사원 아이디 (member_id 복사)
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=11, unique=True)
    jumin_no = models.CharField(max_length=13, unique=True)
    hire_date = models.DateField(auto_now_add=True)
    is_manager = models.BooleanField(default=False)
    deleted_at = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'employees'


# 3. 차단 정책 테이블 (no_access_addr)
class NoAccessAddr(models.Model):
    no_access_domain = models.CharField(max_length=255, primary_key=True)  # PK
    deleted_at = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'no_access_addr'


# 4. 차단 로그 테이블 (no_access_addr_log)
class NoAccessAddrLog(models.Model):
    employee = models.ForeignKey(
        Employees, on_delete=models.CASCADE, db_column='employee_id'
    )
    no_access_domain = models.ForeignKey(
        NoAccessAddr, on_delete=models.CASCADE, db_column='no_access_domain'
    )
    access_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'no_access_addr_log'


# 5. 실시간 온라인 IP 로그 테이블 (online_ip_log)
class OnlineIpLog(models.Model):
    employee = models.ForeignKey(
        Employees, on_delete=models.CASCADE, db_column='employee_id'
    )
    online_ip = models.CharField(max_length=45, db_index=True)
    login_time = models.DateTimeField(auto_now_add=True, db_index=True)
    logout_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'online_ip_log'
        ordering = ['-login_time']


# 6. 차단 예외 화이트리스트 테이블 (whitelist_addr)
class WhiteListAddr(models.Model):
    domain = models.CharField(max_length=255, primary_key=True)  # PK (예외 도메인)
    description = models.CharField(max_length=255, blank=True, default='')  # 비고/용도
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'whitelist_addr'
