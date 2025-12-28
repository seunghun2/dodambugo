# 🌸 도담부고

품격있는 무료 모바일 부고장 서비스

## 📋 프로젝트 소개

도담부고는 3분 만에 세련되고 정중한 부고장을 만들 수 있는 무료 웹 서비스입니다.

### 주요 기능

- 🎨 **4가지 템플릿** - 기본형, 검은리본, 검은띠, 국화
- ⚡ **빠른 제작** - 3분 만에 완성
- 💯 **완전 무료** - 작성, 수정, 공유 모두 무료
- 📱 **모바일 최적화** - 모든 기기에서 완벽한 표시
- 🔒 **광고 없음** - 깨끗한 부고장
- 🔗 **간편한 공유** - 카카오톡, 문자 등

## 🛠 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Google Fonts (Noto Sans KR, Noto Serif KR)
- Material Symbols Icons

### Backend & Database
- **Supabase**
  - PostgreSQL 데이터베이스
  - Storage (사진 업로드)
  - Real-time (방명록)

### 외부 API
- Daum 주소 API (주소 검색)
- Kakao Map API (지도 표시)
- Kakao SDK (카카오톡 공유)

## 📁 프로젝트 구조

```
dodam/
├── index.html          # 메인 페이지
├── create.html         # 부고장 생성
├── view.html           # 부고장 조회
├── search.html        # 부고 검색
├── css/               # 스타일시트
├── js/                # JavaScript 파일
│   ├── supabase-config.js  # Supabase 설정
│   ├── main.js
│   ├── create-detailed.js
│   └── view-new.js
├── images/            # 이미지 파일
└── templates/         # 부고장 템플릿
```

## 🚀 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone [저장소 URL]
cd dodam
```

### 2. 로컬 서버 실행

```bash
# Python 3 사용
python3 -m http.server 8000

# 또는 Node.js의 http-server 사용
npx http-server -p 8000
```

### 3. 브라우저에서 접속

```
http://localhost:8000
```

## 🔑 환경 설정

`js/supabase-config.js` 파일에서 Supabase 프로젝트 정보를 확인할 수 있습니다.

## 📊 데이터베이스 스키마

### bugo (부고 정보)
- 고인 정보, 상주 정보, 장례식장 정보, 일정 등

### guestbook (방명록)
- 부고 ID, 작성자, 조문 메시지 등

### drafts (임시저장)
- 작성 중인 부고장 임시 저장

## 🤝 기여하기

이 프로젝트는 개선 제안 및 버그 리포트를 환영합니다!

## 📝 라이선스

Copyright © 2024 도담부고. All rights reserved.

## 📞 문의

- 웹사이트: [도담부고 홈페이지]
- 이메일: [문의 이메일]
