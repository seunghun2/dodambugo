# 📋 부고온 모바일 앱 출시 & B2B 정산/알림 브랜드 분리 태스크 (스킬 허브 연동)

> **상세 기획 및 연동 파일 매핑은 `.agents/skills/b2b-app-task/SKILL.md` 스킬 문서와 연동되어 작동합니다.**

---

## 1. 📱 모바일 앱 빌드 및 Native 세팅 (스플래시/푸시)
- `[ ]` **스플래시 화면(Splash Screen) 연동 및 셋업**
  - *매핑 MD*: [PROJECT_STRATEGY.md](file:///Users/el/Desktop/dodam/jojo/PROJECT_STRATEGY.md)
  - *작업 경로*: `jojo/android/app/...`, `jojo/ios/App/...` (OS별 리소스 매핑)
- `[ ]` **초기 앱 구동 로그 시스템 구축**
  - *작업 경로*: `jojo/app/api/b2b/log/route.ts`, `jojo/lib/logger.ts`
- `[ ]` **실시간 푸시 알림(Push Notification) 연동**
  - *매핑 MD*: [critical-check.md](file:///Users/el/Desktop/dodam/jojo/.agent/workflows/critical-check.md)
  - *작업 경로*: `jojo/app/api/push/route.ts`, `jojo/lib/solapi.ts` (입관 직전 / 실시간 입출금 알림)

## 2. 💸 B2B 수익 구조 및 재무 분할 정산 시스템 설계
- `[ ]` **다중 분할 정산(지도사/상조 본사/플랫폼) 구조 설계**
  - *매핑 MD*: [부의금 도입 체크리스트.md](file:///Users/el/Desktop/dodam/부의금_서비스_도입_업무체크리스트.md), [부의금 내재화 가이드.md](file:///Users/el/Desktop/dodam/부의금_서비스_내재화_가이드.md), [DAEDAESONSON_STRATEGY.md](file:///Users/el/Desktop/dodam/DAEDAESONSON_STRATEGY.md)
  - *작업 경로*: `jojo/lib/b2b.ts`, `jojo/app/api/b2b/settlement/route.ts`

## 3. 🔑 부고온(B2B) 독자 브랜드 행정 및 사업자 기획
- `[ ]` **D-U-N-S 글로벌 기업 식별 번호 발급 재신청**
  - *매핑 MD*: [DUNS_INFO.md](file:///Users/el/Desktop/dodam/jojo/docs/DUNS_INFO.md) (Case: `10564868` 영문 사업자등록증명 보완 제출)
  - *행정*: 구글 플레이 및 App Store Connect 조직 계정 인증 통과

## 💬 4. ✉️ B2C(마음부고) vs B2B(부고온) 문자/알림톡 발송 브랜드 완전 분리
- `[ ]` **명의 전수 조사 및 브랜드 분기 조건 구현**
  - *매핑 MD*: [critical-check.md](file:///Users/el/Desktop/dodam/jojo/.agent/workflows/critical-check.md)
  - *작업 경로*: `jojo/lib/solapi.ts`, `jojo/app/api/bugo/notify/route.ts`
  - *규칙*: B2C는 `"마음부고"`로 발송 강제화, B2B는 `"부고온"` 명의 발송 구현

## 🚫 5. 🛡️ B2B vs B2C 상호 영향도 격리 검증 (스킬 기반 수칙 준수)
- `[ ]` **장례 정보 조건부 노출 규칙 (`funeral-display`) 교차 검증**
  - *매핑 MD*: [AGENTS.md](file:///Users/el/Desktop/dodam/jojo/.agents/AGENTS.md), [funeral-display/SKILL.md](file:///Users/el/Desktop/dodam/jojo/.agents/skills/funeral-display/SKILL.md)
  - *작업 경로*: `jojo/lib/funeral-display.ts` (상호 코드 침범 금지 및 부작용 방지 테스트)

---

## 🛡️ 6. 🛠️ 작업자 딴생각 방지 및 Git 형상 관리 장치
- `[ ]` **Git 커밋 전 B2B/B2C 격리 상태 및 빌드 자가 검증 수칙 적용**
  - *수칙*: 커밋 전 `npm run build`를 반드시 실행하여 타입 에러를 차단합니다.
  - *수칙*: 커밋할 때마다 `git diff --name-only`를 통해 B2B와 B2C가 의도치 않게 혼재되어 수정되었는지 크로스체크합니다.
