---
description: 결제/알림 등 핵심 기능 수정 시 체크리스트
---

# 핵심 기능 수정 체크리스트

## 🚨 수정 전 필수 확인

### 1. 현재 상태 확인
- [ ] 이 기능이 지금 정상 작동하고 있나?
- [ ] 최근 언제 테스트했나?
- [ ] 관련 슬랙/알림톡이 정상적으로 오고 있나?

### 2. 변경 범위 확인
- [ ] 어떤 파일을 수정할 건가?
- [ ] 다른 기능에 영향 있나?
- [ ] 기존에 잘 되던 거 건드리나? → **사용자에게 먼저 확인**

---

## 💳 결제 관련 수정 시

### 파일 위치
- 결제 요청: `/app/view/[id]/flower/[productId]/order/page.tsx`
- 콜백 처리: `/app/view/[id]/payment/callback/page.tsx`
- 승인 API: `/app/api/payment/innopay/approve/route.ts`
- 주문 API: `/app/api/flower-orders/route.ts`

### 체크리스트
- [ ] `mallReserved`에 orderId 전달되나?
- [ ] approve에서 orderId 파싱 정상?
- [ ] DB 업데이트 쿼리에 조인 포함?
- [ ] TID 저장되나? (취소 시 필요)
- [ ] status 변경 정상? (pending → completed)

---

## 📱 알림톡 수정 시

### 파일 위치
- 발송 함수: `/lib/solapi.ts`
- 템플릿 목록: `/docs/알림톡-템플릿-목록.md`

### 체크리스트
- [ ] 템플릿 ID 정확한가?
- [ ] 변수명 정확한가? (`#{변수명}` 형식)
- [ ] 변수값이 실제로 전달되나?
- [ ] 전화번호 형식 (`-` 제거)?
- [ ] 발송 타이밍 맞나? (결제 완료 후?)

---

## 🔔 슬랙 알림 수정 시

### 파일 위치
- 슬랙 함수: `/lib/slack.ts`
- 환경변수: `SLACK_WEBHOOK_URL`, `SLACK_WEBHOOK_FLOWER`

### 체크리스트
- [ ] 웹훅 URL 환경변수 있나?
- [ ] 폴백 설정되어 있나?
- [ ] bugo 조인으로 부고번호 가져오나?
- [ ] 발송 타이밍 맞나?
- [ ] orderData가 null이면 어떻게 되나?

---

## 🔄 결제 플로우 (참고)

```
1. 주문 페이지 → 결제 정보 입력
2. /api/flower-orders POST → 주문 생성 (status: pending)
3. INNOPAY SDK → 결제 진행
4. /payment/callback → 결제 결과 수신
5. /api/payment/innopay/approve → 결제 승인 + DB 업데이트
   ↳ 알림톡 발송
   ↳ 슬랙 발송
6. /order/complete → 완료 페이지
```

---

## ✅ 수정 후 확인

- [ ] 로컬에서 console.log로 데이터 확인
- [ ] Vercel 로그에서 에러 없나?
- [ ] 알림톡 왔나?
- [ ] 슬랙 왔나?
- [ ] DB에 데이터 정상 저장됐나?

---

## 🚫 하지 말 것

1. **여러 파일 동시 수정** → 하나씩 하고 확인
2. **잘 되는 거 건드리기** → 먼저 물어보기
3. **테스트 없이 배포** → 최소한 로그 확인
4. **조인 빼먹기** → select 시 관련 테이블 조인 확인
