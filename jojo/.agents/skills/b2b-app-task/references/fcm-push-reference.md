# FCM 푸시 알림 기술 레퍼런스

> 푸시 관련 작업 시 반드시 이 문서를 참조할 것.

## 아키텍처

```
[iOS 앱 (Capacitor)]
  ├── AppDelegate.swift → FirebaseApp.configure() → FCM 토큰 획득
  ├── window.__fcmToken 으로 WebView에 주입
  └── lib/push-notifications.ts → POST /api/b2b/push-token 으로 서버 전송
        ↓
[Vercel 서버]
  ├── b2b_push_tokens 테이블에 저장 (partner_id + platform 유니크)
  └── lib/fcm.ts → sendPushToPartner() 호출 시
        ├── FIREBASE_SERVICE_ACCOUNT_KEY 환경변수 파싱 (Base64 → JSON)
        ├── Google OAuth2 액세스 토큰 수동 발급 (RS256 JWT 서명)
        └── FCM v1 REST API 직접 호출 (firebase-admin SDK 미사용!)
```

## 핵심 함수

### sendPushToPartner (lib/fcm.ts)
```typescript
export async function sendPushToPartner(
  partnerId: string,    // 수신자 partner UUID
  title: string,        // 알림 제목
  body: string,         // 알림 본문
  data?: Record<string, string>  // 커스텀 데이터 (url 등)
): Promise<{ success: number; failed: number }>
```

### sendPushToMultiple (lib/fcm.ts)
```typescript
export async function sendPushToMultiple(
  partnerIds: string[], title: string, body: string, 
  data?: Record<string, string>
): Promise<void>
```

## Firebase 인증 키 관리

### 현재 구성 (2026-07-11 확정)
- **Vercel 환경변수** `FIREBASE_SERVICE_ACCOUNT_KEY` = Base64 인코딩된 서비스 계정 JSON
- **프로젝트**: `bugoapp-23680`
- **서비스 계정**: `firebase-adminsdk-fbsvc@bugoapp-23680.iam.gserviceaccount.com`
- **키 ID**: `8749b40c42` (2026-07-11 신규 발급)

### 키 교체 절차
1. [Firebase Console](https://console.firebase.google.com) → `bugoapp-23680` → ⚙️ 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성" → JSON 다운로드
2. 터미널에서 Base64 인코딩: `cat 다운로드한파일.json | base64 | tr -d '\n' | pbcopy`
3. [Vercel 대시보드](https://vercel.com) → Settings → Environment Variables → `FIREBASE_SERVICE_ACCOUNT_KEY` 값 교체 → Save
4. Vercel Deployments → Redeploy

### ⚠️ 절대 금지
- **Firebase 서비스 계정 키 파일을 Git에 커밋하지 말 것!** (GitHub가 감지하면 Google이 키를 자동 폐기함)
- `.gitignore`에 `appleinfo/bugoapp-23680-firebase-adminsdk-*.json` 패턴 등록 완료

### 로컬 키 파일 현황
| 파일 | 용도 | 상태 |
|------|------|------|
| `service_account.json` (루트) | Google Sheets용 | ❌ Firebase 무관 |
| `appleinfo/bugoapp-23680-...-8749b40c42.json` | Firebase Admin SDK | ✅ 유효 (로컬 전용, git 추적 안 함) |
| `appleinfo/bugoapp-23680-...-0dedc521f5.json` | Firebase Admin SDK (구) | ❌ 폐기됨 |

## 주요 관련 파일
- `lib/fcm.ts` — FCM 발송 핵심 로직
- `lib/push-notifications.ts` — 클라이언트 토큰 등록
- `app/api/b2b/send-push/route.ts` — 관리자 푸시 발송 API
- `app/api/b2b/push-token/route.ts` — 토큰 등록/삭제 API

## 알려진 이슈
1. `initFirebaseAdmin()` 함수(lib/fcm.ts 20-60행)는 **데드코드** — 호출되지 않음
2. OAuth 토큰 캐싱 없음 — 매 호출마다 새 토큰 발급 (비효율)
3. APNs 토큰 폴백 시 FCM에서 실패 가능
