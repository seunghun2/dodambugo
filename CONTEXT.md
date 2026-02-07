# 마음부고 프로젝트 컨텍스트

> 이 파일은 AI 어시스턴트가 프로젝트 맥락을 빠르게 파악하기 위한 문서입니다.
> 마지막 업데이트: 2026-02-07 16:16

---

## 👤 사용자 정보

- **역할**: 1인 창업자 (개발+디자인+마케팅+영업+CS 전부 혼자)
- **배경**: 장례업계 본부장 출신 → 업계 이해도 매우 높음
- **기술 수준**: 비개발자. AI(Cursor Ultra)를 활용하여 프로덕트 직접 빌드
- **작업 스타일**: 실행 먼저, 계획 나중. 하루 커밋 17회+, 8시~16시 작업
- **Cursor 요금제**: Ultra ($100/월 프로모션, 정가 $200)
- **성격**: 직설적, 판단 빠름. 불필요한 기능은 바로 거절. 비용 민감
- **사업자**: 대표 김미연 (408-22-68851), 통신판매업 2026-서울강남-00502

---

## 🏗️ 프로젝트 개요

- **서비스명**: 마음부고 (maeumbugo.co.kr)
- **서비스 설명**: 무료 모바일 부고장 제작 + 화환 주문 플랫폼
- **오픈일**: 2026-02-07 (오늘!)
- **수익 모델**: 화환 중개 (건당 마진 33,000~40,000원, 비과세)
- **경쟁사**: 부고닷컴, 모바일부고 등
- **차별점**: 업계 본부장 출신의 도메인 지식 + 빠른 실행력

---

## 🛠️ 기술 스택

- **프레임워크**: Next.js (App Router)
- **배포**: Vercel Pro ($20/월, 포함 크레딧 $20)
- **DB**: Supabase
- **결제**: INNOPAY (카드 2.6%, 간편결제 2.8%, 정산 D+5)
- **알림**: 솔라피 (카카오 알림톡 + SMS)
- **분석**: GA4 + Microsoft Clarity
- **광고**: Google Ads (CTR 12.41%, CVR 44.23%)
- **도메인**: maeumbugo.co.kr, dodambugo.com (리다이렉트)
- **Git**: GitHub (seunghun2/dodambugo, nextjs 브랜치)

---

## 📁 주요 디렉토리 구조

```
app/
├── page.tsx                    # 메인 홈
├── create/                     # 부고장 생성
├── view/[id]/                  # 부고장 열람
│   ├── flower/[productId]/     # 화환 상세
│   ├── order/[productId]/      # 화환 주문
│   ├── payment/[productId]/    # 결제 페이지
│   ├── payment/callback/       # 결제 콜백
│   ├── condolence/             # 부의금 카드결제
│   ├── thanks/                 # 감사장
│   └── gift/                   # 답례품
├── admin/                      # 관리자
│   ├── bugo/                   # 부고 관리
│   ├── flower-orders/          # 화환 주문 관리
│   ├── blocked-ips/            # IP 차단 관리
│   ├── drafts/                 # 임시저장 관리
│   └── facilities/             # 장례식장 관리
├── api/                        # API 라우트
│   ├── payment/innopay/        # INNOPAY 결제
│   ├── flower-orders/          # 화환 주문 CRUD
│   ├── bugo-notify/            # 알림톡 발송
│   ├── cron/reminders/         # 자동 리마인더
│   └── blocked-ips/            # IP 차단 API
└── order/[orderId]/            # 주문 확인 페이지
```

---

## 🔐 보안 시스템 (middleware.ts)

### 자동 차단 규칙
1. **부고 대량 열람**: 서로 다른 부고 5개+ 열람 → 자동 차단 + 슬랙 알림
2. **봇/크롤러 감지**: python, scrapy, curl, selenium 등 UA → 즉시 차단
3. **페이지 과다 탐색**: 정규화된 고유 페이지 10개+ → 자동 차단
   - 정규화: `/view/1169/flower/1`, `/view/1169/order/2` 모두 → `/view/1169`로 카운트
   - 정규화: `/create/basic`, `/create/complete/xxx` 모두 → `/create`로 카운트

### 화이트리스트
- 관리자 IP (14.38.63.241)
- Vercel 봇 (vercel, vercel-bot)
- 검색엔진 봇 (Googlebot, Bingbot, Yeti 등)

---

## 📊 GA4 이벤트 (components/GoogleAnalytics.tsx)

### 이벤트 네이밍 규칙: `카테고리_동작`
- 부고: 부고_생성시작, 부고_생성완료, 부고_조회
- 공유: 공유_부고
- 상호작용: 상호작용_지도클릭, 상호작용_전화클릭, 상호작용_주소복사
- 부의금: 부의금_모달열기, 부의금_계좌복사, 부의금_결제시작, 부의금_결제완료
- 화환: 화환_버튼클릭, 화환_상품선택, 화환_주문시작, 화환_결제시작, 화환_결제완료
- 감사장: 감사장_조회, 감사장_공유
- 페이지: 페이지_자주묻는질문, 페이지_메인CTA, 페이지_헤더CTA

### 맞춤 측정기준 (GA4 어드민 등록 완료)
- event_category (이벤트 범위)
- event_label (이벤트 범위)

---

## 💰 Vercel 빌드 비용 절감

### vercel.json ignoreCommand 설정 완료
- `[skip ci]` 커밋 메시지 → 빌드 스킵
- `.md`, `.txt` 등 비코드 파일만 변경 → 자동 스킵
- `.tsx`, `.ts`, `.css`, `.json` 변경 → 빌드 실행

---

## 📋 현재 상태 & 대기 중

### ✅ 완료
- 부고장 생성/편집/공유 전체 플로우
- 화환 주문/결제 (INNOPAY)
- 카카오 알림톡 연동 (생성/공유/주문완료)
- 관리자 페이지 (부고/주문/IP/임시저장)
- GA4 + Clarity 분석
- IP 차단 보안 시스템
- 404/500 에러 페이지
- sitemap.xml, robots.txt
- 임시저장 → DB + 리마인더 cron
- 공유 리마인더 cron

### ⏳ 대기 중 (외부)
- 솔라피 알림톡 템플릿 검수 (임시저장/공유 리마인더)
- INNOPAY 복합과세 가맹점 변경 (화환 비과세)
- 부의금 카드결제 PG 승인

### 📝 향후 과제
- 답례품 실제 판매 연결
- 블로그/SEO 콘텐츠
- 네이버 광고 세팅
- 2호 사이트 (대대손손 or 별도 브랜드)
- 화환 자동 발주 API (월 70~80만원, 수익 후 도입)

---

## 🔑 환경변수 (참고용, 실제 값은 Vercel에)

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_INNOPAY_MID` (pgmaeum01m)
- `GA_MEASUREMENT_ID`
- `GOOGLE_ADS_ID`
- `SLACK_WEBHOOK_URL`
- `SLACK_WEBHOOK_FLOWER`
- `SOLAPI_API_KEY` / `SOLAPI_API_SECRET`
- `SOLAPI_SENDER` (발신번호)

---

## ⚡ 작업 규칙

1. 커밋 메시지: `feat:`, `fix:`, `refactor:`, `docs:` 접두사 사용
2. 배포 불필요 시: `[skip ci]` 커밋 메시지에 추가 (자동으로도 판단됨)
3. 비용: Vercel $20/월 포함 크레딧 내에서 사용
4. GA4: 이벤트 이름은 반드시 `카테고리_동작` 형식
5. 보안: localhost에서는 GA/보안 비활성화
