# 2026-01-12 작업 내역

## 🌸 화환 주문 시스템 완성

### 1. 주문 완료 페이지 스타일링 (`/view/[id]/order/complete`)
- 체크 아이콘 크기 64px로 조정
- 리본 문구 순서 변경 (보내는 분 이름 위, 메시지 아래)
- 수령자 정보에 장례식장/호실/주소 추가
- 버튼 중앙 정렬

### 2. 주문 데이터 연동
- sessionStorage 키 형식 수정 (`order_${bugoId}_${productId}`)
- 주문 정보에 상품명, 가격, 장례식장 정보 포함
- 날짜 포맷 함수 추가 (YYYY.MM.DD HH:MM)

### 3. DB 테이블 생성 (`flower_orders`)
```sql
- id, bugo_id, product_id, product_name, product_price
- sender_name, sender_phone, recipient_name
- funeral_home, room, address
- ribbon_text1, ribbon_text2
- payment_method, status, order_number
- partner_order_id, partner_data (제휴사 연동용)
- created_at, updated_at
```

### 4. API 생성 (`/api/flower-orders`)
- GET: 주문 목록 조회 (상태, bugo_id 필터)
- POST: 새 주문 생성
- PATCH: 주문 상태 업데이트

### 5. 결제 페이지 연동
- 결제 완료 시 DB에 주문 저장
- async/await 처리 추가

### 6. 어드민 화환 주문 페이지 (`/admin/flower-orders`)
- 주문 목록 조회
- 상태별 필터
- 주문 상세 정보 표시
- 상태 변경 (주문접수 → 주문확인 → 제작중 → 배송중 → 배송완료)

### 7. 어드민 사이드바 업데이트
- 모든 어드민 페이지에 "화환 주문" 탭 추가
- `/admin` 경로에서 상단 헤더 숨김 처리

### 8. 장례식장 데이터 복구
- facilities 테이블 데이터 삭제됨
- facilities.json 백업에서 1,108건 복구

## 📌 커밋 내역
- `fe545c0`: 화환 주문 시스템 완성: DB, API, 어드민 페이지, 결제 연동
- `062516b`: 어드민 사이드바 화환 주문 탭 추가, API 키 수정

## ⚠️ 참고사항
- Vercel 배포 시 `SUPABASE_SERVICE_ROLE_KEY` 환경변수 필요
- 실제 PG 연동은 사업자 등록 후 진행 예정

---

## 🚀 향후 로드맵

### 사업자 등록 완료 후 진행

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | 🌸 꽃톡 API 연동 | 대기 |
| 2 | 💬 카카오 사업자 전환 | 대기 |
| 3 | 🖼️ 카카오톡 썸네일 제작 | TODO |
| 4 | 📱 발인 후 감사장 알림톡 | TODO |
| 5 | 💰 모바일 부의금 업데이트 | TODO |
| 6 | 🏦 계좌 조회 API 연동 | TODO |
| 7 | 💳 모바일 부의금 결제 연동 | TODO |
| 8 | 🎁 답례품 연동 | TODO |

### 마케팅 & 광고

| 작업 | 상태 |
|------|------|
| 📊 네이버 광고 세팅 | TODO |
| 📊 구글 광고 세팅 | TODO |
| 🔔 슬랙 알림 (결제/문의) | TODO |

### 3대 매출 퍼널
1. 🌸 **화환** - 진행중
2. 💰 **모바일 부의금** - 예정
3. 🎁 **답례품** - 예정
