# 🔄 부고온 B2B 앱 - 마스터 작업 핸드오프 문서 (2026-07-11 최종본)

> **프로젝트**: 부고온 (마음부고) B2B 파트너 하이브리드 앱  
> **아키텍처**: Capacitor (iOS) + Next.js (Vercel 서빙)  
> **핵심 도메인**: `bugoon.maeumbugo.co.kr` (App 웹뷰 로드 주소)

---

## 📌 1. 프로젝트 및 하이브리드 앱 구조

```
/Users/el/Desktop/dodam/              ← Vercel 배포 루트
├── jojo/                             ← Next.js 앱 (메인 코드)
│   ├── app/b2b/                      ← B2B 파트너 앱 페이지들
│   ├── app/api/b2b/                  ← B2B 관련 API 라우트
│   ├── lib/push-notifications.ts     ← 클라이언트 푸시 등록 로직
│   ├── lib/fcm.ts                    ← 서버사이드 FCM v1 발송 로직
│   ├── lib/partner-notification.ts   ← 푸시 + 인앱 알림 발송 통합 프레임워크
│   ├── ios/App/App/AppDelegate.swift ← iOS 네이티브 푸시 콜백 가로채기 복구 및 FCM 토큰 주입
│   ├── ios/App/App/Info.plist        ← Firebase 스위즐링 비활성화
│   └── capacitor.config.ts           ← Capacitor 설정 (server.url: bugoon.maeumbugo.co.kr)
```

### 📱 하이브리드 앱 핵심 특징
- **Capacitor 앱**이 `https://bugoon.maeumbugo.co.kr`에서 Next.js 웹을 로드합니다.
- 네이티브(iOS) 변경이 있으면 **Xcode 빌드 및 앱 업데이트**가 필요하고, 웹/API 변경은 **Vercel 프로덕션 배포**만으로 즉시 라이브에 반영됩니다.

---

## ✅ 2. 완료된 작업 (FCM 복구 & 토큰 전송)

### 1) iOS 푸시 알림 플로우 복구
- **문제**: iOS 기기에서 푸시 토큰 등록이 되지 않고 알림 수신이 실패하던 현상.
- **조치 사항**:
  1. **토큰 리스너 Race Condition 해결**: `PushNotifications.register()`를 호출하기 전에 `addListener`들을 먼저 완벽히 바인딩하도록 수정.
  2. **AppDelegate 콜백 복구**: 네이티브 `AppDelegate.swift`에서 `didRegisterForRemoteNotificationsWithDeviceToken`을 구현해 APNs 토큰을 명시적으로 Capacitor 내부로 전달 (`NotificationCenter.post`).
  3. **FCM 토큰 강제 주입**: APNs 토큰만으로는 FCM 발송이 불가능하므로, 네이티브 앱이 최초 구동할 때 Firebase SDK에서 얻은 **FCM 토큰**을 WKWebView의 `window.__fcmToken`에 직접 평가 주입하고, JS에서 이를 꺼내 서버(`b2b_push_tokens`)에 저장하도록 구현.
  4. **Method Swizzling 충돌 방지**: `Info.plist`에 `FirebaseAppDelegateProxyEnabled = NO`를 적용해 Firebase SDK가 Capacitor의 푸시 제어권을 강제로 뺏어가는 현상 방지.

### 2) Firebase 서비스 계정 키 교체 (푸시 완전 정상화)
- **원인**: GitHub에 Firebase private key가 커밋되어 Google에 의해 강제 폐기됨 (`third-party-auth-error`).
- **조치**: 콘솔에서 새 비공개 키 JSON을 발급받아 Vercel 환경변수 `FIREBASE_SERVICE_ACCOUNT_KEY`에 대입 후 강제 배포. 실기기 푸시 전송 테스트 성공 완료! ✅

---

## 🔔 3. 푸시 & 인앱 알람 자동화 구축 완료

