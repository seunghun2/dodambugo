# 마음부고

> 품격있는 무료 모바일 부고장 서비스

**[https://maeumbugo.co.kr](https://maeumbugo.co.kr)**

---

## 프로젝트 소개

마음부고는 3분 만에 무료로 만드는 모바일 부고장 서비스입니다.

### 주요 특징
- ✅ **완전 무료** - 부고장 생성, 공유 모두 무료
- ✅ **광고 없음** - 품격을 위해 광고를 넣지 않습니다
- ✅ **4가지 템플릿** - 기본형, 정중형, 안내형, 국화 디자인
- ✅ **간편 공유** - 카카오톡, 문자, 링크로 바로 공유
- ✅ **회원가입 불필요** - 바로 작성 가능

---

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Maps**: 네이버 Maps API, 카카오 Maps API
- **Analytics**: Google Analytics 4

---

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

http://localhost:3000 에서 확인

---

## 배포

`nextjs` 브랜치에 push하면 자동으로 Vercel Production에 배포됩니다.

```bash
git add .
git commit -m "메시지"
git push
```

---

## 환경 변수

### 로컬 개발 환경 (`.env.local`)

```bash
# 개발용 Supabase (로컬용)
NEXT_PUBLIC_SUPABASE_URL=https://mnlyqhrjnpbkleenmszm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Naver Map
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=9ynkl22koz

# Google Analytics
NEXT_PUBLIC_GA_ID=G-6H5TT2F5RB
```

### Production (Vercel 환경변수)

```bash
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tbteghoppechzotdojna.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| 환경 | Supabase 프로젝트 |
|------|-------------------|
| 로컬 (localhost) | maeumbugo-dev |
| Production (maeumbugo.co.kr) | dodambugo |

---

## 문서

- [PROJECT_STRATEGY.md](./PROJECT_STRATEGY.md) - 프로젝트 전략
- [docs/TODO.md](./docs/TODO.md) - 할 일 목록
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) - 변경 이력
- [docs/FEATURES.md](./docs/FEATURES.md) - 기능 목록
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) - 디자인 시스템
- [docs/API.md](./docs/API.md) - API 문서

---

## 프로젝트 구조

```
dodam-next/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── create/            # 부고장 생성
│   ├── view/              # 부고장 조회
│   ├── search/            # 부고 검색
│   ├── admin/             # 관리자
│   └── api/               # API 라우트
├── components/            # 공통 컴포넌트
├── lib/                   # 유틸리티
├── public/                # 정적 파일
│   ├── css/              # 스타일시트
│   ├── images/           # 이미지
│   └── templates/        # 부고장 템플릿 HTML
└── docs/                  # 문서
```

---

*마지막 업데이트: 2026-01-06*
