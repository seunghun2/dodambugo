# Google Material Icons 마이그레이션 계획

## ✅ 완료된 작업
- [x] view.html에 Google Material Icons CDN 추가
- [x] view.html 테마 토글 아이콘 변경 (light_mode / dark_mode)
- [x] 다크모드 CSS 확인 (view-toss.css에 존재)

## 📋 변경할 페이지 목록

### 주요 페이지 (우선순위 높음)
1. **index.html** - 메인 페이지
   - 햄버거 메뉴 아이콘
   - 서비스 특징 아이콘들
   - CTA 버튼 아이콘
   
2. **create.html** - 부고장 작성
   - 폼 입력 필드 아이콘
   - 단계 표시 아이콘
   - 제출 버튼 아이콘
   
3. **search.html** - 검색 페이지
   - 검색 아이콘
   - 필터 아이콘

4. **view.html** - 부고장 보기 ✅ 완료
   - 테마 토글 ✅
   - 기타 아이콘들 확인 필요

### 법적 페이지 (우선순위 중간)
5. **terms.html** - 이용약관
6. **privacy.html** - 개인정보처리방침  
7. **contact.html** - 제휴문의

### 테스트 페이지 (우선순위 낮음)
- test-*.html 파일들

## 🎨 Google Material Icons 사용법

### CDN 추가
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
```

### 아이콘 사용
```html
<span class="material-symbols-outlined">icon_name</span>
```

### CSS 스타일링
```css
.material-symbols-outlined {
    font-size: 24px;
    color: #191F28;
}
```

## 📝 자주 사용할 아이콘 매핑

| 기능 | 현재 | Google Material Icon |
|------|------|---------------------|
| 메뉴 | ☰ SVG | `menu` |
| 닫기 | ✕ SVG | `close` |
| 검색 | 🔍 | `search` |
| 전화 | 📞 | `call` |
| 위치/지도 | 📍 | `location_on` |
| 공유 | 📤 | `share` |
| 편집 | ✏️ | `edit` |
| 삭제 | 🗑️ | `delete` |
| 홈 | 🏠 | `home` |
| 설정 | ⚙️ | `settings` |
| 정보 | ℹ️ | `info` |
| 경고 | ⚠️ | `warning` |
| 성공 | ✓ | `check_circle` |
| 에러 | ✕ | `error` |
| 추가 | + | `add` |
| 캘린더 | 📅 | `calendar_today` |
| 시간 | 🕐 | `schedule` |
| 사람 | 👤 | `person` |
| 그룹 | 👥 | `group` |
| 이메일 | ✉️ | `email` |
| 화살표(오른쪽) | → | `arrow_forward` |
| 화살표(왼쪽) | ← | `arrow_back` |
| 다운로드 | ⬇️ | `download` |
| 업로드 | ⬆️ | `upload` |
| 라이트모드 | ☀️ | `light_mode` |
| 다크모드 | 🌙 | `dark_mode` |

## 🚀 다음 단계

1. **index.html** 아이콘 변경
2. **create.html** 아이콘 변경  
3. **search.html** 아이콘 변경
4. 나머지 페이지들 일괄 변경
5. 다크모드 테스트

## 💡 다크모드 확인사항

- [x] CSS 파일에 `.dark` 클래스 스타일 존재
- [x] JavaScript toggleTheme() 함수 존재
- [x] localStorage 저장/복원 로직 존재
- [ ] 실제 작동 테스트 필요
