import os
from pathlib import Path
from dotenv import load_dotenv
import pymysql

# PyMySQL을 MySQL 드라이버로 사용하도록 설정
pymysql.install_as_MySQLdb()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# 💡 [서버 배포 및 로컬 테스트 공통]
# 프로젝트 루트 경로에 있는 .env 파일을 자동으로 읽어옵니다.
load_dotenv(os.path.join(BASE_DIR.parent, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-)rev%!mc71tjj#g1bvhdmc(k2ksz!)*!jp@p4)*r%(dcm=-gs_'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'api',
    'rest_framework',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# =====================================================================
# 💡 [데이터베이스 설정] 로컬 테스트 및 서버 배포 자동 분기
# - 개인 PC 로컬 테스트 시: .env에 USE_MYSQL 설정이 없으면 sqlite3로 안전하게 구동
# - 서버(Rocky Linux) 배포 시: .env에 USE_MYSQL=True 추가 시 원격 MySQL로 자동 연결
# =====================================================================
USE_MYSQL = os.getenv('USE_MYSQL', 'False').lower() in ('true', '1', 't')

if USE_MYSQL:
    # 💡 [서버 배포 시 적용]
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'internal_db'),
            'USER': os.getenv('DB_USER', 'ubuntu'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'ubuntu'),
            'HOST': os.getenv('DB_HOST', '192.168.4.15'),
            'PORT': os.getenv('DB_PORT', '3306'),
        }
    }
else:
    # 💡 [개인 PC 로컬 테스트 시 적용 - DB 서버 통신 불가 시에도 타임아웃 없이 즉시 구동]
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = 'ko-kr'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_TZ = False

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = 'static/'

# CORS 설정 (React 프론트엔드와 통신 허용)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    f"http://{os.getenv('WEB_HOST', '192.168.1.23')}",  # 💡 실서버 웹 주소 동적 반영
]

# 💡 최적화: 대시보드 API에서 사용할 메모리 캐시 설정
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'securetech-dashboard-cache',
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
