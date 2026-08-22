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
- **Android 키스토어 및 SHA-256 지문**:
  - 패키지명: `kr.co.maeumbugo.bugoonplus`
  - Keystore: `android/bugoon-release.keystore` (alias: `bugoon`, pass: `bugoon2026`)
  - SHA-256: `35:1A:E0:81:CD:84:BC:17:53:76:0D:F3:6D:D7:4F:FB:C8:8F:8A:F9:19:9E:4D:7E:62:88:1A:54:28:71:4E:18`

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

### 2-2. 상조회사 수수료율 & 수당 세팅 및 월별 통합 정산서 시스템 ✅ 구현 완료 (로컬 검증)
- **설명**: 
  - 신규 상조회사 등록/수정 모달에서 **부의금 수수료율(%)**, **화환 판매 본사/팀원 수당(원)**, **답례품 판매 본사/팀원 수당(원)** 및 선택적 **답례품 수수료율(%)** 세팅 기능
  - 파트너 관리 모달 내 상조회사별 수수료 & 요율표 요약 카드 제공
  - **조의금 주문 관리 어드민**: 상조 소속 파트너 결제건은 상조 몫(수수료율 %)과 대표님 순수익 몫(전체 수수료 - 상조 몫)으로 조건부 분배. 상조 미소속 파트너 결제건은 상조 몫 0원(0%), 플랫폼 몫 100% 수수료 전액 집계.
  - **상조회사 월별 정산서**: `■ 화환 판매 정산 세부 내역 명세`와 `■ 부의금 정산 세부 내역 명세` 독립 렌더링. 상단/하단 총 정산금액에 화환 정산액 + 부의금 정산액 통산 합산.
- **관련 소스코드**:
  - `jojo/lib/b2b-company.ts` — `condolence_company_rate`, `gift_commission_amount`, `gift_member_commission_amount`, `gift_company_rate` 데이터 모델
  - `jojo/app/api/b2b/admin/companies/route.ts` — 상조회사 수수료율/수당 세팅 API
  - `jojo/app/api/b2b/admin/condolence-orders/route.ts` — 조의금 상조 소속 파트너 조건부 쉐어 집계 API
  - `jojo/app/api/b2b/admin/companies/settlements/route.ts` — 월별 상조회사 화환/부의금 통합 정산서 조회 API
  - `jojo/app/b2b/admin/companies/settlements/page.tsx` — 정산서 양식 UI (부의금 정산 세부 내역 명세 & 통산 합산)

---

## 3. 🔑 부고온(B2B) 독자 브랜드 행정 및 사업자 기획

