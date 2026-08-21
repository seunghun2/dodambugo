# 마음부고 변경 이력

## 2026-08-22

### 💳 부의금 카드결제 상주별 계좌 매핑 오류 수정 & mourners 안전 파싱
- **파일**: `app/view/[id]/ViewContent.tsx`, `app/b2b/view/[id]/ViewContent.tsx`, `app/view/[id]/condolence/page.tsx`, `app/b2b/view/[id]/condolence/page.tsx`
- 부의금 모달 카드결제 클릭 시 화면 순서(`i`) 대신 상주 고유 인덱스(`acc.mournerIndex`) 전달.
- 카드결제 화면에서 DB `bugo.mourners` JSON 문자열 안전 파싱 및 `?m=` 파라미터 기반 1:1 정확한 상주 계좌 선택 로직 통일.

### 🔇 부의금 결제 승인 시 지도사(파트너) 대상 불필요한 LMS 발송 로직 제거
- **파일**: `app/api/payment/innopay/approve/route.ts`
- 지도사는 부의금 수당 대상이 아니므로, 오해를 유발하던 파트너 대상 조의금 LMS 문자 발송 블록 완전 제거 (문자 비용 절감).

### 🔐 계좌 노출 설정 API 및 회원탈퇴 API 보안 가드 적용
- **파일**: `app/api/b2b/update-account-display/route.ts`, `app/api/b2b/withdraw/route.ts`, `app/b2b/create/complete/[bugoNumber]/page.tsx`
- `update-account-display`: JWT 인증 + 부고장 개설자 소유권(`b2b_user_id === userId`) 검증 가드 추가하여 외부 계좌 변조 원천 차단.
### 🔐 비밀번호 재설정 SMS 인증 토큰(JWT) 검증 가드 적용
- **파일**: `app/api/phone-verify/confirm/route.ts`, `app/b2b/login/forgot/page.tsx`, `app/api/b2b/reset-password/route.ts`
### 💸 출금 동시성(Race Condition) 이중 출금 방어 (선차감 후송금 보상 트랜잭션)
- **파일**: `app/api/b2b/wallet/route.ts`
- 출금 실행 시 DB 지갑 잔액을 원자적(`gte balance`)으로 선(先)차감 후 펌뱅킹 송금하도록 순서 재구성.
- 더블 클릭이나 동시 다중 요청 시 첫 번째 1건만 통과하고 나머지는 잔액 부족으로 즉시 차단.
- 은행 송금 실패 시 깎였던 잔액을 즉시 지갑으로 안전하게 자동 복구(환불)하는 보상 트랜잭션 구현.

### 🛡️ 결제 승인 중복 방지 (Idempotency Guard)
- **파일**: `app/api/payment/innopay/approve/route.ts`, `__tests__/security-wallet.test.ts`
- 화환 결제: `flower_orders.status === 'completed'` 확인 가드를 추가하여 새로고침/재시도 시 파트너 수당 및 추천 보너스 이중 적립 원천 차단.
- 부의금 결제: `condolence_orders`의 `moid` 중복 확인 가드를 추가하여 상조 정산 및 알림톡 중복 발송 차단.

### 💰 화환 결제 금액 할인가 반영 및 크론 송금액 보정
- **파일**: `app/view/[id]/payment/[productId]/PaymentContent.tsx`, `app/api/cron/auto-approve-withdrawals/route.ts`
- `PaymentContent`: 할인 상품 주문 시 정가 대신 `effectivePrice(orderData.productPrice || product.price)`를 결제 금액(`taxFreeAmt`)으로 전달하도록 보정.
- `auto-approve-withdrawals`: 송금 시 세전 금액 대신 실수령액(`req.net_amount || req.amount`)을 전달하도록 방어 코드 보강.

### 🔐 어드민 암호화 JWT 서명 검증 가드 일원화 (쿠키 조작 권한 우회 차단)
- **파일**: `lib/admin-auth.ts`, `app/api/admin-auth/route.ts`, `app/api/b2b/admin/**/route.ts` (17개 라우트)
- 단순 문자열 쿠키(`admin_ip=true`) 대신 서버 비밀키로 서명된 관리자 전용 JWT 발급 및 `verifyAdmin()` 일괄 검증 적용.
- 외부에서 `admin_ip=true` 쿠키를 수동 조작하여 관리자 API에 무단 접근하는 취약점 100% 원천 차단.

## 2026-08-21


### 🪦 B2B 부고장 제작 장지 정보 입력란(BurialSection) 복원 & 표기명 통일
- **파일**: `app/b2b/create/sections/BurialSection.tsx`, `app/b2b/create/page.tsx`, `app/b2b/manage/page.tsx`
- 부고장 제작 시 `상주정보`와 `기타옵션` 사이에 장지 정보 섹션 신규 작성 및 배치 (1차 장지 기본 노출 + `+ 2차 장지 추가/삭제` 지원).
- 미리보기 팝업 모달 및 부고 관리 상세 모달에서 `1차장지` ➡️ `장지`로 표기명 통일.

### 📱 상주별 알림톡 링크(?m=) 변수 연동 & 호칭 개인화
- **파일**: `app/api/b2b/send-mourner-notify/route.ts`, `app/api/bugo-notify/route.ts`, `app/b2b/view/[id]/ViewContent.tsx`
- 상주별 알림톡 발송 시 최신 B2B 알림톡 템플릿에 `m` 파라미터(상주 등록 순서 0, 1, 2...) 전달 연동 (버튼 클릭 시 `?m={m}`으로 자동 랜딩).
- 상주 이름 `trim()` 처리로 조사 띄어쓰기(`고둘리의 부친`, `백승훈의 장인`) 자연스럽게 보정.
- 카톡 알림톡 실발송 및 맞춤 호칭 변환 검증 완료.

## 2026-08-20

### 💰 B2B 수당 및 부의금 정산 분배 정책 확정 & 정산서 버그 수정
- **파일**: `lib/b2b-company.ts`, `app/api/b2b/admin/settings/route.ts`, `app/api/payment/innopay/approve/route.ts`, `app/api/b2b/admin/companies/settlements/route.ts`, `app/b2b/admin/companies/settlements/page.tsx`
- 부의금 수수료 8.6% 확정: PG+VAT 3.3% / 플랫폼 2.0% / 상조회사 3.3% / 지도사 0원.
- 정산서 API 부의금 이중 표시 버그, 정산 완료 상태 불일치 버그, CSV 다운로드 부의금 누락 버그 3건 수정 완료.

## 2026-08-09

### 🏢 B2B 상조회사 수수료율 & 수당 세팅 어드민 구축
- **파일**: `lib/b2b-company.ts`, `app/api/b2b/admin/companies/route.ts`, `app/b2b/admin/companies/page.tsx`
- 신규 상조회사 등록 및 수정 모달에 부의금 수수료율(%), 화환 판매 본사/팀원 수당(원), 답례품 본사/팀원 수당(원) 및 선택적 답례품 수수료율(%) 필드 추가 및 DB 저장 연동

### 📋 파트너 관리 내 상조회사 수수료 & 요율표 개요 카드 연동
- **파일**: `app/b2b/admin/partners/page.tsx`
- 파트너 상세 정보 모달 내 소속 상조회사의 수수료율 및 화환/답례품 수당 요율표 요약 카드 UI 연동

### 💰 조의금 주문 관리 어드민 상조 소속별 몫 조건부 분배
- **파일**: `app/api/b2b/admin/condolence-orders/route.ts`, `app/b2b/admin/condolence-orders/page.tsx`
- 부고장을 개설한 장례지도사가 상조회사 소속일 때만 상조 몫 수수료율(%) 적용 및 분배
- 상조 미소속(개인 파트너/일반 부고장)의 경우 상조 몫 0원(0%), 대표님(플랫폼) 몫 100% 수수료 전액 집계

