---
name: b2b-app-task
description: 부고온 모바일 하이브리드 앱 출시, 푸시/스플래시, B2B 다중 분할 정산 및 문자 발송 브랜드 분리 태스크 매핑 허브
---

# 📋 부고온 앱 출시 & B2B 정산/알림 브랜드 분리 태스크 매핑 허브

> **이 스킬셋은 대화방 리셋(Truncation) 시 태스크가 유실되는 것을 방지하기 위해 로컬 저장소에 영구 보존하는 스킬셋입니다.**

---

## 1. 📱 모바일 앱 빌드 및 Native 세팅 (스플래시/푸시)

### 1-1. 스플래시 화면(Splash Screen) 연동
- **설명**: 앱 기동 시 첫 인상을 결정할 부고온 로고 디자인 기반 스플래시 연동 및 테마 설정
- **관련 소스코드**: 
  - `jojo/android/app/src/main/res/` (안드로이드 리소스 에셋)
  - `jojo/ios/App/App/Assets.xcassets/` (iOS 이미지 에셋)
- **관련 MD**: 
  - [PROJECT_STRATEGY.md](file:///Users/el/Desktop/dodam/jojo/PROJECT_STRATEGY.md) (모바일 앱 배포 전략)
- **인프라 셋업**: Capacitor Asset Generator 툴을 통한 플랫폼별 이미지 자동 생성

### 1-2. 초기 앱 구동 로그 시스템 구축
- **설명**: 모바일 환경에서의 비정상 종료 및 사용자 행동 추적용 앱 로그 수집기 구현
- **관련 소스코드**: 
  - `jojo/app/api/b2b/log/route.ts` (신규 로그 수집 API)
  - `jojo/lib/logger.ts` (로그 전송 클라이언트 유틸)
- **인프라 셋업**: Vercel/Supabase 실시간 로그 테이블 연동

### 1-3. 실시간 푸시 알림(Push Notification) 연동
- **설명**: 
  - 입관 직전/24시간 전 리마인더 푸시 및 알림톡 자동 발송
  - 실시간 입금 완료 노티 (조문객 결제 완료 시 즉시 알림)
  - 실시간 출금 완료 노티 (정산금 이체 승인 시 즉시 알림)
- **관련 소스코드**:
  - `jojo/app/api/push/route.ts` (푸시 토큰 및 발송 제어 API)
  - `jojo/lib/solapi.ts` (알림톡 발송 모듈)
- **관련 MD**:
  - [critical-check.md](file:///Users/el/Desktop/dodam/jojo/.agent/workflows/critical-check.md) (알림톡/슬랙 수정 체크리스트)
- **인프라 셋업**: Firebase Cloud Messaging (FCM) API 키 및 환경변수(`FCM_SERVER_KEY`) 등록

---

## 2. 💸 B2B 수익 구조 및 재무 분할 정산 시스템 설계

### 2-1. 다중 분할 정산(지도사/상조 본사/플랫폼) 구조 설계
- **설명**: 조문객이 구매한 화환/답례품 대금에서 수수료 차감 후 재무 배분 로직 구현
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
