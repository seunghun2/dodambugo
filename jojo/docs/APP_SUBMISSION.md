# 🚀 부고온 앱스토어 제출 진행 기록

> **최종 업데이트:** 2026-07-01

---

## 📌 확정된 앱 정보

| 항목 | 값 |
|------|-----|
| 앱 이름 | 부고온 (bugoon) |
| Bundle ID (iOS) | `kr.co.maeumbugo.bugoon` |
| Package Name (Android) | `kr.co.maeumbugo.bugoon` |
| SKU | `bugoon-partner` |
| DUNS 번호 | `696633660` |
| 회사명 (D&B) | maeumbugo |
| 법인 형태 | 개인사업자 (Proprietorship → Individual 등록) |
| Capacitor 서버 URL | `https://bugoon.maeumbugo.co.kr` |

---

## ✅ 완료된 작업

### Apple (iOS)
- [x] D-U-N-S 번호 발급 완료 (`696633660`, Case #34632123)
- [x] Apple Developer Program 결제 ($99, 2026-06-25)
- [x] Apple Developer Program 승인 완료 (2026-06-29)
- [x] App Store Connect 접근 권한 부여 (2026-06-29)
- [x] App ID 등록 완료 (`kr.co.maeumbugo.bugoon`, Push Notifications 활성화)
- [x] App Store Connect에서 신규 앱 생성 (부고온)
- [x] `capacitor.config.ts` Bundle ID 업데이트

### Android
- [x] Google Play Console 개발자 등록 ($25 일회성)
- [x] Java JDK 설치
- [x] Android SDK 설치
- [x] Capacitor sync
- [x] 서명 키(keystore) 생성
- [x] AAB 빌드
- [x] Google Play Console 앱 등록 및 업로드
- [x] 개인정보처리방침 및 광고 ID 선언 완료
- [x] 구글 플레이 심사 제출 완료 (2026-07-03)

---

## 💳 PG 계약 및 MID 수수료 정보

B2B 정산 시스템 구현 시 적용될 가맹점 ID(MID)별 수수료율 내역입니다.

| 서비스 (MID) | 상호 | 수수료율 (부가세 미포함) | 최종 차감율 (부가세 10% 포함) |
|--------------|------|-----------------------|----------------------------|
| `pgmaeum01m` | 마음부고 | 2.6% | 2.86% |
| `pgjsbro01m` | (주)제이에스브라더스 (부고온) | 3.4% | 3.74% |

---

## ⏳ 남은 작업

### iOS (Xcode 및 업로드)
- [x] Xcode에 Apple ID 로그인 및 개발자 계정 연동 완료
- [x] 아이폰 기기(UDID) 정식 등록 완료
- [x] Xcode Archive 배포용 빌드 성공
- [x] App Store Connect에 빌드(Version 1.0, Build 1) 업로드 완료 (2026-07-03)

### App Store Connect 웹 설정
- [x] 앱 이름 "부고온2" → **"부고온"** 수정
- [x] 업로드된 빌드 선택 완료
- [x] 스크린샷(iPhone 6.5인치, iPad 13인치) 업로드 완료
- [x] 앱 설명 및 지원 URL 등록 완료
- [x] 개인정보처리방침 URL 등록 (`https://bugoon.maeumbugo.co.kr/b2b/privacy`)
- [x] 애플 심사 최종 제출 완료 (2026-07-03)

### Android
- [x] 앱 심사용 스크린샷 준비 및 등록 완료
- [x] 개인정보처리방침 및 광고 ID 선언 완료
- [x] 구글 플레이 심사 최종 제출 완료 (2026-07-03)

### 공통
- [ ] 앱 아이콘 (1024x1024) 최종 확정
- [ ] 앱 설명문 작성 (한국어)
- [ ] 앱 카테고리 설정

---

## 🔑 중요 계정 정보

| 서비스 | 상태 | 비고 |
|--------|------|------|
| Apple Developer | ✅ 활성 | Individual 등록, Team ID: FTR72WNB4B |
| Google Play Console | ❌ 미등록 | $25 결제 필요 |
| Firebase (FCM) | ✅ 설정됨 | `GoogleService-Info.plist` 존재 |

---

## 📁 관련 파일 경로

- Capacitor 설정: `jojo/capacitor.config.ts`
- iOS 프로젝트: `jojo/ios/App/`
- Android 프로젝트: `jojo/android/`
- FCM 설정 (iOS): `jojo/ios/App/GoogleService-Info.plist`
- 스플래시 리소스: `jojo/splash/`
- DUNS 정보: `jojo/docs/DUNS_INFO.md`