### 📄 상조회사 월별 통합 정산서 출력 및 명세표 개편
- **파일**: `app/api/b2b/admin/companies/settlements/route.ts`, `app/b2b/admin/companies/settlements/page.tsx`
- 월별 정산서 출력 화면에 `■ 화환 판매 정산 세부 내역 명세`와 `■ 부의금 정산 세부 내역 명세` 독립 렌더링
- 상단/하단 총 정산금액에 화환 정산액 + 부의금 정산액 통산 합산 집계

## 2026-08-05

### 📱 1:1 문의 페이지 앱 상단 safe-area 패딩 보정
- **파일**: `app/b2b/inquiry/inquiry.module.css`
- 모바일 앱(iOS WKWebView) 환경에서 상단 노치/상태바 영역과 1:1 문의 헤더가 겹치던 현상 수정 (`.fixedHeaderContainer`에 `padding-top: env(safe-area-inset-top, 0px)` 추가)

### 🙈 설정 내 미연동 부고장 옵션 3종 미노출 처리
- **파일**: `app/b2b/settings/page.tsx`
- 백엔드 DB 및 부고장 View 미연동 옵션 3종(`화환 판매가격 설정`, `상주 만족도`, `판매정보`) 설정 목록에서 미노출(주석 처리) 완료. (추후 연동 고도화 시 재노출 예정)

### ❓ 자주 묻는 질문(FAQ) 헤더 메뉴 아이콘 제거 및 단일 열림 보정
- **파일**: `app/b2b/settings/page.tsx`
- FAQ 상단 우측 불필요한 햄버거 메뉴 아이콘 제거
- FAQ 질문 클릭 시 중복 열림을 방지하고 1개씩 단일 열림으로 `toggleFaq` 핸들러 보정

### 🤖 Google Play 스토어 파트너 앱 정식 출시 & 회원가입 완료 링크 연동
- **파일**: `app/b2b/signup/complete/page.tsx`
- 구글 플레이스토어 정식 출시(`kr.co.maeumbugo.bugoon`)에 맞춰 회원가입 완료 페이지의 [앱 다운로드하기] 클릭 시 구글 플레이스토어 앱 주소로 직접 이동 연동

### 🔗 어드민 사이드바 푸터 링크 절대 경로 보정
- **파일**: `components/b2b/B2BAdminSidebar.tsx`
- 어드민 서브 페이지에서 푸터 링크 클릭 시 어드민 주소가 중첩되어 주소가 틀어지는 현상을 방지하도록 절대 경로 보정

### 💰 대시보드 & 설정 문구 '적립 금액' 통일 및 토글 스위치 기본값 OFF 세팅
- **파일**: `app/b2b/dashboard/page.tsx`, `app/b2b/settings/page.tsx`
- 대시보드 및 설정 문구 `적립 예정 금액` ➡️ `적립 금액` 으로 명칭 통일
- 적립 금액 표시 스위치를 기본 OFF(가림)로 설정하고, ON으로 켰을 때만 금액이 보이도록 `localStorage` 저장 및 동기화 조치

### ✉️ 의례문서(위패/축문) 전송 확인 팝업 모달 + 수신 번호 수정 & 자동 하이픈(-) 적용
- **파일**: `app/b2b/ritual/[bugoId]/page.tsx`
- [보내기] 클릭 시 수신 휴대폰 번호를 직접 수정할 수 있는 인풋(Input) 상자 제공
- 숫자 입력 시 하이픈(`-`)이 `010-XXXX-XXXX` 형태로 자동 형성되도록 포맷팅 적용 및 전송 완료 토스트 팝업 연결

## 2026-08-03

### 🐛 펌뱅킹 이체 비동기 누수 버그 수정 (치명적 결함)
- **파일**: `app/api/b2b/wallet/route.ts`
- `fetch()` 이노페이 펌뱅킹 이체 호출에 `await`가 누락되어 Vercel 서버리스 함수가 조기 종료 → 이체 요청이 이노페이 서버에 도달하지 못하는 결함 수정
- 이체 결과 확인 없이 DB에 무조건 `approved` 사전 INSERT하던 로직 → `pending`으로 안전 생성 후, 이체 성공(`resultCode === '0000'`) 시에만 `approved` UPDATE로 변경
- 이체 실패/타임아웃 시 `pending` 상태 유지 → 어드민 출금 신청 관리에서 `[송금진행]` 재시도 가능

### 월렛 탭별 우측 상단 문구 분리
- **파일**: `app/b2b/wallet/page.tsx`
- 적립내역 탭: `누적적립금 X,XXX원` / 환급내역 탭: `총 환급 수당 X,XXX원` 으로 분리 표시

### formatTxDate 하드코딩 제거
- **파일**: `app/b2b/wallet/page.tsx`
- `'08.03'` 하드코딩 분기 제거, KST `Asia/Seoul` 기반 동적 포맷으로 통일

## 2026-07-23

### B2C 부고 작성 입력 검증 및 보안 차단 고도화
- **고인 성함-신청자 성함 중복 검증**: 고인명과 신청자명 입력값이 공백을 제외하고 완전히 일치할 경우 양식 작성을 강제 차단하는 유효성 검사 규칙을 추가하였습니다. (alert 팝업을 제거하고, 빨간색 인라인 경고 표시 및 에러 필드로 자동 스크롤 처리)
- **개발자 도구 (F12) 보안 차단**: 프로덕션 환경에서 보안 및 크롤링 방지를 위해 개발자 도구 작동을 감지하면 아예 주소창을 `about:blank`(빈 페이지)로 강제 리다이렉트 처리합니다. 단축키 차단(F12, Cmd+Opt+I 등)과 더불어, 마우스 우클릭 -> '검사' 등으로 개발자 도구를 여는 경우에도 브라우저가 콘솔 출력 객체의 id 속성을 읽는 특성(element getter)을 활용해 실시간으로 감지 및 강제 리다이렉션되도록 다각화하였습니다. (단, 마우스 우클릭 자체와 복사/붙여넣기는 그대로 허용하며, 로컬 개발 환경인 `localhost` 및 `127.0.0.1`은 예외 처리)

## 2026-07-19

### 앱 명칭 변경 및 기본 언어 다국어(한국어) 지정 (v1.0.1 / Build 7)
- **앱 노출 이름 변경**: `Info.plist` 내의 `CFBundleDisplayName` 및 `capacitor.config.ts` 내의 `appName`을 `"부고온"` -> **`"부고온플러스"`**로 일제히 업데이트하였습니다.
- **다국어 현지화 설정**: App Store Connect 메타데이터 내에 **한국어(Korean)** 언어를 지정하여 영어(EN) 노출 현상을 바로잡고, 기본 언어를 한국어로 설정하였습니다.
- **Xcode 아카이브 및 제출**: 빌드 버전 번호 충돌 방지를 위해 `Info.plist` 내 `CFBundleShortVersionString`을 `1.0.1`로 고정하고 빌드 번호를 `7`로 상향하여 클린 아카이빙 성공 및 업로드를 조치 완료하였습니다.

## 2026-07-11

