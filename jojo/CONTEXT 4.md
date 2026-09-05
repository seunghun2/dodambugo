# B2B 마음부고 파트너 앱 프로젝트 컨텍스트

> 이 파일은 AI 어시스턴트가 프로젝트 맥락을 빠르게 파악하기 위한 문서입니다.
> 마지막 업데이트: 2026-07-10

---

## 👤 사용자 정보

- **역할**: 1인 창업자 (개발+디자인+마케팅+영업+CS 전부 혼자)
- **배경**: 장례업계 본부장 출신 → 업계 이해도 매우 높음
- **기술 수준**: 비개발자. AI를 활용하여 프로덕트 직접 빌드
- **작업 스타일**: 실행 먼저, 계획 나중. 직설적, 판단 빠름
- **사업자**: 대표 김미연 (408-22-68851), 통신판매업 2026-서울강남-00502

---

## 🏗️ 프로젝트 개요

- **서비스명**: 마음부고 B2B 파트너 앱
- **기반 서비스**: 마음부고 (maeumbugo.co.kr) — B2C 무료 모바일 부고장 + 화환 주문
- **이 앱의 목적**: 장례식장/상조회사/장례지도사가 가입하여 부고장을 만들고, 화환 판매 시 수익(예치금)을 받는 B2B 파트너 플랫폼
- **앱 형태**: 웹앱 + Capacitor 웹뷰 래핑 → Play Store / App Store 등록
- **코드 위치**: `/dodam/jojo` (기존 dodam-next에서 복사한 독립 프로젝트)
- **벤치마킹**: 바로부고(추천인 수당), 예지파트너스(건당 2만원 확정 수익)
- **앱스토어 상태**: 양쪽 심사 재제출 완료 (2026-07-10), 승인 대기 중

### ⚠️ 절대 규칙
- **마음부고(dodam-next)는 라이브 운영 중 — 절대 건드리지 않는다**
- B2B 전용 코드는 `/app/b2b/`, `/app/api/b2b/` 경로에만 작성
- 기존 마음부고 화면/API는 수정하지 않고 읽기만 한다

---

## 🛠️ 기술 스택

- **프레임워크**: Next.js 16.1.1 (App Router)
- **UI 라이브러리**: Mantine v8 (@mantine/core, form, modals, notifications, dates)
- **아이콘**: @tabler/icons-react v3 (이모지 사용 금지)
- **배포**: Vercel
- **DB**: Supabase (기존 마음부고와 동일 DB, B2B 테이블 추가 완료)
- **결제**: INNOPAY
- **알림**: 솔라피 (카카오 알림톡 + SMS)
- **앱 패키징**: Capacitor 8.4.1 (웹뷰 래핑)
- **인증**: JWT + HTTP-only 쿠키 듀얼 인증 (localStorage + cookie fallback)
- **폰트**: Pretendard

---

## 🎨 디자인 시스템

### 컬러 (globals.css 변수 사용)
| 용도 | 변수 | 값 |
|------|------|-----|
| CTA 버튼 | `--primary` | `#FFD43B` (골드 옐로우) |
| 신뢰/카드 | `--accent` | `#364F6B` (네이비) |
| 텍스트 | `--gray-900` | `#2C3E50` |
| 배경 | `--bg-gray` | `#F8F9FA` |
| 성공 | `--success` | `#27AE60` |
| 오류 | `--error` | `#E74C3C` |

### 문구 톤앤매너
- 정중한 존댓말: "~해 주세요", "~됩니다"
- 이모지 사용 금지
- CTA는 간결하게: "로그인", "가입하기", "다음"
- 업계 용어: 고인, 상주, 빈소, 발인, 근조화환, 조문객

### 아이콘 규칙
- Tabler Icons만 사용 (이모지, 텍스트 아이콘 금지)
- stroke={1.5} 기본, active 상태는 stroke={2}
- 색상: active=`--accent`, inactive=`--gray-400`

---

## 📁 B2B 전용 구조 (현재)

```
app/
├── b2b/
│   ├── page.tsx        ✅ 스플래시 화면 (0.8초 후 자동 이동)
│   ├── home.module.css
│   ├── login/          ✅ 로그인
│   ├── signup/         ✅ 회원가입 5단계
│   │   └── complete/   ✅ 가입 완료
│   ├── dashboard/      ✅ 대시보드
│   ├── wallet/         ✅ 정산/예치금
│   ├── settings/       ✅ 설정/마이페이지 (파트너정보, 계좌, 고객센터, 로그아웃)
│   └── admin/          ✅ 관리자 페이지 (구현 완료)
├── api/b2b/
│   ├── signup/         ✅
│   ├── login/          ✅
│   ├── check-referral/ ✅
│   ├── me/             ✅
│   └── wallet/         ✅
components/
├── b2b/
│   ├── BottomTabBar.tsx     ✅ 공통 하단 탭바 (Tabler Icons)
│   └── common.module.css    ✅ 공통 폰트/레터스페이싱
```

---

## 💰 핵심 비즈니스 로직

### 화환 판매 → 예치금 적립 흐름 (구현 완료)
```
1. B2B 회원이 로그인 상태에서 부고 작성
2. 부고에 b2b_user_id가 자동 연결됨
3. 조문객이 해당 부고에서 화환 주문/결제
4. 결제 완료 시:
   a. 부고 작성자(B2B 회원)에게 예치금 적립 (금액: b2b_settings에서 조회)
   b. 추천인이 있으면 추천인에게도 보너스 적립
5. B2B 회원이 앱에서 출금 신청 → 관리자가 수동 처리
```

---

## 🗄️ B2B 전용 DB 테이블 (Supabase 생성 완료)

| 테이블 | 용도 |
|--------|------|
| `b2b_users` | B2B 회원 정보 |
| `b2b_settings` | 관리자 설정 (적립금, 수당, 최소 출금액) |
| `deposits` | 예치금 잔고 (회원별 1행) |
| `deposit_transactions` | 예치금 입출금 내역 |
| `withdrawal_requests` | 출금 신청 |

---

## 🔑 환경변수

### 기존 (마음부고 공유)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_INNOPAY_MID` (pgmaeum01m)
- `SOLAPI_API_KEY` / `SOLAPI_API_SECRET`

### B2B 전용
- `JWT_SECRET` — JWT 토큰 서명 키

---

## ✅ 다음에 할 것 (우선순위)

### 완료된 항목
- [x] 설정(마이페이지) 페이지 제작
- [x] Supabase에 B2B 테이블 실제 생성
- [x] 화환 결제 → 예치금 적립 연동 (핵심 BM)
- [x] B2B 관리자 페이지 (`/b2b/admin`)
- [x] Capacitor 앱 패키징 및 스토어 제출

### 남은 항목
1. 카카오 채널 / 푸시 알림 연동
2. B2B 다중 분할 정산
3. 문자 발송 브랜드 분리
