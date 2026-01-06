# 마음부고 개발 환경 가이드

> 이 문서는 마음부고 프로젝트를 처음 접하거나, 나중에 다시 개발할 때 참고하는 완전한 가이드입니다.

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 마음부고 |
| **서비스 URL** | https://maeumbugo.co.kr |
| **기능** | 무료 모바일 부고장 생성/공유 서비스 |
| **프레임워크** | Next.js 15 (App Router) |
| **데이터베이스** | Supabase (PostgreSQL) |
| **호스팅** | Vercel |
| **도메인** | 가비아 (maeumbugo.co.kr) |

---

## 🗄️ 개발/프로덕션 DB 분리

### 왜 분리했나?

- **실수 방지**: 로컬에서 테스트 데이터 넣다가 실제 고객 데이터 삭제하는 일 방지
- **안전한 테스트**: 마음껏 테스트 데이터 생성/삭제 가능
- **다음주 오픈 대비**: 실제 서비스 시작 전에 DB 분리 완료

### 현재 구조

```
┌─────────────────────┐     ┌──────────────────────────┐
│  로컬 (localhost)   │ ──▶ │  maeumbugo-dev (개발 DB)  │
│  npm run dev        │     │  테스트 데이터, 마음껏 삭제 OK │
└─────────────────────┘     └──────────────────────────┘

┌─────────────────────┐     ┌──────────────────────────┐
│  Production         │ ──▶ │  dodambugo (프로덕션 DB)  │
│  maeumbugo.co.kr    │     │  실제 고객 데이터, 조심!     │
└─────────────────────┘     └──────────────────────────┘
```

### Supabase 프로젝트 정보

| 환경 | 프로젝트명 | URL | Region |
|------|-----------|-----|--------|
| **개발** | maeumbugo-dev | `https://mnlyqhrjnpbkleenmszm.supabase.co` | Seoul (ap-northeast-2) |
| **프로덕션** | dodambugo | `https://tbteghoppechzotdojna.supabase.co` | (기존) |

### Supabase 대시보드 접속

- **개발 DB**: https://supabase.com/dashboard/project/mnlyqhrjnpbkleenmszm
- **프로덕션 DB**: https://supabase.com/dashboard/project/tbteghoppechzotdojna

---

## 🔐 환경 변수 설정

### 로컬 개발 환경 (.env.local)

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# 개발용 Supabase (로컬에서만 사용)
NEXT_PUBLIC_SUPABASE_URL=https://mnlyqhrjnpbkleenmszm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHlxaHJqbnBia2xlZW5tc3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjgwMzMsImV4cCI6MjA4MzI0NDAzM30.pHsL9NIfHo_05euTkIiZOX0K4NuLqCBDFZK5mA_H4WY

# Naver Map
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=9ynkl22koz

# Google Analytics
NEXT_PUBLIC_GA_ID=G-6H5TT2F5RB
```

### Production 환경 (Vercel)

Vercel 대시보드에서 환경변수 설정됨:
- **NEXT_PUBLIC_SUPABASE_URL**: `https://tbteghoppechzotdojna.supabase.co`
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: (프로덕션 키)

### ⚠️ 주의사항

- `.env.local`은 **gitignore**에 포함되어 있어서 GitHub에 안 올라감
- 처음 clone하면 `.env.local` 파일을 직접 만들어야 함
- **프로덕션 키는 절대 .env.local에 넣지 않기!**

---

## 🛠️ 개발 시작하기

### 1. 처음 셋업

```bash
# 저장소 clone
git clone https://github.com/seunghun2/dodambugo.git
cd dodambugo/dodam-next

# 의존성 설치
npm install

# .env.local 파일 생성 (위 내용 복사)

# 개발 서버 시작
npm run dev
```

### 2. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

### 3. 개발 서버와 Production은 다른 DB!

- localhost:3000 → 개발 DB (테스트 데이터)
- maeumbugo.co.kr → 프로덕션 DB (실제 데이터)

---

## 📊 데이터베이스 구조

### 테이블 목록

| 테이블명 | 용도 | 주요 컬럼 |
|---------|------|----------|
| **bugo** | 부고장 | deceased_name, mourner_name, funeral_home, funeral_date |
| **drafts** | 임시저장 | bugo와 동일 구조 |
| **facilities** | 장례식장 정보 | name, address, phone |
| **guestbook** | 방명록 | bugo_id, name, message |
| **inquiries** | 문의 | name, phone, message |

### bugo 테이블 주요 컬럼

```sql
id              UUID (PK)
bugo_number     TEXT       -- 부고번호 (4자리, 예: 1234)
deceased_name   TEXT       -- 고인명
gender          TEXT       -- 성별 (male/female)
age             INTEGER    -- 향년
death_date      TEXT       -- 별세일
funeral_date    TEXT       -- 발인일
funeral_time    TEXT       -- 발인시간
funeral_type    TEXT       -- 장례유형 (일반 장례/가족장/무빈소장례)
funeral_home    TEXT       -- 장례식장 + 호실
room_number     TEXT       -- 호실
address         TEXT       -- 주소
mourner_name    TEXT       -- 대표 상주명
mourners        JSONB      -- 상주 목록 배열
account_info    JSONB      -- 계좌 정보 배열
created_at      TIMESTAMP
```

---

## 🧪 테스트 데이터

### 테스트 데이터 생성 스크립트

```bash
# 개발 DB에 테스트 데이터 30개 생성
node scripts/seed-dev-data.js
```

### 스크립트 위치

- `scripts/seed-dev-data.js` - 개발 DB용 테스트 데이터 생성
- `scripts/reset-test-data.js` - 프로덕션 DB 테스트 데이터 (사용 주의!)

### 테스트 데이터 특징

