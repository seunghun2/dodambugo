# 🎨 도담부고 - 4가지 템플릿 스타일 가이드

## v4.1.0 - 심플 썸네일 + 템플릿별 차별화 디자인

---

## 📋 4가지 템플릿 완벽 구현

### 1️⃣ 기본형 (basic) - 訃告

**디자인 컨셉:** 심플하고 정중한 전통 스타일

**특징:**
- 흰색 배경에 나뭇가지 장식
- 가장 기본적이고 정중한 느낌
- 별세 사실을 담백하게 전달

**애도 문구:**
```
故 홍길동 님께서 11월 25일 별세하셨기에
삼가 알려드립니다.
```

**색상:**
- 배경: #FFFFFF
- 문구 섹션: linear-gradient(#FAFAFA → #FFFFFF)
- 텍스트: #191F28

---

### 2️⃣ 정중형 (ribbon) - 부고 + 검은리본

**디자인 컨셉:** 격식있고 정중한 스타일

**특징:**
- 검은 리본으로 애도 표현
- 가장 격식있는 느낌
- 상단 검은 테두리로 정중함 강조

**애도 문구:**
```
故 홍길동 님께서
11월 25일 별세하셨기에 삼가 알려드립니다.
```

**색상:**
- 배경: #F9F9F9
- 문구 섹션: #FFFFFF + 상단 검은 테두리 (3px)
- 텍스트: #191F28

---

### 3️⃣ 안내형 (border) - 謹弔 + 리본프레임

**디자인 컨셉:** 품격있고 고전적인 스타일

**특징:**
- 골드 브라운 테두리 프레임
- 가장 품격있는 느낌
- 謹弔 타이틀로 정중한 애도

**애도 문구:**
```
삼가 고인의 명복을 빕니다.
故 홍길동 님께서 11월 25일 별세하셨습니다.
```

**색상:**
- 배경: #FFFFFF
- 테두리: #8B7355 (2px)
- 문구 섹션: linear-gradient(135deg, #F9F7F4 → #FFFFFF)
- 텍스트: #8B7355 (브라운 톤)

---

### 4️⃣ 고급형 (flower) - 국화 + 검정배경

**디자인 컨셉:** 고급스럽고 모던한 스타일

**특징:**
- 검정 배경에 흰 국화
- 가장 고급스러운 느낌
- 미니멀하고 세련된 디자인

**애도 문구:**
```
故 홍길동 님
11월 25일 별세
```

**색상:**
- 배경: #000000
- 문구 섹션: linear-gradient(#2C2C2E → #1C1C1E)
- 텍스트: #FFFFFF
- 그림자: text-shadow (0 2px 4px rgba(0, 0, 0, 0.2))

---

## 🎨 디자인 시스템

### 심플 썸네일 구조

```
┌─────────────────────────┐
│                         │
│    템플릿 이미지         │  ← 이미지만 깔끔하게
│    (360px max-width)    │
│                         │
└─────────────────────────┘

┌─────────────────────────┐
│  故 홍길동 님께서        │  ← 애도 문구 (별도 섹션)
│  11월 25일 별세하셨기에  │     템플릿별 다른 문구
│  삼가 알려드립니다.      │
└─────────────────────────┘

┌─────────────────────────┐
│  고인 정보              │  ← 상세 정보
│  - 고인: 故 홍길동      │
│  - 향년: 75세           │
└─────────────────────────┘
```

### CSS 클래스 구조

```css
/* 전체 뷰에 템플릿 클래스 */
.bugo-view.template-basic { }
.bugo-view.template-ribbon { }
.bugo-view.template-border { }
.bugo-view.template-flower { }

/* 애도 문구 섹션에도 템플릿 클래스 */
.condolence-section.template-basic { }
.condolence-section.template-ribbon { }
.condolence-section.template-border { }
.condolence-section.template-flower { }
```

### JavaScript 렌더링

```javascript
function renderTemplateHeader(data) {
    // 템플릿 선택
    const template = data.template || 'basic';
    
    // 전체 뷰에 클래스 추가
    bugoView.className = `bugo-view template-${template}`;
    
    // 이미지 설정
    templateImage.src = templateImages[template];
    
    // 템플릿별 애도 문구
    switch(template) {
        case 'ribbon': // 정중형
            condolenceText = `...`;
            break;
        case 'border': // 안내형
            condolenceText = `...`;
            break;
        case 'flower': // 고급형
            condolenceText = `...`;
            break;
        default: // basic - 기본형
            condolenceText = `...`;
    }
}
```

---

## 🌓 다크모드 지원

### 템플릿별 다크모드 처리

**기본형/정중형/안내형:**
- 흰색 배경 템플릿은 다크모드에서 테두리 추가
- `border: 1px solid #3A3A3C`

**고급형:**
- 검정 배경 템플릿은 다크모드에서도 동일
- 테두리 없음 (원래 검정)

```css
.dark .template-basic .bugo-header,
.dark .template-ribbon .bugo-header,
.dark .template-border .bugo-header {
    border: 1px solid #3A3A3C;
}

.dark .template-flower .bugo-header {
    border: none; /* 검정 배경은 테두리 불필요 */
}
```

---

## 📱 반응형 디자인

### 모바일 (480px 이하)

```css
@media (max-width: 480px) {
    .bugo-header {
        max-width: 100%;
        border-radius: 0; /* 전체 너비 */
    }
    
    .condolence-main {
        font-size: 16px; /* 모바일 가독성 */
    }
}
```

### 데스크톱 (768px 이상)

```css
@media (min-width: 768px) {
    .bugo-header:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }
}
```

---

## 🎯 토스 디자인 철학 적용

### Simple (심플함)
✅ 이미지와 텍스트 분리
✅ 불필요한 오버레이 제거
✅ 깔끔한 섹션 구분

### Clear (명확함)
✅ 각 템플릿의 뚜렷한 차이
✅ 애도 문구의 명확한 전달
✅ 정보 계층 구조 확립

### Beautiful (아름다움)
✅ 고품질 템플릿 이미지 100% 활용
✅ 템플릿별 색상 테마
✅ 세련된 타이포그래피

---

## 📊 템플릿 선택 가이드

| 상황 | 추천 템플릿 | 이유 |
|------|------------|------|
| 일반적인 경우 | 기본형 (basic) | 가장 무난하고 정중 |
| 격식을 차려야 할 때 | 정중형 (ribbon) | 검은 리본의 정중함 |
| 품격있게 표현하고 싶을 때 | 안내형 (border) | 謹弔의 품격 |
| 모던하고 세련되게 | 고급형 (flower) | 미니멀 고급스러움 |

---

## 🔧 커스터마이징

### 새 템플릿 추가하기

1. **이미지 추가**
   ```
   images/template-newtype.jpg
   ```

2. **JavaScript 매핑**
   ```javascript
   const templateImages = {
       basic: 'images/template-basic.jpg',
       newtype: 'images/template-newtype.jpg'  // 추가
   };
   ```

3. **CSS 스타일**
   ```css
   .template-newtype .bugo-header {
       background: #YOUR_COLOR;
   }
   
   .template-newtype .condolence-section {
       background: #YOUR_COLOR;
   }
   ```

4. **애도 문구**
   ```javascript
   case 'newtype':
       condolenceText = `YOUR CUSTOM TEXT`;
       break;
   ```

---

## ✅ 체크리스트

- [x] 4가지 템플릿 이미지 다운로드
- [x] 심플 썸네일 구조 구현
- [x] 템플릿별 차별화된 디자인
- [x] 애도 문구 템플릿별 커스터마이징
- [x] 다크모드 지원
- [x] 반응형 디자인
- [x] 토스 디자인 철학 적용

---

**Made with ❤️ using Toss Design System**
