# 🚀 부고온 앱스토어 제출 진행 기록

> **최종 업데이트:** 2026-07-17

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

## 🏪 현재 심사 상태

> **Google Play 3차 제출 완료 (2026-07-17), App Store v1.0.1 (Build 7) 심사 제출 완료** (2026-07-19)

### Google Play Console
| 항목 | 상태 |
|------|------|
| 등록 | ✅ 완료 |
| 1차 심사 제출 | 2026-07-03 |
| 1차 반려 사유 | `ClassNotFoundException` (패키지 경로 불일치) |
| 1차 수정 내용 | 패키지 경로 수정 |
| 2차 제출 | versionCode 3 재제출 (2026-07-10) |
| 2차 반려 사유 | 동일 `ClassNotFoundException` (서버 URL 모드에서 오프라인 폴백 없이 앱 크래시) |
| 2차 수정 내용 | `out/index.html` 오프라인 폴백 페이지 추가, `build.gradle` google-services 플러그인 중복 제거 |
| 3차 제출 | ✅ versionCode 4 (1.0.1) 재제출 완료 (2026-07-17) |
| 현재 상태 | ⏳ 심사 대기 중 |

### App Store Connect
| 항목 | 상태 |
|------|------|
| 등록 | ✅ 완료 |
| 1차 심사 제출 | 2026-07-03 |
| 1차 반려 사유 | placeholder 아이콘 사용 + 로그인 세션 유실 |
| 수정 내용 | 앱 아이콘 Logo512.png로 교체, 쿠키 기반 인증 전환 |
| 재제출 | ✅ Build 2로 재제출 완료 (2026-07-10) |
| 1차 승인 및 출시 | ✅ 2026-07-18 승인 완료 및 배포 준비됨 |
| 이름 변경 제출 | ✅ v1.0.1 (Build 7) "부고온플러스"로 이름 및 한국어 변경 재제출 (2026-07-19) |
| 현재 상태 | ⏳ v1.0.1 심사 대기 중 |

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
- [x] Xcode에 Apple ID 로그인 및 개발자 계정 연동 완료
- [x] 아이폰 기기(UDID) 정식 등록 완료
- [x] Xcode Archive 배포용 빌드 성공
- [x] App Store Connect에 빌드(Version 1.0, Build 1) 업로드 완료 (2026-07-03)
- [x] 앱 이름 "부고온2" → **"부고온"** 수정
- [x] 업로드된 빌드 선택 완료
- [x] 스크린샷(iPhone 6.5인치, iPad 13인치) 업로드 완료
- [x] 앱 설명 및 지원 URL 등록 완료
- [x] 개인정보처리방침 URL 등록 (`https://bugoon.maeumbugo.co.kr/b2b/privacy`)
- [x] 애플 심사 최초 제출 완료 (2026-07-03)
- [x] 심사 반려 대응: 앱 아이콘 교체 (Logo512.png) + 쿠키 기반 인증 전환
- [x] App Store Connect API Key 세팅 완료 (Key ID: `Q34SS2799R`)
- [x] Build 2 재제출 완료 (2026-07-10)

### Android
- [x] Google Play Console 개발자 등록 ($25 일회성)
- [x] Java JDK 설치
- [x] Android SDK 설치
- [x] Capacitor sync
- [x] 서명 키(keystore) 생성
- [x] AAB 빌드
- [x] Google Play Console 앱 등록 및 업로드
- [x] 개인정보처리방침 및 광고 ID 선언 완료
- [x] 구글 플레이 심사 최초 제출 완료 (2026-07-03)
- [x] 심사 반려 대응: 패키지 경로 수정
- [x] versionCode 3 재제출 완료 (2026-07-10)
- [x] 2차 반려 대응: 오프라인 폴백 페이지(`out/index.html`) 추가, google-services 플러그인 중복 적용 제거
- [x] versionCode 4 (1.0.1) AAB 클린 빌드 및 Google Play Console 3차 제출 완료 (2026-07-17)

### 공통
- [x] 앱 아이콘 (1024x1024) 최종 확정 — Logo512.png
- [x] 앱 설명문 작성 (한국어)
- [x] 앱 카테고리 설정

---

## 💳 PG 계약 및 MID 수수료 정보

B2B 정산 시스템 구현 시 적용될 가맹점 ID(MID)별 수수료율 내역입니다.

| 서비스 (MID) | 상호 | 수수료율 (부가세 미포함) | 최종 차감율 (부가세 10% 포함) |
|--------------|------|-----------------------|----------------------------|
| `pgmaeum01m` | 마음부고 | 2.6% | 2.86% |
| `pgjsbro01m` | (주)제이에스브라더스 (부고온) | 3.4% | 3.74% |

---

## ⏳ 남은 작업

- [ ] Google Play 심사 승인 확인 및 출시
- [ ] App Store v1.0.1 (부고온플러스) 심사 승인 확인 및 출시
- [ ] Apple Developer Contact를 통해 개발자 노출명 영문(`seunghun back`) -> 국문(`백승훈`) 변경 요청 및 승인 완료 처리
- [x] 출시 후 실기기 푸시 알림(FCM/APNs) 연동 및 8개 채널 실수신 검증 완료 (2026-07-18)

---

## 🔑 중요 계정 정보

| 서비스 | 상태 | 비고 |
|--------|------|------|
| Apple Developer | ✅ 활성 | Individual 등록, Team ID: `FTR72WNB4B` |
| App Store Connect API Key | ✅ 설정됨 | Key ID: `Q34SS2799R` |
| Google Play Console | ✅ 등록 완료 | $25 결제 완료 |
| Firebase (FCM) | ✅ 설정됨 | `GoogleService-Info.plist` 존재 |
| D-U-N-S | ✅ 발급 완료 | `696633660` |

---

## 📁 관련 파일 경로

- Capacitor 설정: `jojo/capacitor.config.ts`
- iOS 프로젝트: `jojo/ios/App/`
- Android 프로젝트: `jojo/android/`
- FCM 설정 (iOS): `jojo/ios/App/GoogleService-Info.plist`
- 스플래시 리소스: `jojo/splash/`
- DUNS 정보: `jojo/docs/DUNS_INFO.md`