- 30개 부고 생성
- 일반 장례 70%, 가족장 20%, 무빈소 10%
- 상주 1~10명 (평균 5~6명)
- 전화번호 있는 상주 약 20%
- 계좌 있는 부고 약 30%
- 실제 장례식장명, 실제 주소 형식

---

## 🚀 배포

### 자동 배포 (현재 설정)

```bash
git add .
git commit -m "메시지"
git push
```

- `nextjs` 브랜치에 push → 자동으로 Vercel Production 배포
- Preview 배포 → Production 수동 promote 불필요

### Vercel 대시보드

https://vercel.com/seunghun2s-projects/dodam-next

### GitHub 저장소

https://github.com/seunghun2/dodambugo

---

## 🔗 외부 서비스 연동

### Supabase

- **용도**: 데이터베이스 (PostgreSQL)
- **대시보드**: https://supabase.com/dashboard
- **계정**: seunghun2
- **조직**: dodambugo

### Vercel

- **용도**: 호스팅, 자동 배포
- **프로젝트**: dodam-next
- **Production 브랜치**: nextjs

### 카카오 개발자

- **용도**: 카카오톡 공유
- **앱 이름**: 마음부고
- **앱 ID**: 1364022
- **JS Key**: 5aa868e69d68e913ed9da7c3def45151

### 네이버 클라우드

- **용도**: 네이버 지도
- **Client ID**: 9ynkl22koz

### Google Analytics

- **용도**: 방문자 분석
- **Measurement ID**: G-6H5TT2F5RB

### 도메인 (가비아)

- **도메인**: maeumbugo.co.kr
- **DNS 설정**: Vercel로 연결됨

---

## 📁 프로젝트 구조

```
dodam-next/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 메인 페이지
│   ├── layout.tsx           # 루트 레이아웃 (GA, 메타태그)
│   ├── create/              # 부고 생성
│   │   ├── page.tsx         # 템플릿 선택
│   │   ├── [templateId]/    # 부고 작성 폼
│   │   └── complete/        # 생성 완료
│   ├── view/[id]/           # 부고 조회 (공개 페이지)
│   ├── search/              # 부고 검색
│   ├── admin/               # 관리자 페이지
│   │   ├── bugo/            # 부고 관리
│   │   ├── facilities/      # 장례식장 관리
│   │   └── inquiries/       # 문의 관리
│   ├── api/                 # API 라우트
│   ├── faq/                 # FAQ 페이지
│   ├── contact/             # 문의하기
│   ├── terms/               # 이용약관
│   ├── privacy/             # 개인정보처리방침
│   ├── sitemap.ts           # 동적 사이트맵
│   └── robots.ts            # robots.txt
├── components/              # 공통 컴포넌트
│   ├── GoogleAnalytics.tsx  # GA 컴포넌트
│   ├── KakaoInit.tsx        # 카카오 SDK
│   ├── NaverMap.tsx         # 네이버 지도
│   └── MainLayout.tsx       # 메인 레이아웃
├── lib/                     # 유틸리티
│   └── supabase.ts          # Supabase 클라이언트
├── public/                  # 정적 파일
│   ├── css/                 # 스타일시트
│   ├── images/              # 이미지
│   ├── templates/           # 부고장 템플릿 HTML
│   ├── llms.txt             # AI 검색 최적화
│   └── llms-full.txt        # AI 검색 상세 문서
├── scripts/                 # 유틸리티 스크립트
│   ├── seed-dev-data.js     # 개발 DB 테스트 데이터
│   └── reset-test-data.js   # 프로덕션 테스트 데이터
├── docs/                    # 문서
│   ├── TODO.md              # 할 일 목록
│   ├── CHANGELOG.md         # 변경 이력
│   ├── FEATURES.md          # 기능 목록
│   ├── DESIGN_SYSTEM.md     # 디자인 시스템
│   ├── API.md               # API 문서
│   ├── DEVELOPMENT.md       # 개발 가이드 (이 문서)
│   └── README.md            # 문서 목차
└── .env.local               # 환경변수 (gitignore됨)
```

---

## 🎨 디자인 시스템

- **브랜드 컬러**: #FFCC45 (노란색)
- **텍스트 컬러**: #191919 (검정)
- **배경 컬러**: #F9F9F9 (밝은 회색)
- **폰트**: Pretendard
- **자세한 내용**: `docs/DESIGN_SYSTEM.md` 참조

---

## 🔍 SEO 설정

### 검색엔진 등록

- ✅ 네이버 서치어드바이저
- ✅ 구글 서치콘솔

### AI 검색 최적화

- `public/llms.txt` - AI 크롤러용 요약
- `public/llms-full.txt` - 상세 문서
- Schema.org JSON-LD (메인 페이지)

### 사이트맵

- `app/sitemap.ts` - 동적 생성
- 모든 부고장 URL 자동 포함

---

## ❓ 자주 묻는 질문

### Q: 로컬에서 데이터 수정하면 Production에 영향 있나요?

**A: 없습니다!** 로컬은 개발 DB(maeumbugo-dev), Production은 프로덕션 DB(dodambugo)를 사용합니다.

### Q: .env.local 파일이 없어요

**A:** 처음 clone하면 없습니다. 이 문서의 "환경 변수 설정" 섹션을 참고해서 직접 만드세요.

### Q: 테스트 데이터 어떻게 만드나요?

**A:** `node scripts/seed-dev-data.js` 실행

### Q: Production DB 직접 수정해도 되나요?

**A:** 가능하지만 **매우 조심**하세요. Supabase 대시보드에서 가능합니다.

### Q: 배포는 어떻게 하나요?

**A:** `git push`만 하면 자동 배포됩니다 (nextjs 브랜치).

---

*마지막 업데이트: 2026-01-06*
