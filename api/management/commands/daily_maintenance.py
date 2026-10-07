import os
import json
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import ProspectiveMembers, Employees, NoAccessAddr, NoAccessAddrLog, OnlineIpLog

class Command(BaseCommand):
    help = "매일 자정 실행: PCAP 접속 IP 초기화 및 만료 데이터(1달/5년) 자동 파기"

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.date()

        # 1. PCAP 인가 IP 파일 자정 초기화 (매일 자정 리셋)
        with open('online_ip.json', 'w', encoding='utf-8') as f:
            json.dump([], f, indent=4)
        self.stdout.write(self.style.SUCCESS("[1/4] online_ip.json 자정 초기화 완료"))

        # 2. 가입 대기자 30일(1달) 경과 건 자동 파기
        one_month_ago = today - timedelta(days=30)
        deleted_pending, _ = ProspectiveMembers.objects.filter(date_of_request__lte=one_month_ago).delete()
        self.stdout.write(self.style.SUCCESS(f"[2/4] 만료된 가입 대기자 {deleted_pending}건 파기 완료"))

        # 3. 5년 경과한 임시 삭제 사원 및 차단 정책 완전 파기
        five_years_ago = today - timedelta(days=5 * 365)
        del_emp, _ = Employees.objects.filter(deleted_at__lte=five_years_ago).delete()
        del_pol, _ = NoAccessAddr.objects.filter(deleted_at__lte=five_years_ago).delete()
        self.stdout.write(self.style.SUCCESS(f"[3/4] 5년 경과 삭제 데이터 정리 완료 (사원: {del_emp}, 정책: {del_pol})"))

        # 4. 5년 경과한 로그 데이터 완전 파기
        del_access_log, _ = NoAccessAddrLog.objects.filter(access_time__lte=now - timedelta(days=5 * 365)).delete()
        del_ip_log, _ = OnlineIpLog.objects.filter(login_time__lte=now - timedelta(days=5 * 365)).delete()
        self.stdout.write(self.style.SUCCESS(f"[4/4] 5년 경과 로그 정리 완료 (접근시도로그: {del_access_log}, 접속로그: {del_ip_log})"))