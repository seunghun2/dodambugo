# 감사장 페이지 수정 TODO

## 📅 작성일: 2026-01-20

## 🔧 수정 필요 항목

### 1. 카드 페이지 UI 개선
- `/view/[id]/thanks/card` 페이지 디자인 수정 필요
- 현재: 배경 이미지 + 텍스트만 있음
- 목표: 첫번째 이미지처럼 배경 이미지가 자연스럽게 표시되어야 함

### 2. 종교별 이미지/메시지 동기화
- 공유 시 URL의 `?religion=` 파라미터로 종교 타입 전달
- card 페이지에서도 해당 파라미터를 받아 종교별 이미지/메시지 표시하도록 수정 필요

### 3. share 페이지 정리
- `/thanks/share` 폴더는 더 이상 사용하지 않음
- thanks 페이지에서 바텀시트 모달로 공유 기능 구현됨
- share 폴더 삭제 고려

## 📂 관련 파일
- `app/view/[id]/thanks/ThanksContent.tsx` - 상주용 (편집 + 공유 모달)
- `app/view/[id]/thanks/card/CardContent.tsx` - 받는 사람용 (카드만)
- `app/view/[id]/thanks/card/card.css` - 카드 스타일
