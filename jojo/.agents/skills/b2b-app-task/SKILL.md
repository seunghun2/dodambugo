---
name: b2b-app-task
description: 부고온 모바일 하이브리드 앱 출시, 푸시/스플래시, B2B 다중 분할 정산 및 문자 발송 브랜드 분리 태스크 매핑 허브
---

# 📋 부고온 앱 출시 & B2B 정산/알림 브랜드 분리 태스크 매핑 허브

> **이 스킬셋은 대화방 리셋(Truncation) 시 태스크가 유실되는 것을 방지하기 위해 로컬 저장소에 영구 보존하는 스킬셋입니다.**

---

## 1. 📱 모바일 앱 빌드 및 Native 세팅 (스플래시/푸시)

### 1-1. 스플래시 화면(Splash Screen) 연동 ✅ 완료
- **설명**: 앱 기동 시 첫 인상을 결정할 부고온 로고 디자인 기반 스플래시 연동 및 테마 설정
- **관련 소스코드**: 
  - `jojo/android/app/src/main/res/` (안드로이드 리소스 에셋)
  - `jojo/ios/App/App/Assets.xcassets/` (iOS 이미지 에셋)
- **관련 MD**: 
  - [PROJECT_STRATEGY.md](file:///Users/el/Desktop/dodam/jojo/PROJECT_STRATEGY.md) (모바일 앱 배포 전략)
- **인프라 셋업**: Capacitor Asset Generator 툴을 통한 플랫폼별 이미지 자동 생성

### 1-2. 초기 앱 구동 로그 시스템 구축 ⏳ 우선순위 낮음
- **설명**: 모바일 환경에서의 비정상 종료 및 사용자 행동 추적용 앱 로그 수집기 구현
- **보류 사유**: 현재 사용자 수가 적어 Vercel 서버 로그로 충분. 사용자 증가 시 도입 예정
- **관련 소스코드**: 
  - `jojo/app/api/b2b/log/route.ts` (신규 로그 수집 API)
  - `jojo/lib/logger.ts` (로그 전송 클라이언트 유틸)
- **인프라 셋업**: Vercel/Supabase 실시간 로그 테이블 연동

### 1-3. 실시간 푸시 알림(Push Notification) 연동 ✅ 완료
- **설명**: 
  - 입관 직전/24시간 전 리마인더 푸시 및 알림톡 자동 발송
  - 실시간 입금 완료 노티 (조문객 결제 완료 시 즉시 알림)
  - 실시간 출금 완료 노티 (정산금 이체 승인 시 즉시 알림)
- **구현 완료 내역**:
  - `jojo/lib/push-notifications.ts` — Capacitor 기반 FCM 토큰 등록/해제 (클라이언트)
  - `jojo/lib/push.ts` — 푸시 초기화 유틸
  - `jojo/lib/fcm.ts` — Firebase Admin SDK v14 서버사이드 발송
  - `jojo/lib/partner-notification.ts` — 이벤트 타입별 템플릿 기반 알림 발송 (푸시 + 앱 수신함 + 알림톡)
  - `jojo/app/api/b2b/push-token/route.ts` — FCM 토큰 등록/삭제 API
  - `jojo/app/api/b2b/send-push/route.ts` — 관리자 푸시 발송 API
  - `jojo/app/api/cron/funeral-reminder/route.ts` — 발인 3시간 전 자동 리마인더 크론
- **인프라 완료**:
  - Firebase 프로젝트 `bugoapp-23680` 설정 완료
  - `GoogleService-Info.plist` (iOS) / `google-services.json` (Android) 배치 완료
  - APNs 인증 키 (`AuthKey_Q34SS2799R.p8`) Firebase Console 업로드 완료
  - Vercel 환경변수 `FIREBASE_SERVICE_ACCOUNT_KEY` 프로덕션 등록 완료
  - Supabase `b2b_push_tokens` 테이블 생성 완료
  - Supabase `b2b_notification_templates` 이벤트별 템플릿 테이블 운용 중
- **실기기 검증**: 2026-07-15 발인 임박 리마인더 실수신 확인, 2026-07-18 전수 테스트 완료
- **⚠️ 운영 핵심 메모 (AI 에이전트 필독)**:
  - `FIREBASE_SERVICE_ACCOUNT_KEY`는 **Vercel 프로덕션에만** 존재. `vercel env pull`로도 `[SENSITIVE]` 마스킹되어 로컬에서 가져올 수 없음
  - **로컬에서 FCM 푸시 테스트 불가** → 반드시 프로덕션 배포 후 API 호출로 테스트해야 함
  - `fcm.ts`는 **firebase-admin 라이브러리를 사용하지 않음** → Google OAuth JWT + FCM REST API 직접 호출 방식 (`getFcmAccessToken` → `fetch fcm.googleapis.com`)
  - firebase-admin은 Vercel 서버리스 환경에서 `third-party-auth-error` 호환성 버그가 있어 직접 API 방식으로 전환한 것임
  - 테스트 방법: 임시 API 배포(`/api/test-push`) → 프로덕션 호출 → 결과 확인 → 임시 API 삭제

---

## 2. 💸 B2B 수익 구조 및 재무 분할 정산 시스템 설계

### 2-1. 다중 분할 정산(지도사/상조 본사/플랫폼) 구조 설계 ✅ 완료
- **설명**: 조문객이 구매한 화환/답례품 대금에서 수수료 차감 후 재무 배분 로직 구현
- **구현 완료 내역**:
  - 화환 판매 → 파트너 예치금 자동 적립 (approve/route.ts)
  - 조의금 결제 → 파트너 수당 자동 적립 (approve/route.ts)
  - 추천인 보너스 자동 적립 — **상조 소속이면 스킵** (approve/route.ts)
  - 상조회사 대금 정산 테이블 `b2b_company_settlements` 및 어드민 API
  - 3.3% 원천징수(소득세 3% + 지방소득세 0.3%) 자동 차감 (wallet/route.ts)
  - 이노페이 실이체 검증 완료 (1,000원 실테스트 성공, TID: bumaeum02m2607188b82611b)
  - **추천인 보너스 실테스트 완료** (2026-07-26): 파트너 수당 +20,000원, 추천인 보너스 +2,000원 적립 확인
- **현재 기본 금액 (TODO: 최종 확정 필요)**:
  - 파트너 수당: 20,000원 (`b2b_settings.wreath_reward_amount`)
  - 추천인 보너스: 2,500원 (`b2b_settings.referral_bonus_amount`)
  - 상조회사 수수료: 20,000원 (`b2b_companies.wreath_commission_amount`)
- **2026-07-26 버그 수정**:
  - 추천인 보너스 변수 스코프 버그 (partnerUser try 블록 밖 참조)
  - 정산 대기/누적적립금: 취소(reward_cancel) 미반영 → 반영으로 수정
  - 어드민 취소 주문: 수당/보너스 '취소' 표시 + CSV 0원 출력
- **관련 소스코드**:
  - `jojo/lib/b2b.ts` (B2B 파트너 정산 연동 로직)
  - `jojo/app/api/b2b/settlement/route.ts` (정산 계산 및 이체 트리거 API)
- **관련 MD**:
  - [부의금_서비스_도입_업무체크리스트.md](file:///Users/el/Desktop/dodam/부의금_서비스_도입_업무체크리스트.md) (정산 방식 및 MID 자산 목록)
  - [부의금_서비스_내재화_가이드.md](file:///Users/el/Desktop/dodam/부의금_서비스_내재화_가이드.md) (실시간 송금 API 가이드)
  - [DAEDAESONSON_STRATEGY.md](file:///Users/el/Desktop/dodam/DAEDAESONSON_STRATEGY.md) (상조사 B2B 마진 정산 구조)
- **인프라 셋업**: 이노페이 송금 API 연동 및 환경변수(`INNOPAY_LICENSE_KEY`) 등록

---

## 3. 🔑 부고온(B2B) 독자 브랜드 행정 및 사업자 기획

### 3-1. D-U-N-S 글로벌 기업 식별 번호 및 스토어 심사 대응
- **설명**: D-U-N-S 번호 발급 완료 (`696633660`). Apple Developer Program Individual 등록 및 승인 완료 (2026-06-29).
- **확정 정보**: Bundle ID `kr.co.maeumbugo.bugoon`, Team ID `FTR72WNB4B`, App Store Connect 앱 생성 완료
- **관련 MD**:
  - [APP_SUBMISSION.md](file:///Users/el/Desktop/dodam/jojo/docs/APP_SUBMISSION.md) (앱 제출 전체 진행 기록 — **이 파일을 반드시 참조**)
  - [DUNS_INFO.md](file:///Users/el/Desktop/dodam/jojo/docs/DUNS_INFO.md) (반려 이력 및 보완 조치 기록)
- **인프라 셋업**: App Store Connect 앱 등록 완료, Google Play Console 등록 대기 중

---

## ✉️ 4. B2C(마음부고) vs B2B(부고온) 문자/알림톡 발송 브랜드 완전 분리

### 4-1. 문자/알림톡 명의 전수 조사 및 브랜드 분기 조건 구현
- **설명**: 
  - B2C 웹을 통한 부고장은 `"마음부고"`로 발송되도록 강제화
  - B2B 파트너 앱에서 생성된 부고 알림/문자는 `"부고온"` 명의 및 비즈니스 템플릿으로 발송
- **대기 중인 태스크 (검수 완료 후 진행)**:
  - [ ] **부고온 알림톡 자체 검수 및 승인 완료 시 적용**: 등록한 부고온 알림톡 10개 템플릿의 검수가 승인되면, 솔라피에서 발급된 각 `templateId`로 코드를 매칭하고, 버튼 링크 및 대체 문자 주소 도메인을 `bugoon.maeumbugo.co.kr`로 전수 수정 및 실발송 테스트 진행
- **관련 소스코드**:
  - `jojo/lib/solapi.ts` (발송 명의 분기 로직 탑재)
  - `jojo/app/api/bugo/notify/route.ts` (발송 주체 구분을 위한 `brand` 또는 `source` 구분값 추가)
- **관련 MD**:
  - [critical-check.md](file:///Users/el/Desktop/dodam/jojo/.agent/workflows/critical-check.md) (알림톡 템플릿 ID 수칙)

---

## 🚫 5. B2B vs B2C 상호 영향도 격리 검증

### 5-1. 소스코드 침범 및 사이드 이펙트 방지
- **설명**: 커밋 시 B2B(`app/b2b`)와 B2C(`app/view`)는 서로의 소스코드를 절대로 건드리지 않아야 함
- **관련 소스코드**:
  - `jojo/lib/funeral-display.ts` (공통 분기 함수)
- **관련 MD**:
  - [AGENTS.md](file:///Users/el/Desktop/dodam/jojo/.agents/AGENTS.md) (B2C/B2B 분리 규칙)
  - [funeral-display/SKILL.md](file:///Users/el/Desktop/dodam/jojo/.agents/skills/funeral-display/SKILL.md) (조건부 표시 룰)

---

## ⚙️ 6. 📱 모바일 앱 전용 고도화 및 세부 에러 해결 (추가 요건)

### 6-1. 마음부고 & 도담부고 B2B 주소 링크 점검
- **설명**: B2B 파트너 웹/앱 내에서 B2C 웹 연결 시 마음부고(`maeumbugo.co.kr`) 및 도담부고(`dodambugo.com`) 주소 링크가 정상 맵핑되도록 점검.

### 6-2. 설정 내 프로필 이미지 등록 오류 수정
- **설명**: B2B 파트너 설정 화면에서 프로필 이미지가 등록 및 업로드 완료되지 않는 현상 긴급 디버깅 및 보정.

### 6-3. 간편비밀번호 기능 구축
- **설명**: 결제/출금 신청 및 2차 검증을 빠르게 통과하기 위한 6자리 간편비밀번호 등록 및 인증 인터페이스 개발.

### 6-4. 얼굴인증 (Face ID) 등록 기능 연동
- **설명**: 생체 인증 API 및 플러그인을 활용하여 Face ID를 통한 빠른 로그인/승인 기능 설계 및 구현.

---

## 🚀 7. 차기 핵심 고도화 로드맵 (세무 보안 및 자동 정산화)

### 7-1. 주민등록번호 뒷자리 양방향 암호화 처리
- **설명**: B2B 파트너 실명/본인인증 시 수취한 주민등록번호 뒷자리(rrn_back)가 DB에 평문으로 적재되는 보안 문제를 해결하기 위해 대칭키 암호화(AES 등) 로직을 API 및 DB 단에 적용하여 개인정보보호법 가이드라인 준수.
- **관련 소스코드**:
  - jojo/app/api/b2b/verify/route.ts (본인인증 저장 API)
  - jojo/app/b2b/admin/partners/page.tsx (어드민 내 해독 및 다운로드 영역)

### 7-2. 실시간 자동 출금 계좌 이체 API 연동
- **설명**: 본인인증 성공 및 24시간 에스크로 대기 해제된 잔액을 출금 신청할 때, 금융결제원 펌뱅킹 망이나 토스페이먼츠 송금 API 등을 연동하여 수동 이체 과정 없이 신청 즉시 지정 계좌로 자동 송금 처리.
- **관련 소스코드**:
  - jojo/app/api/b2b/withdrawals/route.ts (출금 신청 API)

### 7-3. 상조회사 지분 정산 통계 대시보드 추가
- **설명**: 매월 정산 배포 전 세무 기장 대조가 용이하도록 상조회사 본사 지분, 플랫폼 지분, 지도사 지분율에 따른 정산 상세 통계 화면을 어드민 대시보드 내에 신설 및 보강.

### 7-4. 이노페이 실시간 송금 API 실제 연동 현황 확인 및 개발 (검증 필요 사항)
- **설명**: 현재 코드베이스 내에 이노페이(Innopay) 실시간 송금(펌뱅킹) API 연동이 실제 가동되도록 완전 구현되어 있는지, 혹은 모의(Mock) 상태인지 분석하여, 즉시 실이체가 가능하도록 최종 점검 및 개발 완료할 것.
- **관련 소스코드**:
  - jojo/app/api/b2b/withdrawals/route.ts (출금 신청 API)

---

## 📑 8. 부가세 정산 정리 (세무사 제출용)

### 8-1. 2026년 상반기 (Q1+Q2) 정산 정리 완료 (2026-07-17)
- **설명**: 이노페이 PG에서 다운받은 정산/송금 원본 4개 파일을 분석하여, 화환/부의금 결제내역과 부의금 송금 대조표를 세무사 제출용 엑셀로 정리 완료
- **산출물 위치**: `jojo/memo/2026_상반기_부가세_세무사제출용/`
  - `01)마음부고_화환_부의금_결제내역.xlsx` (화환 133건 / 부의금 201건)
  - `02)마음부고_부의금_송금_대조.xlsx` (결제 199건 / 이체 200건 / 대조 102명)
- **관련 MD**:
  - [부가세_정산_정리_기록.md](file:///Users/el/Desktop/dodam/jojo/docs/부가세_정산_정리_기록.md) (데이터 처리 규칙, 수수료 구조, 대조 결과 상세)
- **다음 분기 작업 시 참고사항**:
  - 원본 파일은 이노페이에서 HTML 형식 .xls로 다운로드됨 (xlrd가 아닌 HTML 파서로 파싱 필요)
  - 부의금 수수료: 실부의금 x 1.086 = PG 결제액 (8.6% 플랫폼 수수료)
  - 테스트 건(test/테스트/홍길동/조문객테스트/피추천인) 반드시 제외
  - 취소건은 원거래 + 마이너스 쌍으로 존재하여 자동 상쇄

---

## 📑 9. 부고온플러스 알림톡 B2B/B2C 브랜드 분리 연동 완료 (2026-07-17)

### 9-1. 알림톡 브랜드 분기 및 전수 수정 완료
- **설명**: `b2b_user_id`의 존재 여부를 판별하여 발신 프로필 키(pfId)를 마음부고(`B2C`)와 부고온플러스(`B2B`)로 자동 분기하도록 조치 완료. B2B 10개 템플릿의 일대일 매핑 테이블 `B2B_TEMPLATE_MAP`을 작성하여 실발송에 적용함.
- **수정된 API 및 파일**:
  - [solapi.ts](file:///Users/el/Desktop/dodam/jojo/lib/solapi.ts) (템플릿 맵 탑재 및 발송 분기 구현)
  - [bugo-notify/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/bugo-notify/route.ts) (B2B/B2C 분기 전송)
  - [bugo-notify-additional/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/bugo-notify-additional/route.ts) (추가상주 분기 전송)
  - [approve/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/approve/route.ts) (결제승인 및 이체 완료)
  - [webhook/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/webhook/route.ts) (가상계좌 입금 통지)
  - [delivery-notify/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/flower-orders/delivery-notify/route.ts) (배송안내 및 배송완료)
  - [cancel/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/flower-orders/cancel/route.ts) (화환 주문취소)
  - [thanks-notify/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/thanks-notify/route.ts) (수동 감사장 발송)
  - [Cron Jobs](file:///Users/el/Desktop/dodam/jojo/app/api/cron/) (thanks-notify, reminders, burial-review-notify, draft-reminder, share-reminder)
- **테스트 및 검증**:
  - [test-b2b-alimtalk.ts](file:///Users/el/Desktop/dodam/jojo/scripts/test-b2b-alimtalk.ts)를 작성하여 10개 템플릿의 전수 발송 실테스트를 돌려 10건 모두 솔라피 게이트웨이에 정상 접수(`statusCode: 2000`)됨을 확인.
  - `npm run build`를 구동하여 컴파일 오류 및 Next.js 정적 빌드가 에러 없이 완료됨을 전수 QA 완료.

---

## 📑 10. B2B 공유 URL 전수 수정 및 알림톡 링크 실테스트 완료 (2026-07-18)

### 10-1. 공유 URL `/b2b/view/` → `/view/` 전수 수정
- **설명**: B2B에서 카카오/SMS/밴드/링크복사로 공유할 때 URL이 `bugoon.maeumbugo.co.kr/view/{번호}` 형태로 나가도록 4곳 전수 수정
- **수정된 파일**:
  - [ViewContent.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/view/%5Bid%5D/ViewContent.tsx) (`getCleanShareUrl()` 함수 + SMS 공유)
  - [create/complete/page.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/create/complete/%5BbugoNumber%5D/page.tsx) (부고 생성 완료 링크 복사)
  - [send-mourner-notify/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/send-mourner-notify/route.ts) (상주 SMS/알림톡 URL)

### 10-2. 알림톡 버튼 링크 실테스트 완료
- **설명**: 실제 부고 7799(백승훈)로 알림톡 발송 후 버튼 클릭 → `bugoon.maeumbugo.co.kr/view/7799` 정상 접속 확인
- **테스트 스크립트**: [test-b2b-alimtalk-real.ts](file:///Users/el/Desktop/dodam/jojo/scripts/test-b2b-alimtalk-real.ts)

---

## 📑 11. 이노페이 자동 출금 이체 실검증 완료 (2026-07-18)

### 11-1. 이노페이 실이체 테스트 성공
- **설명**: B2B 자동 출금 시스템의 이노페이 송금 API가 정상 작동하는지 실계좌로 실이체 검증
- **결과**: 백승훈 국민은행 계좌로 1,000원 실이체 성공 (TID: `bumaeum02m2607188b82611b`)
- **확인 사항**:
  - 3.3% 원천징수 (소득세 3% + 지방소득세 0.3%) 자동 차감 로직 정상
  - MID: `bumaeum02m`, 출금계좌: `66400001397152` (부고온정산)
  - [withdrawals/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/admin/withdrawals/route.ts) (출금 승인 + 이노페이 송금 API 호출)

---

## 📑 12. B2B 슬랙 알림 연동 — 코드 구현 완료, 추후 활성화 예정 (2026-07-18)

> ⚠️ **슬랙 채널이 아직 생성되지 않았으므로 실발송은 불가합니다. 채널 생성 + 웹훅 URL 등록 후 활성화 예정.**

### 12-1. 구현 완료 내역 (코드만 심어둠, 실동작 X)
- **`jojo/lib/slack.ts`**: B2B 출금 3종 알림 함수 추가 + 화환/부의금 함수에 `isB2B` 분기 지원
  - `sendB2BWithdrawalRequestNotification` — 출금 신청 시 알림
  - `sendB2BWithdrawalApproveNotification` — 출금 승인 시 알림
  - `sendB2BWithdrawalRejectNotification` — 출금 반려 시 알림
  - `sendFlowerOrderNotification(data, isB2B)` — B2B일 때 `[부고온]` 접두사
  - `sendCondolenceNotification(data, isB2B)` — B2B일 때 `[부고온]` 접두사

### 12-2. API 호출부 연동 완료 파일 목록
| 파일 | 연동 내용 |
|------|-----------|
| [wallet/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/wallet/route.ts) | 출금 신청 성공 시 `sendB2BWithdrawalRequestNotification` 호출 |
| [admin/withdrawals/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/admin/withdrawals/route.ts) | 승인/반려 시 각각 슬랙 알림 호출 |
| [approve/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/approve/route.ts) | 화환·부의금 결제 시 `isB2B` 인자 전달 |
| [webhook/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/webhook/route.ts) | 가상계좌 입금 시 `isB2B` 인자 전달 |

### 12-3. 추후 해야 할 일 (채널 생성 후)
- [ ] 슬랙 워크스페이스에 `#부고온-알림` 채널 생성
- [ ] 슬랙 앱 → Incoming Webhooks → 웹훅 URL 발급
- [ ] Vercel 환경변수에 `SLACK_B2B_WEBHOOK_URL` 등록
- [ ] 실발송 테스트 (출금 신청 → 승인 → 슬랙 메시지 수신 확인)

---

## 📑 13. B2B 파트너 약관/보안/프로필/비밀번호/부고복제 고도화 (2026-08-01)

### 13-1. B2B 파트너 이용약관 및 개인정보처리방침 표준법 개정 고도화
- **상세 내용**: 대한민국 표준 법률 조항(소득세법 제127조 3.3% 원천징수, 개인정보보호법 제24조의2, 전자상거래법 5년 보존, 허위부고/어뷰징 환수 및 민형사 책임 조항 등)을 반영하여 전문성 높은 약관으로 100% 개정 완료.
- **관련 소스코드**: `jojo/app/b2b/terms/page.tsx`, `jojo/app/b2b/privacy/page.tsx`

### 13-2. 비밀번호 찾기 & 변경 2중 검증 및 보안 강화
- **상세 내용**: 
  - 비밀번호 찾기 시 이름(본인명)+휴대폰 번호 2중 대조 검증 후 SMS 인증번호 발송.
  - 인증번호 3분 타이머 및 [인증번호 재전송] 수동 리셋 구현.
  - 비밀번호 변경 모달 팝업 내 [기존 비밀번호] 입력 필드 추가 및 백엔드(`bcrypt.compare`) 대조 검증 연동.
- **관련 소스코드**: `jojo/app/b2b/login/forgot/page.tsx`, `jojo/app/api/b2b/reset-password/route.ts`, `jojo/app/b2b/settings/page.tsx`

### 13-3. 직관적인 4자리 숫자 추천코드 체계 교체
- **상세 내용**: 
  - 기존 영문/숫자 혼용 8자리 추천코드(`6MJUWN7D` 등)에서 기억하기 쉬운 **숫자 4자리**(예: 1000~9999)로 생성/발급 체계 교체.
  - 회원가입 5단계 숫자 키패드 지원 및 기존 유저 접속 시 4자리 숫자로 자동 마이그레이션.
- **관련 소스코드**: `jojo/app/api/b2b/signup/route.ts`, `jojo/app/api/b2b/me/route.ts`, `jojo/app/b2b/signup/page.tsx`

### 13-4. 소속 상조회사 관리 (소속 해제 / 탈퇴) UX 개선
- **상세 내용**: 소속 라인에서 [탈퇴하기] 버튼을 메인 액션으로 지원하고, 회색 톤(`detailActionBtn`)으로 통일.
- **관련 소스코드**: `jojo/app/b2b/settings/page.tsx`, `jojo/app/api/b2b/companies/route.ts`

### 13-5. B2B 전용 부고장 복제 백엔드 API 신규 구축
- **상세 내용**: 
  - 클라이언트 direct insert 시 RLS 보안 차단 및 컬럼 불일치로 발생하던 복제 실패 오류 해결.
  - Supabase `SERVICE_ROLE_KEY`를 사용하는 전용 백엔드 API `/api/b2b/bugo/duplicate` 신규 구축 및 연동.
  - 부고 복제 시 고인 성함 뒤 `(복제)` 접미사가 붙지 않고 원본 그대로 정중하게 복제되도록 보완.
- **관련 소스코드**: `jojo/app/api/b2b/bugo/duplicate/route.ts`, `jojo/app/b2b/manage/page.tsx`

### 13-6. B2B 부고장 상세 확인 및 미리보기 모달 UX 고도화
- **상세 내용**:
  - 부고장 상세 확인 모달(`styles.modalTable`)에서 B2B 단일 테마 정책에 맞게 불필요한 `부고장테마` 항목 제거.
  - 미입력 데이터 경고 아이콘(`!`)을 제거하고 톤다운된 슬레이트 쿨그레이(`#94a3b8`) 색상으로 정돈.
  - 부고장 완성/발송 화면(`app/b2b/create/complete/[bugoNumber]`)의 `[부고장 미리보기]` 클릭 시 외부 탭 대신 **아래에서 위로 올라오는 94vh 바텀시트 슬라이드 모달(`slideUp`)**로 화면 내부 렌더링.
  - 상단 헤더 버튼을 `< 수정하기` 버튼으로 명시하고 클릭 시 해당 부고 수정 화면으로 연동, 하단 버튼은 `[홈으로]` 대시보드 이동으로 정돈.
- **관련 소스코드**: `jojo/app/b2b/manage/page.tsx`, `jojo/app/b2b/create/page.tsx`, `jojo/app/b2b/create/complete/[bugoNumber]/page.tsx`, `complete.module.css`

### 13-7. 부고 발송 대상 연락처 존재하는 상주 자동 필터링
- **상세 내용**:
  - 부고장 발송 설정 테이블에서 연락처(`contact`)가 실제로 입력된 상주만 발송 대상 목록에 선택/노출되도록 세팅.
- **관련 소스코드**: `jojo/app/b2b/create/complete/[bugoNumber]/page.tsx`

### 13-8. 앱 아이콘 푸시 뱃지(빨간 🔴 1) 자동 클리어 처리
- **상세 내용**:
  - 푸시 알림 수신 후 홈 화면 앱 아이콘에 남아있던 빨간 뱃지 카운터(`PushNotification Delivered Badge`)를 앱 기동 및 알림/대시보드 진입 시 자동 `0`으로 클리어(`clearAppBadge()`)되도록 처리.
  - iOS Native 수준(`ios/App/App/AppDelegate.swift`)에서 `applicationDidBecomeActive` 및 `applicationWillEnterForeground` 수명주기 진입 시 `UIApplication.shared.applicationIconBadgeNumber = 0` 및 `UNUserNotificationCenter.current().removeAllDeliveredNotifications()` 강제 실행.
- **관련 소스코드**: `jojo/ios/App/App/AppDelegate.swift`, `jojo/lib/push-notifications.ts`, `jojo/app/b2b/dashboard/page.tsx`, `jojo/app/b2b/notifications/page.tsx`

### 13-9. B2B 알림 60일 보존 & 최초 30개 무한 스크롤(Infinite Scroll) 연동
- **상세 내용**:
  - 알림 수신함 조회 시 최근 `60일 이내` 알림만 조회(`created_at >= 60일 전`)하여 무거운 데이터 누적 및 조회 지연 방지.
  - 프론트엔드/백엔드 페이징(`page`, `limit=30`, `range`) 연동으로 최초 30개 노출 후 스크롤 하단 도달 시 30개씩 스르륵 추가 로딩되는 무한 스크롤 연동.
  - 무한 스크롤 로딩 시 중복 데이터 ID 필터링 및 React 고유 Key 조합(`${item.id}-${index}`)으로 중복 Key 오버레이 경고 에러 수정.
  - DB 시딩 스크립트(`scripts/seed-notifications.mjs`)를 통한 백승훈 대표님 및 전체 파트너 계정 100개 알림 시딩 연동.
- **관련 소스코드**: `jojo/app/api/b2b/notifications/route.ts`, `jojo/app/b2b/notifications/page.tsx`, `jojo/scripts/seed-notifications.mjs`

### 13-10. 어드민 공지사항 에디터 글자색 가시성 명확화
- **상세 내용**:
  - 어드민 공지사항 리치 텍스트 에디터(`contenteditable`) 글자색이 흐릿했던 문제 수정 (`color: #0f172a !important`, `fontSize: 15px`, `lineHeight: 1.6`).
  - 타이핑 시 눈이 편안하고 가시성이 뛰어난 선명한 슬레이트 블랙 톤 적용.
- **관련 소스코드**: `jojo/app/b2b/admin/notices/page.tsx`, `jojo/app/b2b/admin/notices/notices.module.css`

### 13-11. 정통 공지사항 5종 실서버 DB 직접 연동 및 쿼리 스키마 보완
- **상세 내용**:
  - 실서버 DB 스키마(`created_at`) 기준 쿼리 보완 및 캐싱 무효화(`export const dynamic = 'force-dynamic'`, `export const revalidate = 0`) 적용.
  - 실서버 API 스크립트(`scripts/post-to-production-notices.mjs`)를 통해 실서버(`bugoon.maeumbugo.co.kr`)에 공식 공지 5종 정식 등록 완수.
  - 파트너 추천인 공지 문구 정돈: **"상조회사 소속으로 회원가입을 하시는 경우에는 상조 본사의 정산 방침이 우선 적용되며, 이에 따라 개인 추천 적립금은 별도로 중복 지급되지 않는 점 너른 양해 부탁드립니다."** 정중 어조 반영.
- **관련 소스코드**: `jojo/app/api/b2b/admin/notices/route.ts`, `jojo/app/api/b2b/notices/route.ts`, `jojo/scripts/post-to-production-notices.mjs`, `jojo/scripts/seed-admin-notices.mjs`

### 13-12. 지갑/적립내역 환급 버튼 점검시간 비활성화 & KST 100% 보장 타임존 연산
- **상세 내용**:
  - 프론트엔드(`app/b2b/wallet/page.tsx`) 및 백엔드 API(`app/api/b2b/wallet/route.ts`) 모두 **`Asia/Seoul` (한국 표준시 KST UTC+9)** 타임존 연산을 100% 보장 적용.
  - Vercel 서버의 해외 UTC 타임존 환경이나 사용자의 접속 위치와 무관하게 **한국 시각 기준 매일 23:30 ~ 00:30**에 `[환급신청]` 버튼 비활성화(회색 쿨그레이 `#CBD5E1` & `not-allowed`) 및 팝업/API 이중 차단 연동.
  - 환급 카드 하단에 10,000원 최소 금액, 한국시간 기준 점검시간, 3.3% 원천징수 공제 안내 박스 렌더링.
- **관련 소스코드**: `jojo/app/b2b/wallet/page.tsx`, `jojo/app/api/b2b/wallet/route.ts`

### 13-13. 로컬 환경 500 TypeError: fetch failed 트러블슈팅 및 Supabase 호스트/네트워크 가이드
- **상세 원인 및 해결 노하우**:
  1. **구 Supabase 도메인 캐시 오염**: Next.js 개발 캐시(`.next/`)에 과거 DB 호스트(`tbteghoppechzotdojna.supabase.co`) 찌꺼기가 남아 `ENOTFOUND` 500 에러 원인 제공. ➡️ `.next` 캐시 삭제 후 Clean 부팅.
  2. **터미널 샌드박스 네트워크 아웃바운드 차단**: 샌드박스 내부 터미널 실행 시 Node.js의 외부 DB(`mnlyqhrjnpbkleenmszm.supabase.co`) HTTP 통신이 억제되어 `TypeError: fetch failed` 500 발생. ➡️ Next.js dev 서버 실행 시 Unsandboxed(BypassSandbox: true) 옵션으로 0.01초 통과 세팅.
  3. **로컬 DB 공지사항 시딩**: `scripts/seed-admin-notices.mjs` 스크립트를 통해 로컬 DB에도 실서버 정통 공지사항 5건 시딩 연동 완수.
- **관련 소스코드/스크립트**: `jojo/scripts/seed-admin-notices.mjs`, `jojo/scripts/test-db-connection.mjs`
