# Mock 데이터 정리 TODO

> 급한 건 아니지만 언젠간 없앨 것

## 남은 항목

### 1. B2B 본인인증 홍길동 반환
- **파일**: `app/api/b2b/verify/route.ts` (L30)
- **내용**: `return '홍길동'` — 가입자명과 일치하지 않는 모의 성명 반환
- **영향**: B2B 전용

### 2. 계좌 인증 mock 통과
- **파일**: `app/api/verify-account/route.ts` (L14-20)
- **내용**: 계좌번호 `111-222-333333` 입력 시 무조건 인증 성공 처리
- **영향**: B2B + B2C (단, 해당 번호 입력 시에만 작동)

### 3. 휴대폰 인증코드 강제 세팅
- **파일**: `app/api/phone-verify/send/route.ts` (L24)
- **내용**: 해외/데모 번호에 인증코드 `123456` 강제 세팅
- **영향**: 해외번호에서만 작동

---

## 이미 완료된 항목 (2026-07-20)

- [x] 화환 주문 API mock 제거 (`flower-orders/[orderId]/route.ts`)
- [x] 부의금 주문 API mock 제거 (`condolence/orders/[orderNumber]/route.ts`)
- [x] 결제 API MOCK_TOKEN 우회 제거 (`payment/innopay/approve/route.ts`)
