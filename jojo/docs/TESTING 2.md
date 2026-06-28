# 테스트 가이드

## 테스트 실행

```bash
# 전체 테스트 실행
npm test

# 파일 변경 시 자동 실행 (개발 중 유용)
npm run test:watch
```

---

## 테스트 파일 위치

```
__tests__/
├── api/
│   ├── payment.test.ts  ← 결제 API 테스트
│   └── bugo.test.ts     ← 부고장 API 테스트
```

---

## 테스트 작성법

### 기본 구조
```typescript
describe('테스트 그룹 이름', () => {
  test('테스트 케이스 이름', () => {
    // 실행
    const result = 1 + 1;
    
    // 검증
    expect(result).toBe(2);
  });
});
```

### API 테스트 예시
```typescript
test('부고장 생성 성공', async () => {
  const response = await fetch('/api/bugo', {
    method: 'POST',
    body: JSON.stringify({ deceased_name: '홍길동' })
  });
  
  expect(response.status).toBe(200);
});
```

---

## 테스트 활성화/비활성화

```typescript
// 비활성화 (대기 중)
test.skip('아직 안 만든 기능', () => { ... });

// 활성화
test('완성된 기능', () => { ... });
```

---

## 자주 쓰는 검증 함수

| 함수 | 설명 | 예시 |
|------|------|------|
| `toBe()` | 정확히 같음 | `expect(1).toBe(1)` |
| `toEqual()` | 객체 비교 | `expect({a:1}).toEqual({a:1})` |
| `toBeTruthy()` | 참 같은 값 | `expect('hello').toBeTruthy()` |
| `toBeNull()` | null | `expect(null).toBeNull()` |
| `toBeDefined()` | 정의됨 | `expect(변수).toBeDefined()` |

---

## 결제 API 붙일 때 체크리스트

- [ ] 정상 결제 테스트
- [ ] 금액 0원 실패 테스트
- [ ] 중복 주문 방지 테스트
- [ ] 결제 완료 웹훅 테스트
- [ ] 환불 처리 테스트

---

## 문제 해결

### 테스트 실패 시
```bash
# 상세 로그 보기
npm test -- --verbose
```

### 특정 파일만 테스트
```bash
npm test -- payment.test.ts
```