### 1) 자동 알림/푸시 라우팅 모듈 개발
- 파일: [lib/partner-notification.ts](file:///Users/el/Desktop/dodam/jojo/lib/partner-notification.ts)
  - `sendPartnerNotification`: DB에서 템플릿(b2b_notification_templates) 조회 및 변수 치환 후, 파트너가 설정한 채널(푸시/SMS/LMS)로 자동 전송 + 로그 기록.
  - `insertInAppAlarm`: 푸시 없이 파트너 인앱 알림함(`b2b_notifications`)에만 알림 적재. 파트너의 알림 설정 스위치가 꺼져 있으면 적재하지 않음.

### 2) 푸시 알림 대상 (4가지)
| 이벤트 | 트리거 시점 | 파일 |
|--------|-----------|------|
| 🎉 **추천인 가입** | 내 추천코드로 새 파트너 가입 완료 시 | [signup/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/signup/route.ts#L154-L163) |
| ⏰ **발인 3시간 전** | 크론(매시간)이 3시간 뒤 발인 예정인 부고 파트너 체크 | [funeral-reminder/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/cron/funeral-reminder/route.ts) |
| 💳 **정산 환급 완료** | 출금 신청 자동 이체 성공 시 | [auto-approve-withdrawals/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/cron/auto-approve-withdrawals/route.ts#L177-L186) |
| 📢 **공지사항** | 어드민에서 공지 작성 시 전체 파트너 전송 | [send-push/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/send-push/route.ts) |

### 3) 인앱 알람 대상 (8가지)
| 이벤트 | 알림 설정 컬럼 | 적재 시점 및 파일 |
|--------|--------------|------------------|
| 🤝 **가입 승인** | 없음 (항상) | 어드민 가입 승인 시 [partners/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/admin/partners/route.ts) |
| 📋 **부고 생성** | `alarm_deceased` | 파트너 고객이 새 부고 생성 시 [bugo-notify/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/bugo-notify/route.ts) |
| 🌸 **화환 주문** | `alarm_order` | 조문객이 화환 결제 완료 시 [approve/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/approve/route.ts), [webhook/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/payment/innopay/webhook/route.ts) |
| 💰 **화환 수당** | `alarm_reward` | 화환 결제(카드/가상계좌) 시 수당 적립과 함께 자동 적재 |
| ↩️ **화환 환불** | `alarm_order` | 화환 주문 취소/환불 시 [cancel/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/flower-orders/cancel/route.ts) |
| 🎉 **추천인 가입** | `alarm_referral` | signup 완료 시 푸시와 동시에 알람함 적재 |
| 💳 **정산 입금** | `alarm_deposit` | 환급 완료 시 푸시와 동시에 알람함 적재 |
| 📢 **공지사항** | `alarm_notice` | 어드민 등록 시 푸시와 동시에 알람함 적재 |

### 4) 알림함 페이지 & 읽음 API
- 파일: [notice/page.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/notice/page.tsx)
  - 타입별 이모지 및 배경색 매핑.
  - 알림 클릭 시 읽음 처리 API 호출 및 `data.url`로 자동 라우팅(해당 페이지로 이동).
- 파일: [read/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/notifications/%5Bid%5D/read/route.ts) — 읽음 처리 API 개발 완료.
- 파일: [unread-count/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/notifications/unread-count/route.ts) — 안읽은 카운트 API 개발 완료.

### 5) 대시보드 안읽은 알림 뱃지 추가
- [dashboard/page.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/dashboard/page.tsx)
  - 대시보드 상단 종 아이콘 옆에 읽지 않은 알림 개수를 빨간 동그라미 뱃지로 표시.

### 6) 발인 리마인더 중복 발송 방지
- [cron/funeral-reminder/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/cron/funeral-reminder/route.ts)
  - 발송 전 `b2b_notifications` 테이블의 `data->>'bugo_number'` 조회를 통해 이미 리마인더가 발송되었는지 체크하고, 중복 발송을 원천 차단.

### 7) 공지사항 등록 전체 파트너 자동 연동
- [notices/route.ts](file:///Users/el/Desktop/dodam/jojo/app/api/b2b/admin/notices/route.ts)
  - 어드민 공지사항 등록 시 비동기 프로세스로 전체 파트너에 대해 푸시 + 알람함 자동 전송 연동 완료.

---

## ❌ 4. 알림/푸시에서 제외된 항목 (기획 방침)
- **조의금 수당 적립**: 파트너가 수당을 취하는 구조가 노출될 수 있어 **제거**함. (푸시/알림 모두 없음)
- **조의금 입금 내역**: 위와 같은 사유로 노출하지 않음.
- **화환 배송 완료 알림**: 장례지도사(파트너)에게 배송 완료 푸시는 무의미하므로 **제거**함.
- **부고 정보 수정**: 부고가 최초 "생성"되었을 때만 알림을 남기며, "수정" 시에는 알람을 적재하지 않음.
- **답례품 주문**: B2B 파트너 연동 스펙에서 제외.

---

## 🔜 5. 다음 AI가 이어서 작업할 내용 (우선순위순)

### 1️⃣ 이벤트 혜택 알림 연동
- **내용**: 파트너 대상의 프로모션, 추가 수당 등의 이벤트 혜택 기능 개발 시 `alarm_event` 필드 및 인앱 알림함 적재 연동 필요.
