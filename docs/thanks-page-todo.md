# 감사장 페이지 수정 TODO

## 📅 작성일: 2026-01-20
## ✅ 완료일: 2026-01-21

---

## ✅ 완료된 항목

### 1. 카드 페이지 UI 개선 ✅
- `/view/[id]/thanks/card` 페이지를 `/thanks` 페이지와 동일한 디자인으로 변경
- 같은 CSS (`thanks.css`) 사용
- 담백하고 깔끔한 카드 디자인

### 2. 종교별 이미지/메시지 동기화 ✅
- 상주가 탭 변경 시 `thanks_religion` DB에 저장
- card 페이지에서 DB 값 읽어서 해당 종교 표시
- API: `/api/bugo/[id]/thanks-religion`

### 3. share 폴더 정리 ✅
- `/thanks/share` 폴더 삭제 완료
- 공유 기능은 thanks 페이지의 바텀시트 모달로 구현됨

---

## 📌 현재 구조

```
/view/[id]/thanks          → 상주용 (탭 선택 + 편집 + 공유 모달)
/view/[id]/thanks/card     → 받는 사람용 (카드만 표시)
```

## 🔄 플로우

1. 모바일부고장 제작 시 종교 선택 → 발인 후 24시간 뒤 상주에게 전달
2. 상주가 thanks 페이지에서 탭 클릭 (예: 천주교)
3. DB에 `thanks_religion: 'catholic'` 저장
4. 공유하기 → `/view/[id]/thanks/card` 링크 전송
5. 받는 사람이 card 페이지에서 해당 종교 메시지 확인
6. 상주가 다시 들어와서 탭 변경 → DB 업데이트
7. 기존 공유 링크도 최신 종교로 표시됨

---

## ⏳ 추후 작업 (선택)

### 공유 기능 개선
- 카카오 공유 시 썸네일 이미지 개선
- SMS 공유 문구 최적화

---

## 📂 관련 파일
- `app/view/[id]/thanks/ThanksContent.tsx` - 상주용 (편집 + 공유 모달)
- `app/view/[id]/thanks/card/CardContent.tsx` - 받는 사람용 (카드만)
- `app/view/[id]/thanks/thanks.css` - 공통 스타일
- `app/api/bugo/[id]/thanks-religion/route.ts` - 종교 저장 API
