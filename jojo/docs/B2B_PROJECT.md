# jojo — 마음부고 B2B 파트너 앱

> 최종 업데이트: 2026-06-16

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **목적** | 장례지도사·상조회사 등 파트너가 부고장을 대신 만들고 건당 수당을 받는 B2B 전용 모바일 웹앱 |
| **위치** | `/Users/seunghun/Desktop/dodam/jojo` (마음부고 dodam-next와 같은 레포, 별도 git) |
| **프레임워크** | Next.js 15 (App Router) — 마음부고 B2C와 동일 프로젝트 내 `/app/b2b/` 경로 |
| **배포** | `main` 브랜치 → Vercel (Daedaesonson 프로젝트) |
| **DB** | Supabase (마음부고와 동일 인스턴스) |

> **주의**: 마음부고 B2C 서비스(`/app/view/`, `/app/create/` 등)에 **절대 영향 없도록** `/app/b2b/` 및 `/components/b2b/` 내에서만 작업한다.

---

## 파일 구조

### 페이지 (app/b2b/)

| 파일 | 경로 | 설명 |
|------|------|------|
| `page.tsx` | `/b2b` | B2B 진입점 (로그인으로 리다이렉트) |
| `login/page.tsx` | `/b2b/login` | 로그인 (휴대폰 + 비밀번호) |
| `signup/page.tsx` | `/b2b/signup` | 회원가입 |
| `signup/complete/page.tsx` | `/b2b/signup/complete` | 가입 완료 |
| `dashboard/page.tsx` | `/b2b/dashboard` | 대시보드 (홈) |
| `wallet/page.tsx` | `/b2b/wallet` | 정산/월렛 |
| `settings/page.tsx` | `/b2b/settings` | 설정 |

### CSS 모듈 (각 페이지별)

- `dashboard/dashboard.module.css` — 526줄, 가장 큰 CSS
- `login/login.module.css`
- `signup/signup.module.css`
- `wallet/wallet.module.css`
- `settings/settings.module.css`

### 공통 컴포넌트 (components/b2b/)

| 파일 | 설명 |
|------|------|
| `BottomTabBar.tsx` | 하단 탭바 (홈, 부고관리, 정산, 설정) |
| `BottomTabBar.module.css` | |
| `common.module.css` | B2B 전용 폰트 규격 (자간/행간) |

### API (app/api/b2b/)

| 파일 | 엔드포인트 | 설명 |
|------|-----------|------|
| `login/route.ts` | `POST /api/b2b/login` | 파트너 로그인 |
| `signup/route.ts` | `POST /api/b2b/signup` | 파트너 회원가입 |
| `me/route.ts` | `GET /api/b2b/me` | 내 정보 조회 |
| `wallet/route.ts` | `GET /api/b2b/wallet` | 정산 정보 조회 |
| `check-referral/route.ts` | `GET /api/b2b/check-referral` | 추천코드 유효성 검사 |

### 기타

- `b2b-preview.html` — 브라우저에서 바로 열어볼 수 있는 정적 미리보기

---

## 디자인 원칙

| 항목 | 규칙 |
|------|------|
| **이모지** | 전면 금지 — Tabler Icons만 사용 |
| **다크모드** | 없음 |
| **모서리** | 버튼/인풋 `8px`, 카드 `12px` |
| **자간** | `-0.02em` |
| **행간** | `1.5` |
| **색상** | 마음부고 globals.css 변수 공유 (`--gray-900`, `--accent` 등) |
| **폰트** | Pretendard (B2C와 동일) |
| **벤치마크** | 부고드림 파트너 앱, 토스 파트너 |

---

## 현재 완료된 작업

- [x] 페이지 구조 (로그인, 가입, 대시보드, 정산, 설정)
- [x] API 구조 (로그인, 가입, 내정보, 정산, 추천코드)
- [x] 바텀 탭바 공통 컴포넌트
- [x] CSS 변수 통일 (`--b2b-*` 폐기 → globals.css 변수 직접 사용)
- [x] 대시보드 리뉴얼 (부고드림 벤치마크: 프로필, 실적카드, 6구 퀵메뉴, 공지탭)

---

## 현재 문제점 (UI/UX)

1. **데이터 전부 하드코딩** — `상품 판매 0건`, `부고장 제작 29건` 등 전부 목업 데이터
2. **AI 템플릿 느낌** — 색상/레이아웃이 일반적이고 프리미엄하지 않음
3. **인터랙션 부재** — 애니메이션, 로딩 상태, 스켈레톤 UI 없음
4. **실제 플로우 미완성** — 로그인 후 부고 생성이 B2C 폼으로 바로 연결됨 (파트너 전용 플로우 없음)
5. **반응형 미검증** — 실기기 테스트 미완료

---

## TODO (우선순위순)

### Phase 1: UI/UX 리디자인 (가장 급함)
- [ ] 레퍼런스 확정 (부고드림, 토스 파트너, 배민 사장님 등)
- [ ] 로그인/가입 화면 리디자인
- [ ] 대시보드 리디자인 (프리미엄 느낌)
- [ ] 정산/월렛 화면 리디자인
- [ ] 설정 화면 리디자인
- [ ] 마이크로 애니메이션 추가 (framer-motion 또는 CSS)
- [ ] 스켈레톤 로딩 UI

### Phase 2: 백엔드 연동
- [ ] Supabase 파트너 테이블 설계 (`b2b_partners`, `b2b_transactions`)
- [ ] 로그인/가입 API 실제 동작 확인
- [ ] 파트너별 부고 목록 조회
- [ ] 수당/정산 로직 구현
- [ ] 출금 신청 기능

### Phase 3: 파트너 전용 기능
- [ ] 파트너 전용 부고 생성 플로우 (파트너 코드 자동 연결)
- [ ] 파트너가 만든 부고 관리 페이지
- [ ] 푸시 알림 (화환 판매, 정산 완료 등)
- [ ] 답례 인사 기능

### Phase 4: 운영
- [ ] 파트너 어드민 페이지 (관리자용)
- [ ] 파트너 등급 시스템
- [ ] 통계/리포트

---

## 수익 구조

```
파트너가 부고장 생성 → 조문객이 화환/부의금 결제 → 수익 발생 → 파트너에게 수당 지급

건당 예상 수익:
├── 화환: 원가 6만 → 판매 11만 = 마진 5만원
├── 부의금: 8.6% 수수료 = ~2.6만원
└── 답례품: ~1만원
합계: ~8.5만원/건 (파트너 수당 차감 전)
```

---

## 로컬 개발

```bash
cd /Users/seunghun/Desktop/dodam/jojo
npm run dev
# → http://localhost:3000/b2b/login
```

---

*이 문서는 jojo B2B 프로젝트의 전체 현황 레퍼런스입니다.*
