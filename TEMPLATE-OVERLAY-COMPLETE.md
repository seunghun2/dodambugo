# 4개 템플릿 하드코딩 텍스트 오버레이 완료 ✅

## 📋 최종 완성 스펙

### 공통 문구 (모든 템플릿 동일)
```
故[이름]님께서 [날짜]
별세하셨기에 삼가 알려드립니다.
마음으로 따뜻한 위로 부탁드리며
고인의 명복을 빌어주시길 바랍니다.
```

### 동적 교체 변수
- `[이름]`: `data.deceased_name` (고인명)
- `[날짜]`: `death_date`에서 추출한 `월 + 일` (예: "11월 25일")

---

## 🎯 템플릿별 최적 위치 및 스타일

| 템플릿 | 이미지 | 위치 | 색상 | 특징 |
|--------|--------|------|------|------|
| 🎀 **정중형 (ribbon)** | 검은 리본 + "부고" | **110%** | 검은색 (#1a1a1a) | "부고" 글자 바로 아래 |
| 📄 **기본형 (basic)** | 나뭇가지 + "訃告" | **105%** | 검은색 (#1a1a1a) | "訃告" 글자 바로 아래 |
| 🌸 **고급형 (flower)** | 검정배경 + 흰 국화 | **50%** | 흰색 (#FFFFFF) + 그림자 | 국화 아래 중앙, 그림자로 가독성 |
| 🏛️ **안내형 (border)** | 대리석 + "謹弔" | **95%** | 검은색 (#1a1a1a) | "謹弔" 글자와 리본 코너 아래 |

---

## 📁 수정된 파일

### 1. js/view-new.js
**변경사항:**
- 모든 템플릿에 하드코딩 방식 적용
- 개별 요소 (deceased-name, death-info, condolence) 대신 `overlay-full-message` 사용
- 템플릿별 위치 (padding-top) 자동 설정
- 템플릿별 색상 (textColor) 자동 설정
- 고급형만 text-shadow 적용

**핵심 코드:**
```javascript
// 위치 (템플릿별)
switch(template) {
    case 'ribbon': paddingTop = '110%'; break;
    case 'basic': paddingTop = '105%'; break;
    case 'flower': paddingTop = '50%'; break;
    case 'border': paddingTop = '95%'; break;
}

// 색상 (템플릿별)
let textColor = '#1a1a1a'; // 기본: 검은색
let textShadow = 'none';

if (template === 'flower') {
    textColor = '#FFFFFF'; // 고급형: 흰색
    textShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
}
```

### 2. css/view-overlay.css
**변경사항:**
- 개별 템플릿별 deceased-name, death-info, condolence 스타일 모두 제거
- 통합된 `.overlay-full-message` 공통 스타일 적용
- 템플릿별로 padding-top과 color만 차별화
- 모든 개별 요소 `display: none !important`

**구조:**
```css
/* 공통 스타일 */
.overlay-full-message { /* 16px bold 중앙정렬 */ }
.overlay-deceased-name,
.overlay-death-info,
.overlay-condolence { display: none !important; }

/* 템플릿별 위치와 색상 */
.template-ribbon .text-overlay { padding-top: 110% !important; }
.template-ribbon .overlay-full-message { color: #1a1a1a !important; }

.template-basic .text-overlay { padding-top: 105% !important; }
.template-basic .overlay-full-message { color: #1a1a1a !important; }

.template-flower .text-overlay { padding-top: 50% !important; }
.template-flower .overlay-full-message { 
    color: #FFFFFF !important;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
}

.template-border .text-overlay { padding-top: 95% !important; }
.template-border .overlay-full-message { color: #1a1a1a !important; }
```

---

## 🧪 테스트 페이지

### 위치 선정을 위한 테스트 페이지 4종
1. **test-quick.html** - 정중형 (100~140%, 선택: 110%)
2. **test-quick-basic.html** - 기본형 (95~120%, 선택: 105%)
3. **test-quick-flower.html** - 고급형 (40~70%, 선택: 50%)
4. **test-quick-border.html** - 안내형 (80~100%, 선택: 95%)

### 기타 테스트 페이지
- **test-simple.html** - 순수 인라인 스타일 테스트
- **test-alignment.html** - 중앙정렬 진단
- **test-ribbon-style.html** - CSS 진단

---

## 🔧 해결한 문제들

### 1. 이미지 로드 타이밍 문제
**증상:** test-quick.html에서는 보이는데 view.html에서는 안 보임
**원인:** 이미지 로드 전에 텍스트 오버레이 적용 → padding-top: 110%가 0의 110% = 0px
**해결:**
```javascript
templateImage.onload = function() {
    applyTextOverlay(); // 이미지 로드 완료 후 적용
};

if (templateImage.complete) {
    applyTextOverlay(); // 이미 로드된 경우도 처리
}
```

### 2. 중앙정렬 안 되는 문제
**증상:** test-simple.html에서는 중앙인데 view.html에서는 오른쪽으로 치우침
**원인:** 다른 CSS가 padding/margin을 덮어씀
**해결:**
```css
margin: 0 auto !important;
padding-left: 0 !important;
padding-right: 0 !important;
left: 0 !important;
right: 0 !important;
transform: none !important;
```

### 3. 템플릿별 위치 최적화
**방법:** test-quick 시리즈로 여러 위치를 한눈에 비교
**결과:**
- 정중형: 110% (부고 글자 바로 아래)
- 기본형: 105% (訃告 글자 바로 아래)
- 고급형: 50% (국화와 텍스트 균형)
- 안내형: 95% (謹弔 글자와 리본 아래)

---

## 📊 변경 전/후 비교

### Before (개별 요소 방식)
```html
<p class="overlay-deceased-name">故 홍길동 님</p>
<p class="overlay-death-info">11월 25일 별세</p>
<p class="overlay-condolence">삼가 고인의 명복을 빕니다.</p>
```
- ❌ 템플릿별로 다른 문구
- ❌ 개별 스타일 관리 복잡
- ❌ 위치 조정 어려움

### After (하드코딩 통합 방식)
```html
<p class="overlay-full-message">
    故홍길동님께서 11월 25일<br>
    별세하셨기에 삼가 알려드립니다.<br>
    마음으로 따뜻한 위로 부탁드리며<br>
    고인의 명복을 빌어주시길 바랍니다.
</p>
```
- ✅ 모든 템플릿 동일 문구
- ✅ 단일 스타일 관리
- ✅ 템플릿별 위치/색상만 차별화
- ✅ 일관성 있는 UX

---

## 🎉 최종 결과

### ✅ 완료된 기능
- [x] 4개 템플릿 모두 하드코딩 문구 적용
- [x] 템플릿별 최적 위치 확정
- [x] 이미지 로드 타이밍 문제 해결
- [x] 중앙정렬 문제 해결
- [x] 고급형 흰색 텍스트 + 그림자 적용
- [x] JavaScript 통합 구조로 리팩토링
- [x] CSS 간소화 및 통합
- [x] 테스트 페이지 4종 제작

### 🎯 사용자 경험
- **일관성**: 모든 템플릿에서 동일한 문구
- **가독성**: 템플릿 배경에 맞춘 색상/그림자
- **정확성**: 이름과 날짜만 동적으로 교체
- **안정성**: 레이아웃이 깨지지 않음

---

## 📝 버전 정보

- **버전**: v4.3.0
- **완료일**: 2025-11-08
- **상태**: ✅ 4개 템플릿 모두 완료
- **테스트**: 통과

---

## 🙏 최종 확인사항

- [x] 정중형 110% - "부고" 글자 아래 정확히 배치
- [x] 기본형 105% - "訃告" 글자 아래 정확히 배치
- [x] 고급형 50% - 국화 아래 흰색 텍스트로 표시
- [x] 안내형 95% - "謹弔" 글자와 리본 아래 배치
- [x] 모든 템플릿 16px bold 중앙정렬
- [x] 이름과 날짜 동적 교체 정상 작동
- [x] 이미지 로드 타이밍 문제 해결
- [x] 중앙정렬 완벽 구현
- [x] test-view.html에 템플릿 종류 표시

**4개 템플릿 하드코딩 텍스트 오버레이 완성! 🎊**
