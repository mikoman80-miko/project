from django.urls import path

from . import views

urlpatterns = [
    # 인증 관련
    path('auth/signup/', views.apply_signup, name='apply_signup'),
    path('auth/apply/', views.apply_signup, name='apply_signup_alias'),
    path('auth/check-duplicate/', views.check_duplicate, name='check_duplicate'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/captive-login/', views.captive_login, name='captive_login'),

    # 마이페이지 및 사원 관리
    path('auth/my-info/', views.get_my_info, name='get_my_info'),
    path('employees/', views.get_employees, name='get_employees'),
    path('employees/update/', views.update_employee, name='update_employee'),
    path('employees/delete/', views.delete_employee, name='delete_employee'),
    path('auth/profile/', views.my_profile, name='my_profile'),

    # 가입 승인 관리
    path('approvals/pending/', views.get_pending_members, name='get_pending_members'),
    path('approvals/approve/', views.approve_member, name='approve_member'),
    path('approvals/reject/', views.reject_member, name='reject_member'),

    # 차단 정책 관리
    path('policies/blocklist/', views.get_blocklist, name='get_blocklist'),
    path('policies/add/', views.add_policy, name='add_policy'),
    path('policies/delete/', views.delete_policy, name='delete_policy'),

    # 💡 차단 예외(화이트리스트) 관리 API
    path('policies/whitelist/', views.get_whitelist, name='get_whitelist'),
    path('policies/whitelist/add/', views.add_whitelist, name='add_whitelist'),
    path('policies/whitelist/delete/', views.delete_whitelist, name='delete_whitelist'),

    # 대시보드 및 관제 로그
    path('dashboard/online/', views.get_online_users, name='get_online_users'),
    path('dashboard/external/', views.get_external_access_logs, name='get_external_access_logs'),
    path('dashboard/threats/', views.get_threat_logs, name='get_threat_logs'),
    path('dashboard/threat-logs/', views.get_threat_logs, name='get_threat_logs_alias'),
    path('threats/report/', views.report_violation, name='report_violation'),
    path('dashboard/employee-auth-status/', views.get_employee_auth_status, name='dashboard_employee_auth_status'),
    path('network/simulate-access/', views.simulate_network_access, name='simulate_network_access'),
    path('network/test-isolation/', views.test_network_isolation, name='test_network_isolation'),
]
