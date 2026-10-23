# B2C / B2B 어드민 데이터 분리 규칙

> **중요**: 마음부고(B2C)와 부고온(B2B)은 동일한 DB 테이블을 공유하지만,
> 어드민 화면에서는 **각자의 데이터만** 보여줘야 합니다.

---

## 핵심 원리

모든 주문/결제 데이터는 `bugo` 테이블의 **`b2b_user_id`** 유무로 B2C/B2B를 구분합니다.

| 조건 | 의미 |
|:---|:---|
| `bugo.b2b_user_id IS NULL` | **B2C** (마음부고) 부고장 |
| `bugo.b2b_user_id IS NOT NULL` | **B2B** (부고온) 파트너 부고장 |

---

## 분리 패턴

### B2C 어드민 API (마음부고)
> `maeumbugo.co.kr/admin/...`

B2B 부고장에 달린 데이터를 **제외**합니다.

```typescript
// B2B 부고장 ID 목록 조회
const { data: b2bBugoIds } = await supabase
    .from('bugo')
    .select('id')
    .not('b2b_user_id', 'is', null);

// 해당 부고장의 주문 제외
if (b2bBugoIds && b2bBugoIds.length > 0) {
    const excludeIds = b2bBugoIds.map((b: any) => b.id);
    query = query.not('bugo_id', 'in', `(${excludeIds.join(',')})`);
}
```

### B2B 어드민 API (부고온)
> `bugoon.maeumbugo.co.kr/b2b/admin/...`

B2B 부고장에 달린 데이터만 **포함**합니다.

```typescript
// inner join + b2b_user_id 필터
let query = supabase
    .from('주문테이블')
    .select(`*, bugo!inner ( id, b2b_user_id, b2b_users ( company_name, owner_name ) )`)
    .not('bugo.b2b_user_id', 'is', null);
```

---

## 적용 현황

| 기능 | 공통 테이블 | B2C 어드민 | B2B 어드민 | 분리 상태 |
|:---|:---|:---|:---|:---|
| **화환 주문** | `flower_orders` | `/api/flower-orders` | `/api/b2b/admin/flower-orders` | ✅ 완료 |
| **부의금 결제** | `condolence_payments` | `/api/condolence/...` | (미구현) | ⬜ 미적용 |
| **답례품 주문** | (미구현) | (미구현) | (미구현) | ⬜ 미적용 |

---

## 주의사항

1. **새 기능 추가 시**: 부의금, 답례품 등 B2C/B2B가 같은 테이블을 공유하는 기능을 만들 때는 **반드시 위 패턴을 적용**하여 어드민 화면을 분리할 것.
2. **카운트 집계 시**: 어드민 대시보드 통계(화환 수, 매출 등)도 동일하게 B2C/B2B 분리 필터를 적용해야 정확한 수치가 나옴.
3. **슬랙 알림**: 슬랙 알림도 B2C/B2B 채널이 분리되어 있으므로 `isB2B` 파라미터를 반드시 전달할 것. (자세한 내용은 `docs/slack/SLACK_CHANNELS_GUIDE.md` 참조)
