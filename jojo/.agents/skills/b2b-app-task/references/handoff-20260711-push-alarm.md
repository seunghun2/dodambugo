# 🔄 인수인계: 2026-07-11 푸시/알람 자동화 시스템 구축

## 📋 오늘 한 일

### 1. FCM 푸시 시스템 완전 복구
- GitHub에 커밋된 Firebase 키를 Google이 강제 폐기 → 새 키 발급(`8749b40c42`)
- Vercel 환경변수 `FIREBASE_SERVICE_ACCOUNT_KEY` 교체 + Redeploy
- 실서버 푸시 테스트 성공
- 보안 조치: `.gitignore` 등록, 구 키 삭제
- 레퍼런스: `jojo/.agents/skills/b2b-app-task/references/fcm-push-reference.md`

### 2. 알림 자동화 핵심 모듈 생성
- `lib/partner-notification.ts`
  - `sendPartnerNotification()` — 템플릿 기반 푸시+인앱 자동 발송
  - `insertInAppAlarm()` — 인앱 알림함만 적재 (푸시 없이)
  - `sendNoticeToAllPartners()` — 전체 공지 발송

### 3. DB 테이블 & 템플릿
- `b2b_notification_templates` — 8개 이벤트 템플릿 (어드민에서 문구 수정 가능)
- `b2b_notification_logs` — 발송 이력 자동 기록

### 4. 푸시 알림 — 4개 구현 완료

| 이벤트 | 파일 | 트리거 |
|--------|------|--------|
| 🎉 추천인 가입 | `app/api/b2b/signup/route.ts` | 내 코드로 가입 시 |
| ⏰ 발인 3시간 전 | `app/api/cron/funeral-reminder/route.ts` | 매시간 크론 |
| 💳 환급 완료 | `app/api/cron/auto-approve-withdrawals/route.ts` | 자동이체 성공 |
| 📢 공지사항 | `app/api/b2b/send-push/route.ts` | 어드민 발송 |

### 5. 인앱 알람 — 7개 구현 완료

| 이벤트 | 파일 | `alarm_*` 설정 |
|--------|------|---------------|
| 📋 부고 생성 | `app/api/bugo-notify/route.ts` | `alarm_deceased` |
| 🌸 화환 주문 | `app/api/payment/innopay/approve/route.ts` | `alarm_order` |
| 💰 화환 수당 적립 | 위와 같음 | `alarm_reward` |
| ↩️ 화환 환불 | `app/api/flower-orders/cancel/route.ts` | `alarm_order` |
| 🎉 추천인 가입 | signup (푸시+알람 동시) | `alarm_referral` |
| 💳 정산 입금 | auto-approve-withdrawals (푸시+알람 동시) | `alarm_deposit` |
| 📢 공지사항 | send-push (푸시+알람 동시) | `alarm_notice` |
| 🤝 가입 승인 | `app/api/b2b/admin/partners/route.ts` | 항상 |

### 6. 알림함 페이지 업그레이드
- `app/b2b/notice/page.tsx`
  - 타입별 이모지 아이콘, 클릭 시 해당 페이지로 라우팅, 읽음/안읽음 표시, 상대 시간
- `app/api/b2b/notifications/[id]/read/route.ts` — 읽음 처리 API 신규 생성

### 7. 어드민 알림 관리 페이지
- `app/b2b/admin/notification-templates/page.tsx` — 채널 토글, ON/OFF, 변수 표시
- `app/api/b2b/admin/notification-templates/route.ts` — body/channels/is_active 지원

---

## ❌ 푸시/알람에서 빠진 것 (사장님 확인 완료)
- 조의금 수당 — **없음** (사장님 요청)
- 답례품 — **없음**
- 화환 배송 완료 — **없음** (장례지도사에게 불필요)
- 부고 수정 — **없음** (생성만)
- 신규 부고 푸시 — **없음** (인앱 알람만)
- 이벤트 혜택 — 이벤트 기능 자체 미개발

---

## 🔜 다음 AI가 해야 할 일

### 우선순위 1: 가상계좌 화환 주문 인앱 알람
- **파일**: `app/api/payment/innopay/webhook/route.ts`
- **내용**: 가상계좌 입금 확인 후 화환 주문 완료 + 수당 적립 인앱 알람 적재
- `approve/route.ts`와 동일한 패턴으로 L127 근처에 `insertInAppAlarm` 호출 추가
- 현재는 카드결제만 인앱 알람이 적재되고, 가상계좌는 빠져있음

### 우선순위 2: b2b_notifications 테이블 컬럼 확인
- `body`, `type`, `data` 컬럼이 DB에 실제 존재하는지 확인 필요
- 없으면 migration 실행:
```sql
ALTER TABLE b2b_notifications 
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'notice',
  ADD COLUMN IF NOT EXISTS data JSONB;
```

### 우선순위 3: 알림함 읽지 않은 알림 뱃지
- 대시보드/하단 네비게이션에 읽지 않은 알림 개수 뱃지 표시
- `b2b_notifications`에서 `is_read = false` 카운트하여 벨 아이콘에 빨간 뱃지

### 우선순위 4: 발인 리마인더 중복 방지
- 현재 발인 리마인더 크론이 매시간 실행되는데, 같은 부고에 중복 발송 가능
- `b2b_notification_logs`에서 해당 bugo의 `funeral_reminder` 발송 이력 체크 후 스킵하는 로직 필요
- 또는 `bugo` 테이블에 `reminder_sent` boolean 컬럼 추가

### 우선순위 5: 공지사항 푸시 → sendNoticeToAllPartners 연동
- 현재 `send-push/route.ts`는 **개별 파트너** 대상으로만 동작
- 전체 파트너 대상 공지 발송 시 `sendNoticeToAllPartners()` 활용하는 어드민 UI 필요

### 참고: 파일/모듈 구조 요약
```
lib/partner-notification.ts     ← 핵심 모듈 (푸시+인앱 통합)
lib/fcm.ts                      ← FCM v1 직접 호출
lib/solapi.ts                   ← LMS/SMS/알림톡
app/b2b/notice/page.tsx         ← 알림함 UI
app/b2b/admin/notification-templates/ ← 어드민 문구 관리
app/api/cron/funeral-reminder/  ← 발인 리마인더 크론
```

### 참고: alarmMap (알림 설정 매핑)
```typescript
// lib/partner-notification.ts L134~
const alarmMap = {
  'settlement':        'alarm_deposit',
  'funeral_reminder':  'alarm_deceased',
  'notice':            'alarm_notice',
  'referral_signup':   'alarm_referral',
};
```

### 참고: 사장님 방침
- 조의금은 파트너가 수당을 먹으므로 조문객에게 금액 노출하면 안 됨
- 장례지도사에게 화환 배송 알림 불필요
- 부고 수정 알림 불필요 (생성만)
- 답례품 알림 불필요