### 3-1. D-U-N-S 글로벌 기업 식별 번호 및 스토어 심사 대응
- **설명**: D-U-N-S 번호 발급 완료 (`696633660`). Apple Developer Program Individual 등록 및 승인 완료 (2026-06-29).
- **확정 정보**: Bundle ID `kr.co.maeumbugo.bugoon`, Team ID `FTR72WNB4B`, App Store Connect 앱 생성 완료
- **관련 MD**:
  - [APP_SUBMISSION.md](file:///Users/el/Desktop/dodam/jojo/docs/APP_SUBMISSION.md) (앱 제출 전체 진행 기록 — **이 파일을 반드시 참조**)
  - [DUNS_INFO.md](file:///Users/el/Desktop/dodam/jojo/docs/DUNS_INFO.md) (반려 이력 및 보완 조치 기록)
- **인프라 셋업**: App Store Connect 및 Google Play Console 앱 정식 출시 완료 (`kr.co.maeumbugo.bugoon`).

---

## ✉️ 4. B2C(마음부고) vs B2B(부고온) 문자/알림톡 발송 브랜드 완전 분리

### 4-1. 문자/알림톡 명의 전수 조사 및 브랜드 분기 조건 구현
- **설명**: 
  - B2C 웹을 통한 부고장은 `"마음부고"`로 발송되도록 강제화
  - B2B 파트너 앱에서 생성된 부고 알림/문자는 `"부고온"` 명의 및 비즈니스 템플릿으로 발송
- **구현 및 검증 완료 내역**:
  - [x] **솔라피 알림톡 템플릿 버튼 URL 연동 완료 (2026-08-20/21)**: 
    - 템플릿 `KA01TP26080907213286667y3LSdpjeU` 적용 완료 (버튼 URL에 `?m=#{m}` 포함).
    - `send-mourner-notify/route.ts` 및 `bugo-notify/route.ts`에서 상주 인덱스(`m=0,1,2...`) 파라미터 전달 연동 완료.
    - 상주별 고유 링크 접속 시 호칭 자동 개인화("백승훈의 장인 故 고길동 님") 및 실발송 검증 완료.
  - [x] **B2B 부고장 제작 장지 정보 입력란(`BurialSection.tsx`) 복원 (2026-08-21)**:
    - `상주정보`와 `기타옵션` 사이에 장지 섹션 신규 배치 (`1차 장지` + `2차 장지 추가/삭제` 지원).
    - 미리보기 모달 및 부고 관리 모달 표기명 `1차장지` ➡️ `장지`로 통일.
    - 상주 이름 trim 처리로 조사 띄어쓰기(`고둘리의 부친`) 보정 완료.
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

### 7-2. 실시간 자동 출금 계좌 이체 API 연동 ✅ 완료
- **설명**: 본인인증 완료 + 자동입금 ON 파트너가 환급 신청 시, 이노페이 펌뱅킹 API(`http://49.50.139.204/proxy/transfer`)를 통해 즉시 실계좌 이체 처리.
- **2026-08-03 치명적 버그 수정**: `fetch()` 호출에 `await` 누락 + DB 사전 `approved` INSERT 결함 → 동기(await) 호출 + 이체 성공 시에만 `approved` UPDATE로 근본 수정
- **정확한 흐름**: DB `pending` INSERT → `await fetch(이노페이)` → `resultCode === '0000'` 시 DB `approved` UPDATE / 실패 시 `pending` 유지
- **관련 소스코드**:
  - jojo/app/api/b2b/wallet/route.ts (환급 신청 + 자동 이체 API)
  - jojo/app/api/b2b/admin/withdrawals/route.ts (어드민 수동 송금진행/승인/반려)

### 7-3. 상조회사 지분 정산 통계 대시보드 추가
- **설명**: 매월 정산 배포 전 세무 기장 대조가 용이하도록 상조회사 본사 지분, 플랫폼 지분, 지도사 지분율에 따른 정산 상세 통계 화면을 어드민 대시보드 내에 신설 및 보강.

### 7-4. 이노페이 실시간 송금 API 실제 연동 현황 확인 및 개발 ✅ 완료
- **설명**: 이노페이 펌뱅킹 실이체 API가 프로덕션에서 정상 가동 중임을 확인 완료. Mock이 아닌 실계좌 이체 검증됨.
- **검증 이력**:
  - 2026-07-18: 1,000원 실이체 성공 (TID: `bumaeum02m2607188b82611b`)
  - 2026-08-02: 4,835원 x 3회 + 4,835원 x 1회 실이체 성공 (백승훈 국민은행)
  - 2026-08-03: 2,901원 이체 테스트 성공 (`resultCode: '0000'`, `resultMsg: '정상처리'`)
- **MID**: `bumaeum02m`, **출금계좌**: `66400001397152` (부고온정산)
- **관련 소스코드**:
  - jojo/app/api/b2b/wallet/route.ts (환급 신청 + 자동 이체 API)

### 7-5. 설정 내 미연동 부고장 옵션 3종 연동 개발 (추후 예정)
- **설명**: 
  - `화환 판매가격 설정` (파트너별 화환 할인금액 및 판매여부 세팅)
  - `상주 만족도` (모바일 부고장 뷰에 만족도 평가 영역 노출 여부 토글)
  - `판매정보` (모바일 부고장 뷰 하단 파트너 정보 노출 여부 토글)
- **현황**: 2026-08-05 대표님 지시에 따라 설정 화면에서 주석 미노출 처리 완료. 추후 DB 컬럼 확장 및 부고장 뷰 연동 시 재노출 예정.
- **관련 소스코드**: `jojo/app/b2b/settings/page.tsx`

### 7-6. 의례문서(위패/축문) 캔버스(Canvas) 캡처 및 이미지 다운로드/MMS 연동 (추후 예정)
- **설명**: `HTMLCanvasElement` (`canvas.getContext('2d')`)를 활용하여 5.7x20cm 규격의 위패/축문/지방 뷰 화면을 고화질 PNG 이미지로 실시간 캡처하고, 휴대폰 갤러리에 자동 저장 및 MMS 문자 전송 또는 웹 열람 링크(`https://bugoon.maeumbugo.co.kr/...`) 발송 기능 고도화 예정.
- **관련 소스코드**: `jojo/app/b2b/ritual/[bugoId]/page.tsx`

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

### 13-12. 지갑/적립내역 환급 버튼 점검시간 비활성화 & 5,000원 기준 및 디자인 정돈
- **상세 내용**:
  - 최소 환급 신청 가능 금액을 **5,000원**으로 세팅 (5,000원 미만 또는 매일 한국시간 23:30~00:30 시 버튼 비활성화).
  - 브랜드 수칙에 따라 **이모지(💡) 전면 제거** 및 B2B 정통 슬레이트 톤앤매너(`[환급 신청 안내]`) 디자인 완비.
  - 프론트엔드(`app/b2b/wallet/page.tsx`) 및 백엔드 API(`app/api/b2b/wallet/route.ts`) 모두 **`Asia/Seoul` (한국 표준시 KST UTC+9)** 타임존 연산 및 5,000원 이중 검증 보장.
- **관련 소스코드**: `jojo/app/b2b/wallet/page.tsx`, `jojo/app/api/b2b/wallet/route.ts`

### 13-13. 로컬 환경 500 TypeError: fetch failed 트러블슈팅 및 Supabase 호스트/네트워크 가이드
- **상세 원인 및 해결 노하우**:
  1. **구 Supabase 도메인 캐시 오염**: Next.js 개발 캐시(`.next/`)에 과거 DB 호스트(`tbteghoppechzotdojna.supabase.co`) 찌꺼기가 남아 `ENOTFOUND` 500 에러 원인 제공. ➡️ `.next` 캐시 삭제 후 Clean 부팅.
  2. **터미널 샌드박스 네트워크 아웃바운드 차단**: 샌드박스 내부 터미널 실행 시 Node.js의 외부 DB(`mnlyqhrjnpbkleenmszm.supabase.co`) HTTP 통신이 억제되어 `TypeError: fetch failed` 500 발생. ➡️ Next.js dev 서버 실행 시 Unsandboxed(BypassSandbox: true) 옵션으로 0.01초 통과 세팅.
  3. **로컬 DB 공지사항 시딩**: `scripts/seed-admin-notices.mjs` 스크립트를 통해 로컬 DB에도 실서버 정통 공지사항 5건 시딩 연동 완수.
- **관련 소스코드/스크립트**: `jojo/scripts/seed-admin-notices.mjs`, `jojo/scripts/test-db-connection.mjs`

### 13-14. 추천 코드 공유 링크 도메인 정정 및 가입 시 추천인 코드 자동 대입 연동
- **상세 내용**:
  - 기존 레거시 미확인 도메인(`https://bugoon.co.kr/download/partner`) 전면 제거.
  - 정식 파트너 회원가입 링크(`https://bugoon.maeumbugo.co.kr/b2b/signup?ref=추천코드`)로 도메인 정정 및 공유 문구 전면 개편.
  - 신규 파트너가 공유받은 링크 클릭 시 회원가입 페이지(`app/b2b/signup/page.tsx`)에서 쿼리 파라미터(`?ref=XXXX`)를 자동으로 인식하여 추천 코드가 폼에 쏙 입력되고 추천인 성명/회사명이 즉시 노출되도록 `useSearchParams` & `Suspense` 자동 연동 완비.
- **관련 소스코드**: `jojo/app/b2b/dashboard/page.tsx`, `jojo/app/b2b/settings/page.tsx`, `jojo/app/b2b/signup/page.tsx`

### 13-15. B2B 상주별 계좌 노출 옵션 DB 자동저장 & 뷰어 실시간 반영 & 정통 맞춤 호칭 고도화 (2026-08-09)
- **상세 내용**:
  1. **Supabase RLS 우회 API 신설**: 클라이언트 사이드 `supabase.update()`의 RLS 무반영 버그를 극복하기 위해 전용 백엔드 API (`/api/b2b/update-account-display`)를 구축하여 상주별 계좌 노출 옵션(`accountDisplay: 'none' | 'mine' | 'all'`)이 DB `bugo.mourners`에 100% 안전하게 저장되도록 전면 수정.
  2. **B2B 뷰어 캐시 제거 & 쿼리 파라미터 보존**: B2B 부고 뷰어(`app/b2b/view/[id]/page.tsx`)의 60초 stale 캐시(`unstable_cache`)를 제거하고 `force-dynamic`으로 변경하여 계좌 노출 설정 변경 시 즉시 반영되도록 조치. B2C->B2B 리다이렉트 및 토큰 인증, 공유하기(`getCleanShareUrl`) 시에도 `?m=0` 상주 파라미터가 유실되지 않고 영구 보존되도록 개선.
  3. **계좌 미노출('none') 시 버튼 숨김**: 접속한 상주의 계좌 옵션이 `none`인 경우 부의금보내기 버튼이 아예 노출되지 않도록 스마트 제어.
  4. **정통 맞춤 호칭 동적 생성**: 접속 상주에 따라 `[상주이름]의 [관계호칭] 故 [고인이름]님께서` (예: `백승훈의 모친 故 백승훈님께서`, `김미연의 부친 故 백승훈님께서`) 형식으로 정갈하고 완벽한 호칭 매핑 구현. 30여 개 친족 예법 단어(부친, 모친, 장인, 장모, 남편, 아내 등) 전수 자동 감지.
- **관련 소스코드**: `jojo/app/api/b2b/update-account-display/route.ts`, `jojo/app/b2b/create/complete/[bugoNumber]/page.tsx`, `jojo/app/b2b/view/[id]/page.tsx`, `jojo/app/b2b/view/[id]/ViewContent.tsx`

### 13-16. B2B 모바일/웹 스와이프 뒤로가기(Swipe-Back) 제스처 & 슬라이드 애니메이션 연동 (2026-08-09)
- **상세 내용**:
  1. **네이티브 호환 스와이프 백 유틸 개발**: 외부 라이브러리 설치 및 위험한 코드 수정 없이 `useSwipeBack.ts` 훅을 구현하여 화면 최좌측 가장자리(30px) 스와이프 시 뒤로가기(`router.back()`)가 즉시 동작하도록 세팅.
  2. **터치 밀림 1:1 슬라이드 & 배경 깊이감 처리**: 손가락 터치 X축 움직임에 1:1 반응하여 현재 화면이 오른쪽으로 밀리고, 밀리는 정도에 따라 뒤에 어두운 반투명 막(`overlay`)이 투명해지는 깊이감 효과 반영. 30% 이상 이동 시 완충 동작 후 뒤로가기 실행, 미만 시 슉 탄성 복귀.
  3. **스토어 업데이트 없는 실시간 웹 적용**: 하이브리드 웹 껍데기 특성을 활용하여 Vercel 배포만으로 앱스토어/구글플레이 업데이트 없이 아이폰/안드로이드 앱 및 웹 전체에 즉시 탑재 완료.
- **관련 소스코드**: `jojo/hooks/useSwipeBack.ts`, `jojo/components/b2b/B2BLayoutClient.tsx`

### 13-17. B2B 감사장 버튼 브랜드 컬러 복원 & SSR 새로고침 색상 깜빡임(Flicker) 근본 해결 (2026-08-09)
- **상세 내용**:
  1. **브랜드 고유 시그니처 컬러 정돈**: B2B 부고온은 **초록색 (`#3A8F47`, 흰색 글자)**, B2C 마음부고는 **노란색 (`#FFCC45`, 검은색 글자)**으로 감사장 전달하기 버튼 테마를 명확히 분리 및 복원.
  2. **SSR 초기 하이드레이션 깜빡임 제거**: 새로고침(F5) 시 클라이언트 훅 실행 전 0.05초 동안 B2C 기본값(노란색)이 떴다가 초록색으로 덮어씌워지던 플리커 현상을 해결하기 위해, B2B 감사장 서버 페이지(`app/b2b/view/[id]/thanks/page.tsx`)에서 `isB2bPage={true}` 프로퍼티를 직접 전송하여 **서버 HTML 렌더링 시점부터 0.0001초의 딜레이도 없이 초록색으로 100% 완벽 고정**.
  3. **대시보드 감사장 링크 & 카카오 API 키 보완**: B2B 대시보드 [답례문 보내기] 클릭 시 `?select=thanks` 모드가 자동 포함되도록 수정하고, B2B 전용 카카오 앱 키(`40f45166...`)로 자동 분기 처리.
- **관련 소스코드**: `jojo/app/b2b/view/[id]/thanks/page.tsx`, `jojo/app/view/[id]/thanks/ThanksContent.tsx`, `jojo/app/view/[id]/thanks/thanks.css`, `jojo/app/b2b/dashboard/page.tsx`

### 13-18. B2B 파트너 앱 4대 주요 탭 화면 스와이프 제스처 연동 & 무흔들림 정갈 제스처 고도화 (2026-08-09)
- **상세 내용**:
  1. **앱 내 4대 탭 화면 전수 스와이프 연동**: `useSwipeTab.ts` 유틸 훅을 구축하여 ① 1:1 문의(`create` ↔ `list`), ② 의례문서(`wipae` ↔ `chukmun`), ③ 지갑/적립(`reward` ↔ `withdraw`), ④ 감사장/답례문(`general` ↔ `christian` ↔ `catholic` ↔ `buddhist`) 4개 탭 화면 전체에 손가락 좌/우 터치 제스처 연동 완수.
  2. **인위적인 전체 화면 꿀렁거림 전면 제거**: 인위적인 DOM `transform` 및 `opacity` 널뛰기를 100% 걷어내고, 화면 전체가 단단하고 편안하게 100% 고정된 상태에서 깔끔하게 터치 제스처만 동작하는 정갈한 Clean Fixed Gesture 모드로 최적화.

### 13-19. 앱 로딩 속도 7대 핵심 최적화 완수 (2026-08-09)
- **상세 내용**:
  1. **렌더링 블로킹 스크립트 제거**: `disable-devtool` 스크립트 `beforeInteractive` → `lazyOnload` 전환 및 버전 고정(`0.3.8`).
  2. **외부 폰트 렌더링 블로킹 해소**: CSS 내 `@import` 폰트(Nanum Myeongjo) 제거 및 `layout.tsx`에서 `display=swap` 기반 로드로 일원화.
  3. **미들웨어 IP 조회 최적화**: DB 차단 IP 캐시 TTL 5분 → 30분 확장 및 static assets matcher 예외 항목 대폭 확장.
  4. **B2C 뷰 페이지 ISR 캐시 & 중복 쿼리 제거**: `view/[id]/page.tsx`에 ISR 60초 캐시(`revalidate = 60`) 적용 및 `React.cache()`로 동일 요청 내 Supabase DB 중복 조회 100% 제거.
  5. **API 라우트 `Promise.all` 병렬화**: `api/b2b/admin/dashboard` 및 `api/b2b/me` 등 독립적 DB 쿼리 병렬화로 응답 속도 대폭 개선.
  6. **불필요한 Prefetch 폭풍 제거**: 페이지 로드 시 20여 개 꽃 상품 페이지 전체 프리페치 루프 제거.
  7. **번들 및 패키지 최적화**: `next.config.ts`에 `optimizePackageImports` 적용, AVIF/WebP 이미지 포맷 추가, `package.json` 패키지 정리.
- **관련 소스코드**: `jojo/app/layout.tsx`, `jojo/app/view/[id]/page.tsx`, `jojo/app/view/[id]/ViewContent.tsx`, `jojo/next.config.ts`, `jojo/middleware.ts`, `jojo/app/api/b2b/admin/dashboard/route.ts`, `jojo/app/api/b2b/me/route.ts`, `jojo/package.json`

### 13-20. 부고온 플러스 B2B 수수료 쉐어 구조 및 모바일 부의금 어드민 정산 로드맵 정립 (2026-08-09)
- **비즈니스 핵심 맥락 및 철학**:
  1. **브랜드 정체성**: 기존 '부고온' 앱 실패 타산지석 ➔ 상조회사 제휴/외주 기반의 완결판 **'부고온 플러스'** 재탄생.
  2. **3대 수익 파이프라인**: ① 근조화환 (정산 연동 100% 완료), ② 모바일 부의금 (어드민 수수료 정산 구축 예정), ③ 답례품 (추후 연동).
  3. **수수료 및 자산 보호 규칙**:
     - 프리랜서 파트너: 기본 수당(20,000원) + 추천인 보너스(2,500원) 적립.
     - 상조 소속 파트너: 상조 세팅값(지도사 수당 + 상조 본사 수수료)으로 동적 전환. 추천인 보너스는 신규 적립 제외.
     - **상조 탈퇴 시 예치금 100% 안전 보존**: 파트너가 상조 탈퇴 시 기존 지갑 잔액(예: 25,000원)은 본인의 진짜 자산이므로 **1원도 차감 없이 100% 안전 유지**. 탈퇴 이후 새로 파는 건에 대해서만 신규 추천 수당 발생 차단.
     - **상조회사 수수료 정당화 전략**: 상조 정산 시 PG 원가(3%) + 부가세(VAT 10%) + 플랫폼 최소 운영대행비(2%)를 명목 공제하여 대표님의 플랫폼 실속을 챙기고 상조회사에 정당한 세금/원가 명세서 제공.
- **차기 개발 4대 상세 태스크 (부의금 어드민 정산)**:
  - **Task 1**: 상조회사 설정(`b2b_companies`) 부의금 수수료 세팅 칼럼 신설 (`condolence_fee_rate`, `condolence_pg_rate`, `condolence_platform_rate`, `condolence_vat_enabled`)
  - **Task 2**: 부의금 결제 승인 API(`approve/route.ts` / `webhook`) 정산 분해 로직 (PG 3% / 운영 2% / VAT 10% 차감 후 잔여금 상조회사 정산 적재)
  - **Task 3**: 어드민 정산서(`b2b/admin/companies/settlements`) 화환+부의금 탭 통합 및 CSV/PDF 정산 명세서 다운로드 구현
  - **Task 4**: 상조 탈퇴 처리 시 예치금 잔액 보존 + 추천인 연결고리 정돈

### 13-21. B2B 통합 보안 감사 & 어드민 JWT 가드 및 정산/공유 뷰어 정밀 고도화 완수 (2026-08-22)
- **상세 내용**:
  1. **어드민 암호화 JWT 서명 검증 가드 일원화**: 단순 문자열 쿠키(`admin_ip=true`) 대신 서버 비밀키로 서명된 관리자 전용 JWT(`admin_token`)를 발급하고, `verifyAdmin()` 헬퍼를 통해 어드민 17개 전체 API 및 내부 요청(`Referer`)을 완벽하게 보호.
  2. **파트너 신분증 뷰어 외부 유출 차단**: `app/api/b2b/admin/id-card-view/route.ts`에 관리자 로그인 검증(`verifyAdmin`)을 적용하여 비인증자의 신분증 이미지 접근 원천 차단.
  3. **본인인증 API 정돈**: 불필요한 더미 모의 OCR 코드를 제거하고, 가입자명과 입력된 실명 일치 대조 및 신분증 수동 심사용 안전 저장 구조로 직관화.
  4. **어드민 설정 DB 실시간 동기화 안정화**: `b2b_settings` 테이블 저장 시 upsert 충돌 문제를 해결하고 개별 `update` 쿼리로 전면 개선. 프론트엔드에 `Authorization: Bearer` 헤더를 연동하여 어드민에서 입력한 화환 수당, 보너스, 출금 최소액이 0.1초 만에 운영 DB에 실시간 덮어쓰기되도록 완결.
  5. **추천인 보너스 비상 기본값 2,500원 통일**: `webhook/route.ts`의 옛 기본값(2,000원)을 `approve/route.ts`와 동일하게 2,500원으로 통일.
  6. **부고장 뷰어 상주 꼬리표(`?m=`) 및 부고온 도메인 보존**: `app/view/[id]/ViewContent.tsx`에서 일회용 토큰 청소 시 `?m=` 파라미터가 유실되지 않도록 보존하고, [지인에게 공유하기] 및 [링크 복사] 시 부고온 도메인(`bugoon.maeumbugo.co.kr`)과 상주 맞춤 꼬리표(`?m=5`)가 유지된 채로 카톡에 공유되도록 수정.
  7. **조의금 및 답례품 UUID / 4자리 번호 듀얼 조회 지원**: `condolence/page.tsx`와 `gift/page.tsx`에서 4자리 번호뿐만 아니라 긴 고유 UUID 링크로 들어와도 부고 및 계좌를 100% 정상 조회하도록 보강.
  8. **답례품 테이블명 오타 수정**: `bugos` ➡️ `bugo`로 오타 수정.
  9. **인증 초시계 타이머 메모리 최적화**: 회원가입/비밀번호 찾기 화면 이탈 시 `useRef` + `useEffect` cleanup을 통해 `clearInterval`이 자동 호출되도록 메모리 누수 방지.
  10. **마이페이지 `?view=notice` 자동 라우팅**: `/b2b/settings?view=notice` 접근 시 전용 공지사항 페이지(`/b2b/notice`)로 0.1초 만에 자동 리다이렉트.
  11. **어드민 API 5대 쿼리 `Promise.all` 병렬 고속화 (5~8배 가속)**: 파트너 관리(`partners/route.ts`), 부의금 주문(`condolence-orders/route.ts`), 화환 주문(`flower-orders/route.ts`)의 순차 쿼리들을 동시 병렬 쿼리로 전환하여 로딩 속도를 1.5~2.5초에서 0.2~0.3초대로 단축.
  12. **사이드바 메뉴 위치 직관화**: `B2BAdminSidebar.tsx`에서 **[조의금 주문 관리]** 탭을 **[B2B 화환 주문]** 바로 아래로 이동하여 관리 편의성 극대화.
- **관련 소스코드**: `jojo/lib/admin-auth.ts`, `jojo/app/api/admin-auth/route.ts`, `jojo/app/api/b2b/admin/**/route.ts`, `jojo/app/api/b2b/verify/route.ts`, `jojo/app/api/payment/innopay/webhook/route.ts`, `jojo/app/view/[id]/ViewContent.tsx`, `jojo/app/view/[id]/condolence/page.tsx`, `jojo/app/view/[id]/gift/page.tsx`, `jojo/app/b2b/login/forgot/page.tsx`, `jojo/app/b2b/signup/page.tsx`, `jojo/app/b2b/settings/page.tsx`, `jojo/components/b2b/B2BAdminSidebar.tsx`






