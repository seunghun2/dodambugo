# 마음부고 API 문서

## 기본 정보

- **Base URL**: `https://maeumbugo.co.kr/api`
- **Database**: Supabase

---

## 부고 (Bugo)

### GET /api/bugo/[id]
부고 상세 조회

**Response:**
```json
{
  "id": "uuid",
  "bugo_number": 1234,
  "deceased_name": "홍길동",
  "mourner_name": "김철수",
  "funeral_home": "세브란스병원장례식장",
  "room_number": "2호실",
  "death_date": "2026-01-03",
  "death_time": "08:15",
  "funeral_date": "2026-01-05",
  "funeral_time": "09:00",
  "age": 85,
  "funeral_type": "일반 장례",
  ...
}
```

### POST /api/bugo
부고 생성

---

## 장례식장 (Facilities)

### GET /api/facilities/search
장례식장 검색

**Query Params:**
- `query`: 검색어 (이름 또는 주소)

### POST /api/facilities
장례식장 정보 업데이트 (관리자)

---

## 카카오 (Kakao)

### JavaScript SDK
- App Key: 카카오 개발자 콘솔에서 발급
- 공유 기능: `Kakao.Share.sendDefault()`

---

*마지막 업데이트: 2026-01-04*