### FCM 푸시 및 스와이프 제스처 고도화
- **정석 보안 기반 FCM 토큰 수집 복구**: iOS WKWebView의 localStorage 유실 결함을 보완하기 위해 세션 쿠키에서 토큰을 추출하는 getB2BToken 헬퍼 함수를 추가하고, 백엔드 API의 우회 코드를 폐기하여 쿠키-JWT 이중 교차 검증 보안 체계를 완수했습니다.
- **무신사 스타일 실시간 2중 레이어 스와이프 복원**: 뒤로가기 스와이프 제스처 시 이전 화면의 스크롤 위치(scrollY)를 실시간 동기화하여 화면 덜컥거림을 잡고, 배경색을 연회색(#f8f9fa)으로 정비하여 흑화 깜빡임 현상을 원천 제거했습니다.
- **하단 탭바 전환 개선**: 메뉴 간 이동 시 불필요한 슬라이드 애니메이션을 전면 제거하여 즉시 전환(Instant Cut) 조작감으로 변경했습니다.
- **디버그 UI 완전 원복**: 수동 토큰 복사 기능 및 자가진단 문구, 대시보드 내 임시 알림 발송 트리거 버튼을 소스코드 상에서 100% 완전 소거하여 깨끗한 프로덕션 UI 상태로 원복했습니다.
- **Supabase DB 데이터 정비**: b2b_users 테이블에 is_admin 컬럼 생성 및 관리자 권한 부여를 완료하고, 대표자 백승훈 사장님 계정의 owner_name을 본명으로 싱크 정비 완료했습니다.

### FCM 푸시 알림 구현
- **클라이언트 푸시 등록**: `lib/push-notifications.ts` 신규 생성 - Capacitor PushNotifications 플러그인을 이용한 FCM 토큰 등록/해제 유틸리티
- **서버 푸시 발송**: `lib/fcm.ts` 신규 생성 - Firebase Admin SDK(v14)를 이용한 서버사이드 푸시 발송 유틸리티
- **푸시 발송 API**: `app/api/b2b/send-push/route.ts` 신규 생성 - 특정 파트너에게 푸시 알림 발송 엔드포인트
- **대시보드 푸시 등록**: `app/b2b/dashboard/page.tsx`에서 로그인 후 자동으로 FCM 토큰을 서버에 등록
- **Supabase 테이블**: `b2b_push_tokens` 테이블 생성 (partner_id, fcm_token, platform)
- **firebase-admin v14.1.0** 설치, `next.config.ts`에 `serverExternalPackages` 설정 추가

### iOS 네이티브 설정
- **AppDelegate.swift**: Firebase 초기화(`FirebaseApp.configure()`), APNs 토큰 FCM 연동
- **GoogleService-Info.plist**: Bundle ID `kr.co.maeumbugo.bugoon`용 파일 교체 및 Xcode 프로젝트에 등록
- **google-services.json**: Android용 Firebase 설정 파일 교체
- **Package.swift**: Firebase iOS SDK(`FirebaseMessaging`) 의존성 추가
- **Push Notifications Capability**: Xcode에서 추가 완료
- **앱 이름 변경**: `Info.plist` CFBundleDisplayName을 "마음부고 파트너" → "부고온"으로 변경

### iOS StatusBar 겹침 수정
- **@capacitor/status-bar 플러그인** 설치 및 `B2BLayoutClient.tsx`에서 `overlaysWebView: false` 설정
- 네이티브 레벨에서 WebView가 상태바 아래부터 시작하도록 처리 (CSS 해킹 불필요)

### 로그아웃 버그 수정
- `settings/page.tsx`의 `handleLogout`에서 localStorage + sessionStorage + 클라이언트 쿠키 + 서버 쿠키(httpOnly) 전부 삭제하도록 수정
- 기존에는 localStorage만 삭제하여 쿠키 기반 자동 로그인이 재실행되는 버그 있었음

### 로그인 화면 UI 수정
- 비밀번호 눈 아이콘이 작은 화면에서 밀려나가는 문제 수정 (`inputWrap`에 `overflow: hidden` 추가)

### Firebase/Vercel 환경 설정
- Vercel 환경변수 `FIREBASE_SERVICE_ACCOUNT_KEY` 프로덕션에 추가
- Firebase Console에서 APNs 인증 키(AuthKey_Q34SS2799R.p8) 업로드 완료

## 2026-07-10

### B2B 인증 시스템 쿠키 기반 전환 (iOS WebView localStorage 불안정 대응)
- **B2B 로그인 쿠키 저장**: `/api/b2b/login`에서 JWT를 HTTP-only 쿠키에도 저장하도록 수정하여, iOS WebView에서 `localStorage`가 유실되더라도 인증 세션이 유지되도록 개선
- **인증 확인 API 신규 구축**: `/api/b2b/auth` 엔드포인트를 신설하여 쿠키와 Authorization 헤더를 동시에 지원하는 듀얼 인증 확인 방식을 구현
- **me API 쿠키 fallback**: `/api/b2b/me`에 쿠키 기반 fallback 로직을 추가하여 헤더 토큰이 없는 경우에도 쿠키에서 JWT를 추출하여 정상 응답하도록 보완
- **클라이언트 인증 전환**: 스플래시(`/b2b`), 로그인(`/b2b/login`), 대시보드(`/b2b/dashboard`) 페이지를 `localStorage` 직접 확인 대신 `/api/b2b/auth` API 기반 인증 확인으로 전환

### Android versionCode 3 재빌드 및 Google Play 재제출
- `versionCode 3`으로 AAB 재빌드 후 Google Play Console 프로덕션 트랙에 심사 재제출 완료

### iOS Build 2 아카이브 및 App Store 재제출
- 앱 아이콘을 `Logo512.png`로 교체하고 빌드번호 2로 아카이브
- App Store Connect에 업로드 후 버전 1.0의 빌드를 Build 1 → Build 2로 변경하여 심사 재제출 완료

### App Store Connect API Key 세팅
- Key ID `Q34SS2799R`로 App Store Connect API Key 생성 및 `~/.appstoreconnect/private_keys/`에 저장하여 터미널 자동화 준비 완료

### Vercel 프로덕션 배포
- 쿠키 인증 전환이 반영된 코드를 Vercel 프로덕션에 배포 완료

## 2026-06-25

### B2B URL 유실 오류 수정 및 미들웨어 로컬 환경 차단 우회 패치
- **B2B/B2C 결제 후 주소 유실(UUID Reversion) 오류 수정**:
  - 화환 주문서 결제 성공 후 돌아가기 및 공유 URL 등이 데이터베이스 내부 UUID(`/view/cf09e833-...`)로 노출되던 문제를 수정하여, 항상 `bugo_number`(`/view/8888`)가 주소창에 올바르게 보존되고 전달되도록 API와 상세 페이지를 보완했습니다.
  - `app/api/flower-orders/[orderId]/route.ts`에 `bugo_number` 응답 필드를 신설하고, `app/api/flower-orders/route.ts`에서 UUID와 bugo_number를 둘 다 처리할 수 있도록 GET 조회를 개선했습니다.
  - `app/order/[orderId]/page.tsx` 및 `app/b2b/order/[orderId]/page.tsx` 내의 돌아가기 링크가 `order.bugo_number || order.bugo_id` 형식을 활용하도록 수정했습니다.
- **로컬 미들웨어 포트 분리 및 404 차단 우회**:
  - `middleware.ts`: 로컬 호스트 테스트 시 포트 3000번은 B2C(마음부고), 3001번은 B2B(부고온)로 명확히 판별되도록 포트 감지 조건을 고도화했습니다.
  - 로컬 환경 접속의 경우, 운영계 도메인 제한을 가정한 `/b2b` 직접 접근 차단 로직(404 리턴)에 걸려 크롬 HTTP 404 에러가 발생하던 현상을 방지하고자 로컬 호스트 접속 시 차단막을 우회하도록 처리했습니다.
- **Vercel 빌드 내 bankicon 제외 패턴 오류 조치**:
  - `.vercelignore`: Vercel 배포 제외 목록에 들어있던 `bankicon`이 Next.js 프로젝트 리소스인 `jojo/public/images/bankicon` 디렉토리까지 빌드에서 차단해 라이브 서버에서 은행 로고가 404 에러로 깨지던 문제를 수정했습니다. 루트 전용 패턴인 `/bankicon`으로 교정함으로써 Next.js 내의 자산들이 올바르게 업로드 및 배포되도록 조치했습니다.

## 2026-06-24

### B2B 파트너 정산 사업자 유형 삭제 및 최소 출금액 10,000원 정합성 패치
- **B2B 본인인증 및 정산 플로우 내 사업자 옵션 영구 제거**:
  - `app/b2b/wallet/verify/form/page.tsx`: 본인인증 양식 폼에서 "사업자 (세금계산서)" 탭과 관련 사업자등록번호 등의 입력 필드를 완전히 삭제하여 개인 프리랜서(3.3% 원천징수 소득증빙) 단일 가입 방식으로 프로세스를 단순화했습니다.
  - `app/b2b/wallet/page.tsx`: 지갑 환급 신청 모달에서 사업자 유형(부가세 10% 가산 지급 및 세금계산서 발행)에 대한 예상 입금액 카드 분기 처리를 삭제하고, 오직 "개인 대상자 - 3.3% 원천징수 세액 공제" 계산식만 단일 표시되도록 개선했습니다.
- **최소 출금 가능 금액 fallback 정합성 보완**:
  - `app/api/b2b/wallet/route.ts` 및 `app/api/b2b/admin/settings/route.ts` 내에 하드코딩되어 있던 최소 출금 fallback 한도 상수값을 `50000`에서 `10000`으로 수정하여, 테이블 설정 누락 상황에서도 10,000원 기준으로 정합성 있게 동작하도록 조치했습니다.
- **서버사이드 부고장 대리 개설 위임 (RLS 에러 해결)**:
  - B2B 대시보드에서 JWT 기반 부고장 생성 시 Supabase RLS 400 에러를 해결하기 위해, `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 `/api/b2b/bugo` 라우트를 신설하여 쓰기 권한을 서버사이드에 위임했습니다.
- **B2B 스플래시 로딩 화면 구현**:
  - 배경 Panning(우에서 좌로 패닝 무빙), 슬로건 및 하단 브랜드 로고의 딜레이 페이드인 모션을 가미하여 Next.js B2B 진입부의 스플래시 로딩 화면을 세련되게 완성했습니다.
- **개별 캐시 키 격리**:
  - `/view/[id]/page.tsx` 조회 시 `unstable_cache` 키가 정적 문자열로 고정되어 발생하던 캐시 꼬임 이슈를 방지하고자 `['bugo-data', id]` 동적 캐시 키로 리팩토링했습니다.
- **이노페이 API 로컬 Mocking 및 우회 없는 Playwright E2E UI QA 성공**:
  - 어드민 출금 승인 시 이노페이 실이체 API 호출로 인해 가상 테스트 계좌가 에러를 뱉는 현상을 방지하기 위해 로컬 개발 환경(`process.env.NODE_ENV === 'development'`) 시 이노페이 송금을 모의 성공 처리하도록 백엔드 라우트를 수정했습니다.
  - Playwright E2E 자동화 스크립트(`scratch/test_b2b_full_lifecycle_qa.js`)에서 API/DB 직접 조작 우회를 전면 걷어내고, 실제 브라우저 클릭을 통해 가입 승인, 상주 뷰(공유 모달 및 실시간 장부 반영 확인), 어드민 송금완료 승인까지 검증하는 시나리오를 완성하여 100% 통과(성공 캡처 15종 저장)시켰습니다.
- **빌드 캐시 초기화 및 빌드 오류 해결**:
  - Next.js Turbopack 빌드 과정에서 `.next` 하위 임시 컴파일 파일의 꼬임 현상으로 인해 발생한 `LayoutProps` 중복 선언 타입스크립트 에러를 `rm -rf .next` 및 신규 빌드 무결성 검사(`npm run build`) 통과로 완전히 조치했습니다.
- **B2B 대시보드 로고 적용 및 스플래시 로고 원복**:
  - `app/b2b/dashboard/page.tsx`, `dashboard.module.css`: 메인 대시보드 헤더의 "부고온 파트너" 텍스트 영역을 유저가 업로드한 공식 초록색 부고온 로고 이미지(`logo.png`)로 교체 적용했습니다.
  - `app/b2b/page.tsx`: 스플래시 화면 하단 로고는 기존 백업 파일(`splashloㅎo.png`)을 복구하여 원형대로 표시되도록 원복했습니다.

## 2026-06-22

### B2B 부고 조회 실서버 DB 외래키 복원 및 IDOR 취약점/정산수당 계산 보완
- **B2B 부고 조회 API 오류 및 화면 500 에러 해결**:
  - 실서버(프로덕션) Supabase 데이터베이스에 `flower_orders.bugo_id` -> `bugo.id` 외래키 제약조건(`flower_orders_bugo_id_fkey`)이 누락되어 PostgREST 묵시적 조인 select 쿼리가 실패(500)하고 화면에 "부고 데이터를 가져오는데 실패했습니다"라는 경고 배너가 출력되던 문제를 실서버 DB DDL 제약조건 적용으로 완전히 해결했습니다.
- **B2B 부고장 수정화면 IDOR 권한 검증 추가**:
  - `app/b2b/create/page.tsx` 내의 `loadBugoData` 함수에서 `localStorage`에 저장된 현재 로그인한 B2B 파트너의 ID와 조회한 부고의 `b2b_user_id`를 대조하여, 타인의 부고 데이터를 무단 조회 및 수정할 수 없도록 권한 검증 로직을 추가했습니다.
- **B2B 조의금 수당 적립 요율 동적 설정 보완 (역마진 방지)**:
  - `app/api/payment/innopay/approve/route.ts` 내의 조의금 결제 승인 로직에서, 고정된 8.6% 전액 적립 방식을 배제하고 `b2b_settings` 테이블의 `b2b_condolence_fee_rate` 값을 동적으로 조회하여 해당 요율(설정 누락 시 기본 5%)로 적립되도록 보완하여 역마진 발생 가능성을 원천 차단했습니다.
- **Vercel 빌드 모듈 누락(Module not found) 해결**:
  - `lib/b2b.ts` 및 `app/b2b/view/...` 등의 B2B 신규 래퍼 페이지들이 git 스테이징에 누락된 채 원격 빌드가 돌며 발생했던 `Module not found: Can't resolve '@/lib/b2b'` 빌드 깨짐 현상을 로컬 빌드 무결성 검증 후 누락 파일을 모두 git에 추가 및 push하여 해결하였습니다.

### B2B 대시보드 직접 화환 주문 플로우 구축 및 감사장 404 라우팅 개선
- **대시보드 화환 주문 버튼 & 아이콘 개선**:
  - `app/b2b/dashboard/page.tsx` 내의 화환 주문 버튼 링크를 기존 부고 선택 창 대신 직접 화환 리스트(`/b2b/flower`)로 연결되도록 변경하고, 햅쌀/해 아이콘 대신 직관적인 꽃 아이콘으로 교체하였습니다.
- **B2B 전용 화환 리스트 및 주문서 화면 신설**:
  - `app/b2b/flower/page.tsx` 및 `flower.module.css`: DB의 활성 상품 목록을 로드하여 깔끔한 모바일 규격의 카드 목록으로 표시하는 전용 페이지를 구축했습니다.
  - `app/b2b/flower/order/[productId]/page.tsx` 및 `OrderContent.tsx`, `order.module.css`: 선택한 화환에 대한 주문 상세 페이지를 구현했습니다. 상주 정보 입력 단계에서 자신의 등록된 부고장 목록을 선택해 자동 입력(Read-only 상태로 변환)할 수도 있고, 타 장례식장의 경우 직접 입력도 지원합니다.
  - 직접 입력하여 주문하는 경우, 기존의 PG 결제/콜백/슬랙 등 기존 흐름과 100% 호환되도록 Supabase에 임시 `bugo` 레코드를 자동 인서트하고 결제창(`/view/[id]/payment/[productId]`)으로 넘기도록 안전하게 우회 처리했습니다.
- **B2B 파트너 정산 수당 적립 예외 로직 보완**:
  - `app/view/[id]/payment/[productId]/PaymentContent.tsx` 및 `app/api/flower-orders/route.ts`에 `partner_data` 필드 연동을 추가해 주문자가 B2B 파트너일 때 파트너 ID가 주문 레코드에 안전하게 보존되도록 개선했습니다.
  - `app/api/payment/innopay/approve/route.ts` 및 `webhook/route.ts` 정산 배치 로직을 업데이트하여, 부고 소유자뿐만 아니라 주문서의 `partner_data.b2b_user_id`를 검출해 직접 입력 주문 시에도 파트너에게 10,000원의 판매 정산 수당이 정상 지급되도록 보완했습니다.
- **B2B 서브도메인 내 감사장 경로 404 버그 해결 및 헤더 뒤로가기 스타일 복원**:
  - B2B 서브도메인에서 `/view/[id]/thanks` 경로가 미들웨어에 의해 `/b2b/view/[id]/thanks`로 리라이팅될 때 라우트가 없어 404가 나던 오류를 해결하기 위해 `app/b2b/view/[id]/thanks/page.tsx` 래퍼 페이지를 신설하여 B2C 화면을 그대로 포팅/공유하도록 처리했습니다.
  - `ThanksContent.tsx` 내의 감사장 헤더 및 뒤로가기 버튼(`thanks-header`, `thanks-back-btn`)이 마크업에는 정의되어 있었으나 `thanks.css` 내 스타일 누락으로 인해 화면 상단 탭에 가려져 보이지 않던 문제를 헤더 고정 스타일 정의 및 탭/래퍼 마진(탑 오프셋 104px) 조정으로 해결하여 화면에 정상 노출되도록 복원했습니다.

### B2B 모바일 부고장 뷰 404 및 주소창 b2b/ 누락 문제 해결
- **B2B 뷰 진입 경로 수정**:
  - `app/b2b/admin/bugo/page.tsx` 내의 "부고장 보기" 링크 주소를 `/b2b/view/${selectedBugo.bugo_number}`로 수정하여 브라우저 주소창에 `/b2b` 프리픽스가 정상적으로 표시 및 유지되도록 수정했습니다.
  - `app/b2b/manage/page.tsx` 내의 "감사장 전송" 링크 주소를 `/b2b/view/${b.bugo_number}/thanks`로 수정하였습니다.
- **B2B 뷰 하위 404 에러 방지용 래퍼 페이지 구축**:
  - `/app/b2b/view/[id]` 하위에 일반 B2C 뷰에서 사용되는 상세/주문/결제 관련 경로들에 대응하는 **9개의 B2B용 래퍼 페이지**를 신설하여 404 에러를 원천 해결하였습니다:
    - `/app/b2b/view/[id]/flower/[productId]/page.tsx`
    - `/app/b2b/view/[id]/order/[productId]/page.tsx`
    - `/app/b2b/view/[id]/payment/[productId]/page.tsx`
    - `/app/b2b/view/[id]/payment/callback/page.tsx`
    - `/app/b2b/view/[id]/condolence/page.tsx`
    - `/app/b2b/view/[id]/condolence/complete/page.tsx`
    - `/app/b2b/view/[id]/condolence/history/page.tsx`
    - `/app/b2b/view/[id]/gift/page.tsx`
    - `/app/b2b/view/[id]/thanks/card/page.tsx`
    - `/app/b2b/view/[id]/order/complete/page.tsx`
    - `/app/b2b/view/[id]/order/vbank-pending/page.tsx`
- **B2C/B2B 공용 컴포넌트의 동적 주소 프리픽스 대응**:
  - B2C 공용 클라이언트 컴포넌트(`CondolenceContent`, `FlowerDetailContent`, `OrderContent`, `PaymentContent`, `ThanksContent`, `GiftPage`, `OrderCompletePage`, `VBankPendingPage`, `PaymentCallbackPage`)들에서 현재 URL 경로를 감지하여 주소창이 `/b2b/view/...`로 시작하면 다음 흐름 및 결제 콜백 등의 리다이렉트 시에도 자동으로 `/b2b` 프리픽스를 유지하도록 수정했습니다.
  - `app/b2b/view/[id]/ViewContent.tsx` 내의 모든 prefetch 및 redirect 경로를 B2B 하위 경로(`/b2b/view/...`)로 수정하였습니다.
- **Next.js Router prefetch 런타임 에러 수정**:
  - `ViewContent.tsx` (B2C & B2B) 내의 세 가지 prefetch `useEffect` 훅에 `mounted` 검사(`if (mounted && ...)`)를 추가하여, Next.js hydration 또는 TurboPack 개발 환경에서 라우터가 완전히 로드되기 전에 `router.prefetch`가 호출되어 발생하던 `Router action dispatched before initialization` 런타임 에러를 해결했습니다.

### B2B 부고장 상세 정보 확인 모달 개선
- **화환 주문하기 버튼 제거**:
  - `app/b2b/manage/page.tsx` 내의 모바일 부고장 상세 정보 확인 바텀시트 모달에서 불필요했던 "화환 주문하기" 버튼을 제거하였습니다.

### B2B 하단 탭바 선택 모드(답례문/화환) 네비게이션 활성화 버그 수정
- **하단 탭 활성화 로직 개선**:
  - `components/b2b/BottomTabBar.tsx`에서 대시보드로부터 '답례문 보내기' 또는 '화환 보내기' 버튼을 클릭하여 이동했을 때(URL에 `?select=thanks` 또는 `?select=flower` 쿼리 파라미터가 있을 때) 하단 '부고' 탭이 활성화 상태로 표시되지 않도록 수정하였습니다.
  - Next.js App Router 빌드 시 정적 분석 에러 및 수화(hydration) 경고 방지를 위해 `BottomTabBar` 내부를 `Suspense` 바운더리로 감싸도록 최적화했습니다.

### B2B 전용 서브도메인 라우팅 실서버 배포 완료
- **Vercel 실서버(dodam-next) 배포 연동**:
  - 기존 테스트 프로젝트(`jojo`)로 잘못 연동되어 환경 변수가 누락되었던 문제를 로컬 작업 폴더를 실서버 프로젝트인 `dodam-next`로 올바르게 재연동하여 해결하였습니다.
  - Vercel CLI 배포 과정에서 로컬의 불필요한 대용량 디자인 파일 및 `node_modules`가 업로드되지 않도록 `.vercelignore` 설정을 보강하여 안정적인 업로드 및 빌드를 구축했습니다.
- **실서버 서브도메인 라우팅 및 리다이렉션 검증**:
  - `bugoon.maeumbugo.co.kr` 접속 시 Vercel에서 B2B 전용 브랜드 페이지("부고온 파트너", `/b2b`)로 정상 매칭 및 렌더링(HTTP 200)되는 것을 검증 완료하였습니다.
  - `/login` 등의 경로도 B2B 내부 경로 `/b2b/login`으로 올바르게 rewrite 처리되는 것을 확인했습니다.

## 2026-06-21

### B2B 신분증 OCR 자동 검증 및 지연 자동 송금 시스템 구축
- **신분증 OCR 자동 검증 시뮬레이션 API 구축**:
  - [verify/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/verify/route.ts)에서 사용자가 업로드한 신분증 이미지 OCR 파싱 결과를 처리합니다.
  - 가입한 이름과 신분증 파싱 결과 이름이 일치하면 `verification_status`를 `'verified'`로 업데이트하고, 보류된 출금 요청이 있을 경우 1시간 뒤 자동 실행되도록 `auto_approve_at` 시간을 설정합니다.
  - 이름이 불일치하면 상태를 `'failed'`로 설정하고, 관리자에게 즉각 Slack 경보를 발송하여 수동 확인 및 재승인이 가능하도록 처리합니다.
- **지연 자동 송금 Cron 배치 API 구축**:
  - [auto-approve-withdrawals/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/cron/auto-approve-withdrawals/route.ts)에서 `auto_approve_at <= now()` 조건에 해당하는 출금 요청을 자동으로 조회합니다.
  - Innopay 송금대행 Proxy API(`http://49.50.139.204/proxy/transfer`)를 호출하여 실시간 송금을 요청합니다.
  - 송금이 완료되면 Supabase RPC `approve_withdrawal_request`를 실행하여 정산 잔액 차감 및 최종 승인 처리를 하고, 관리자 Slack으로 성공 메시지를 전송합니다.
  - 은행 점검 시간이나 계좌 번호 오류 등의 이유로 송금이 거절되면 `auto_approve_at`을 `null`로 초기화하여 무한 재시도 루프를 방지하고, 관리자가 재확인할 수 있도록 Slack 경보를 보냅니다.

### B2B 가상계좌 입금 Callback 정산 수당 자동 적립 연동
- **Innopay Callback 가상계좌(vbank) 연동**:
  - [webhook/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/webhook/route.ts)에서 가상계좌 입금이 완료되는 순간, B2B 파트너에게 약정된 화환 수당(10,000원)과 추천인(Recommender) 보너스(2,000원)를 즉시 자동 적립하고 입출금 내역에 트랜잭션을 기록하는 로직을 이식하였습니다.

### B2B 페이지 전체 브랜딩 텍스트 전수 치환 ("마음부고" -> "부고온")
- **B2B 전용 페이지 텍스트 치환**:
  - `income-tax`, `privacy`, `signup`, `terms`, `wallet/verify` 및 조문객용 B2B 뷰 페이지([ViewContent.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/view/[id]/ViewContent.tsx) 하단 푸터 영역)에 잔존하던 모든 "마음부고" 브랜드명을 B2B 전용 명칭인 "부고온"으로 전수 치환하여 브랜딩 정체성을 통일하였습니다.

### B2B 부고장 제작 로고 선택 UI 및 특정 로고 개선 (피드백 반영 완료)
- **상조사 로고 32종 및 더좋은라이프 로고 가공 방식 변경 (흰색 배경화)**:
  - 투명 PNG 앤티앨리어싱 훼손에 따른 로고 깨짐 문제를 방지하기 위해 로고 이미지를 **순수 흰색 배경** 캔버스 `(200x100)` 기반으로 일괄 재생성했습니다.
  - 로고 원본 스크린샷 캡처본에서 로고 카드 영역을 타이트하게 크롭하고, 흰색 `(255, 255, 255)` 배경의 캔버스 위에 고화질로 안착시켜 글자가 뭉개지거나 흐릿해지지 않고 훨씬 선명하고 자연스럽게 렌더링되도록 개선하였습니다.
- **로고 테두리선(가로선) 노이즈 및 별표(즐겨찾기) 잔재 완벽 차단**:
  - 캡처 이미지 크롭 시 상하좌우를 깎아내는 여백을 18px로 대폭 넓혀, 카드 상단에 노출되던 미세한 회색 가로선 및 테두리선 노이즈를 100% 차단했습니다.
  - 로고 이미지 내부의 별표 지우기 사각형 영역을 `90x75`로 세로폭을 확장하여 별표의 아래쪽 끄트머리 꼬리 형태 잔재가 묻어나오던 현상을 해결했습니다.
  - 이를 통해 로고의 텍스트/심볼 본체만 타이트하게 Bounding Box가 잡혀, 최종 캔버스 패딩 최소화 설정(`padding_x = 12`, `padding_y = 8`)과 맞물려 이미지가 훨씬 큼직하고 시원하게 배치됩니다.
- **조문객용 B2B 모바일 부고장 뷰 최상단 고정 로고 탑 바(Top Bar) 도입**:
  - 기존 부고 이미지 위에 절대 좌표 오버레이로 둥둥 떠서 이미지를 가렸던 뱃지(`b2b-brand-badge`)를 제거하고, 화면 가장 꼭대기 영역에 깔끔한 흰색 헤더 탑 바(`b2b-top-header-bar`)를 적용했습니다.
  - 탑 바 한가운데에 상주가 지정한 상조 로고를 `height: 36px`로 선명하고 큼직하게 노출시켜, 조문객이 부고장 접속 시 해당 제휴 상조 브랜드를 가장 먼저 만날 수 있도록 고도화했습니다.
- **즐겨찾기(별표) 기능 및 UI 100% 원상 복구**:
  - UI 상의 즐겨찾기 등록/해제 기능 및 별표 버튼은 그대로 유지해야 한다는 요구사항에 맞춰, 이전에 삭제했던 `OptionsSection.tsx` 내 즐겨찾기(Favorites) 관련 탭, 로컬스토리지 동기화, 별표 토글 버튼(`logoStarBtn`) 및 관련 상태 관리 로직을 완벽하게 원상 복원했습니다.
- **상조 로고 카드 이미지 크기 확대 (2열 고정)**:
  - 모달 내 그리드를 `repeat(2, 1fr)`로 고정하고 개별 로고 카드의 높이를 `95px`로 늘렸으며, 이미지 크기 한도를 `max-width: 90%`, `max-height: 70px`로 상향 적용하여 큼직하고 시원한 레이아웃을 완성하였습니다.

## 2026-06-20

### B2B 부고 조회 리스트 및 대시보드 팝업 모달 흐름 도입
- **모바일 부고장 상세 확인 팝업 (바텀시트)**: 
  - 대시보드 리스트 및 관리 목록(`/b2b/manage`)에서 아이템을 클릭했을 때, 바로 발송 페이지로 가지 않고 기획안 스크롤 시트와 똑같은 **"모바일 부고장 내용을 확인해주세요."** 팝업 모달이 뜹니다.
  - 모달 상에서는 별세/입관/발인/장지 등 필수 정보가 누락되었을 때 분홍색 경고 기호(`❗️ 해당 정보가 없습니다`)를 동적 표시합니다.
  - **부고 복제**: 클릭 시 기존 부고 정보를 기반으로 신규 고유 ID 및 토큰을 생성해 즉시 DB에 복제 인서트 후 목록을 새로고침합니다.
  - **부고 삭제하기**: 클릭 시 confirm을 거쳐 Supabase DB 상에서 안전하게 즉시 삭제 처리합니다.
  - **제어 버튼 그룹**: `부고수정` 클릭 시 수정 화면(`/create/edit/[bugoNumber]`)으로 연결되고, `바로가기` 클릭 시 발송/계좌 노출 뷰(`/b2b/create/complete/[bugoNumber]`)로 이동하며, `취소` 클릭 시 팝업을 닫습니다.

### B2B 부고장 발송 및 계좌 노출 설정 화면 도입
- **발송 여부 및 계좌 노출 설정**: 작성 완료 화면 `/b2b/create/complete/[bugoNumber]`에서 각 상주별 발송 여부(체크박스)와 모바일 부고장상의 계좌 노출 규칙(`내 계좌만 노출`, `모든 계좌 노출`, `모든 계좌 노출안함`)을 개별 선택 및 지정할 수 있도록 뷰를 전면 개편하였습니다.
- **상주별 알림 발송 백엔드 API 신설**: `/api/b2b/send-mourner-notify` API를 구축하여 각 상주에게 개별 설정된 링크(`?m=상주이름`)가 담긴 LMS 문자 메시지 또는 카카오 알림톡을 발송하고, 설정 변경 내역을 Supabase DB의 `bugo.mourners`에 즉시 동기화합니다.
- **모바일 부고장 뷰 내 동적 계좌 필터링**: `app/view/[id]/ViewContent.tsx`에서 URL 쿼리 파라미터 `m`을 감지하여 접속한 경로별 상주의 계좌 설정(`mine` -> 본인 계좌만, `none` -> 모든 계좌 숨김, `all` -> 전체 노출)에 맞춰 동적으로 노출 여부를 필터링합니다.

### B2B 브랜드 초록색(#3A8F47) 테마 일관 적용
- **완료 및 설정 페이지 개편**: 완료 화면 내 테이블 테두리, [카카오톡보내기] / [문자보내기] 버튼 및 하단 [목록으로], 우측 상단 [X] 버튼의 네이비 테마를 전면 배제하고 브랜드 초록색(#3A8F47) 및 모노톤으로 대체하였습니다.
- **미리보기 모달 개편**: 미리보기 요약 모달의 [최종 생성하기] 버튼 역시 브랜드 초록색(#3A8F47)을 적용하였습니다.

### B2B 마이페이지/설정 서브 뷰 고도화 및 아이콘 시스템화
- **B2BIcon 도입**: `B2BIcon.tsx` 컴포넌트를 신설하여 B2B 전반의 아이콘 선 굵기를 `1.5`로 통일하고 가벼운 그레이 톤으로 교체하였습니다.
- **내부 상세 뷰 개발**: 마이페이지 내 `view` 상태 분기를 확장하여 내정보 상세(`view === 'info'`), 회원탈퇴 상세(`view === 'withdraw'`) 페이지를 모달 없이 깔끔하게 내재화했습니다.
- **외부 약관 내재화**: 기존 외부 유출 또는 임시 얼럿으로 처리되던 약관 및 개인정보처리방침을 독립적인 내부 스크롤 뷰(`view === 'terms' | 'privacy'`)로 이식하여 이탈을 차단했습니다.
- **화환 가격 설정 리스트 확장**: 화환 가격 설정(`view === 'price'`)을 5종 상품(근조바구니, 근조 3단, 오브제 2단, 근조 4단 특대, 근조 쌀화환 10kg)으로 확장하고 하단 고정형 남색 [저장하기] 버튼을 구현했습니다.

### B2B FAQ 페이지 전면 리디자인
- **가이드 매칭**: 질문 텍스트 왼쪽에 파란색 `Q` 접두사를 표시하고, 답변 영역 왼쪽에 파란색 원형 `A` 뱃지를 추가하여 텍스트와 정렬시켰습니다.
- **아코디언 개편**: 아코디언이 펼쳐질 때 배경색을 차분한 연회색(`#f8f9fa`)으로 변경하고 초록색 보더를 걷어냈습니다.

### B2B 브랜드 명칭 '부고온(Bugo On)' 전수 치환
- **브랜드 전환**: B2C(마음부고)의 명칭은 유지한 채 B2B 전용 서비스 명칭을 기존 도담부고에서 '부고온(Bugo On) / 부고온 파트너'로 전면 치환했습니다.
- **변경 범위**: 스플래시, 레이아웃, 로그인, 대시보드, 회원탈퇴, 본인인증 안내 팝업, 1:1 문의 등 B2B 앱 전반의 텍스트 및 주석을 일괄 수정 완료하였습니다.

## 2026-01-28

### 제주 '일포' 기능 완성
- **View 페이지 일포 표시**: 일포일시를 발인보다 먼저, 진하게 표시
- **발인 조건부 표시**: 일포 ON일 때 발인 연하게 표시, hide_funeral 체크 시 숨김
- **DB 스키마 추가**: `ilpo_date`, `ilpo_time`, `hide_funeral`, `applicant_phone` 컬럼

### 수정하기 기능 개선
- **버튼 텍스트 변경**: 수정 모드에서 "부고장 만들기" → "수정하기"
- **신청자 연락처 로드/저장**: `applicant_phone` 필드 DB 저장 및 수정 시 로드
- **일포 OFF 시 데이터 초기화**: 일포 토글 OFF 시 날짜/시간 자동 삭제

### 알림톡(Alimtalk) 개선
- **일포 포맷**: 일포 있을 때 알림톡에 줄바꿈 형식으로 표시
  - 일포+발인: `(일포) 2026-01-29 14:00 / (발인) 2026-01-30 10:30`
  - 일포만: `(일포) 2026-01-29 14:00`
  - 발인만: `2026-01-30 10:30` (기존 형식)
- **연락처 변경 시 알림톡**: 수정 모드에서 연락처가 변경됐을 때만 새 번호로 알림톡 발송
- **SMS 대체 발송**: 알림톡 실패 시 자동으로 SMS 발송 (`resendType: 'SMS'`)

### UI 개선
- **달력 색상 통일**: 팝업 달력의 모든 날짜(토/일 포함) 검은색으로 통일

### 성능 및 안정성 개선
- **Hydration 에러 해결**: `mounted` 상태 추가로 서버/클라이언트 렌더링 불일치 해결
- **Draft 로드 충돌 방지**: 수정 모드에서 임시저장 데이터 로드하지 않도록 수정
- **BugoData 타입 확장**: `ilpo_date`, `ilpo_time`, `hide_funeral` TypeScript 타입 추가

---

## 2026-01-18

### 화환 상품 지역별 가격 시스템 구현
- **시/도별 추가금**: 17개 지역(서울, 경기, 인천, 부산, 대구, 광주, 대전, 울산, 세종, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)별 가격 차등 설정
- **특수지역 추가금**: 산간/도서 지역(울릉군, 영월군 등) 추가금 태그 방식으로 설정
- 부고 주소 기반 자동 가격 계산 (기본가 + 시도 추가금 + 특수지역 추가금)
- 음수 값 지원 (지역별 할인 가능)

### 어드민 상품 관리 UI 개선
- **태그 기반 입력**: 노출지역, 제외지역, 제외장례식장 태그 방식 UI
- **미리보기 버튼**: 상품 상세페이지 새 탭 열기
- **Supabase Storage 이미지 업로드**: 상품 이미지 동적 업로드/삭제
- **시/도별 가격 그리드**: 17개 지역 추가금 입력 UI
- **특수지역 설정**: 지역명 + 추가금 입력 → 태그 표시

### 상품 정보 업데이트
- 기본 5개 상품 가격 정리: 소형 바구니(99,500), 기본형(109,500), 고급형(139,000), 프리미엄형(169,000), VIP용(189,000)
- 꽃 상품 DB 테이블 `regional_prices`, `special_surcharges` 컬럼 추가

### 지역 필터링 로직
- 부고 주소에서 시/도 자동 추출
- 상품별 노출/제외 지역 매칭
- 장례식장명 기반 제외 처리

---

## 2026-01-09

### 카카오 공유 링크 문제 해결
- **문제**: 카카오톡에서 공유된 링크 클릭 시 메인 페이지(`/`)로 리다이렉트 되는 현상 발생
- **원인 1**: 카카오 개발자 콘솔에서 도메인 설정 저장 누락 및 `https://maeumbugo.co.kr` (non-www) 불일치
- **원인 2**: `app/layout.tsx`에서 모든 페이지를 `MainLayout`으로 감싸고 있어, 독립적이어야 할 `view` 페이지와 레이아웃 간섭 발생
- **해결 1 (Fix)**: `app/create/complete/[bugoNumber]/page.tsx`에서 `bugoUrl` 생성 시 `https://maeumbugo.co.kr` 도메인 강제 적용
- **해결 2 (Refactor)**: `MainLayout`을 전역(`app/layout.tsx`)에서 제거하고, 검색/FAQ/가이드/Contact 등 필요한 페이지의 `layout.tsx`에만 개별 적용하여 `view` 페이지의 완전한 독립성 확보

### 2026-01-09 (오전)

### 장례가이드 페이지
- `/guide` 페이지 신규 생성
- 장례 절차, 비용, 예절, 장례식장 찾기 4가지 카드 UI
- 헤더 네비게이션에 "장례가이드" 메뉴 추가

### 공통 네비게이션 구조 개선
- `MainLayout` 컴포넌트로 헤더 통합 관리
- 홈, FAQ, Guide, Search, Create 페이지 공통 헤더 적용
- 중복 코드 제거 및 유지보수성 향상
- 모바일 `SideMenu`에 장례가이드 링크 추가

### UI 수정
- "자주묻는 질문" → "자주 묻는 질문" 띄어쓰기 수정

### 빌드 오류 수정
- `useSearchParams` Suspense boundary 오류 해결
- `useEffect` + `window.location` 방식으로 변경

### 서버 환경 복구
- npm ghosting (npm install 무한 대기) 해결
- ENOTEMPTY 오류 해결 (Finder 수동 삭제)
- Deep Purge 프로토콜 적용

---

## 2026-01-06

### 검색엔진 등록 (SEO)
- **네이버 서치어드바이저** 등록
  - HTML 메타태그 인증 완료
  - robots.txt 확인
  - 사이트맵 제출
- **구글 서치콘솔** 등록
  - DNS TXT 레코드 인증 완료
  - 사이트맵 제출

### 동적 사이트맵 구현
- `app/sitemap.ts` 동적 생성
- 정적 페이지 7개 포함
- 부고장 페이지 자동 포함 (현재 57개)
- Supabase에서 실시간 조회

### Google Analytics 4
- GA4 설정 (ID: G-6H5TT2F5RB)
- 이벤트 추적 구현:
  - `select_template`: 템플릿 선택
  - `complete_create`: 부고 생성 완료
  - `view`: 부고 조회
  - `share` (kakao/sms/link): 공유
  - `click_map`: 지도/내비
  - `copy_account`: 계좌 복사

### AI 검색 최적화 (LLM SEO)
- `llms.txt` 생성 (AI 크롤러용)
- `llms-full.txt` 상세 문서 생성
- `robots.txt` AI 봇 허용 규칙 추가
- Schema.org JSON-LD 메인 페이지에 추가

### 배포 자동화
- Vercel Production 브랜치: `main` → `nextjs`
- GitHub Default 브랜치: `main` → `nextjs`
- 이제 `git push`만으로 자동 Production 배포

### 개발/프로덕션 DB 분리
- **개발용 Supabase 프로젝트 생성** (maeumbugo-dev)
  - URL: `https://mnlyqhrjnpbkleenmszm.supabase.co`
  - Region: Seoul (ap-northeast-2)
- 테이블 스키마 복사 (bugo, drafts, facilities, guestbook, inquiries)
- 테스트 데이터 30개 생성
- `.env.local` 개발 DB 설정
  - 로컬: 개발 DB (maeumbugo-dev)
  - Production: 기존 DB (dodambugo)

### 버그 수정
- **상주 목록 중복 표시** 버그 수정
  - 대표상주가 mourners 배열에도 포함될 때 한 번만 표시되도록 수정

### 모바일 메인 UX 개선
- **플로팅 CTA 버튼** 추가 (모바일 전용)
  - 하단 고정 "부고장 만들기" 버튼
  - 하단에서 슬라이드업 애니메이션
  - 검은색 말풍선 툴팁: "링크형 부고장 무료 제작하기"
- **상단 nav-cta 숨김** (모바일에서 플로팅 버튼으로 대체)
- **검색바 입력 가능** (기존: 클릭 시 페이지 이동)
- **검색 자동완성** 기능
  - 실시간 DB 검색 (300ms 디바운스)
  - 상주 이름 매칭 우선 정렬
  - 검색어 하이라이트 (노란색)
  - 형식: `상주 김상민 (故 홍길동) | 발인 01/08`

---

## 2026-01-05

### 브랜드명 변경
- **도담부고 → 마음부고** 전체 변경
- 헤더, 푸터, 메타태그, OG 태그 등 50곳 이상 수정
- 문서 파일 (README, CHANGELOG, TODO 등) 전체 수정

### 도메인 & 카카오 설정
- 도메인 구매: maeumbugo.co.kr (가비아)
- Vercel 도메인 연결
- 카카오 새 앱 생성 (마음부고, ID: 1364022)
- 카카오 JS SDK 도메인 등록

---

## 2026-01-04

### UI/UX 개선

#### 모달 스타일 통일
- 모달 버튼 색상: 파란색 → 브랜드 컬러(#FFCC45)
- 모달 버튼 텍스트: 흰색 → 검은색(#191919)
- 임시저장 모달 문구: "임시저장된 정보" → "임시저장된 부고장"
- 개인정보 모달 "전문보기" 링크: 검은색(#191919)
- 개인정보 모달 "확인" 버튼 글씨: 검은색(#191919)

#### 모달 z-index 수정
- 모달 열렸을 때 헤더가 위에 보이는 문제 해결
- modal-overlay z-index: 99999 (인라인 스타일로 강제)
- 계좌 등록 모달, 상주별 계좌 모달, 임시저장 모달 모두 적용

#### 페이지 레이아웃 통일
- FAQ 페이지 헤더 스타일 통일 (section-header marginBottom: 16px)
- Contact 페이지 헤더 스타일 통일
- 개인정보처리방침 섹션 간격 줄임 (32px → 20px)

### 부고 검색 페이지 개선
- 제목/부제목 패딩 줄임
- 검색 버튼 아이콘만 표시 (텍스트 제거)
- 카드 레이아웃 변경:
  - 첫 줄: 부고번호 + 발인일
  - 둘째 줄: 상주 이름(故고인명)
  - 셋째 줄: 장례유형 | 장례식장
- 페이지네이션: 화살표 아이콘 + 브랜드 컬러(#FFCC45)

### OG 메타태그 개선
- 제목 형식: "故 OOO님 부고(향년 OO세)"
- 설명 형식: "장례식장 호실 | 날짜 별세하셨음을 삼가 알려드립니다."
- 이미지: 직사각형 og-bugo-v4.png

### 카카오 공유 이미지
- og-bugo-v4.png 적용 (캐시 문제 해결)

### 디자인 시스템
- 브랜드 컬러 #FFCC45 문서화

---

## 2026-01-03

### 부고 뷰 페이지
- 섹션 순서 변경
- 장례유형별 메시지 표시
- 발인 시간 포맷 개선

---

*이전 변경 내역은 Git 히스토리 참조*
