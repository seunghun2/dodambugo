# 🎨 텍스트 오버레이 가이드 v4.2.0

## 고해상도 이미지 + 정밀 텍스트 배치

---

## 📸 적용된 이미지

### 1. 정중형 (ribbon) - `template-ribbon.png`
- **디자인**: 검은 리본 + "부고" 타이틀
- **배경**: 밝은 회색/흰색
- **특징**: 가장 격식있고 정중한 느낌
- **파일 크기**: 9.8 KB

### 2. 기본형 (basic) - `template-basic.png`
- **디자인**: 나뭇가지 장식 + "訃告" 타이틀
- **배경**: 흰색
- **특징**: 전통적이고 심플한 느낌
- **파일 크기**: 21.7 KB

### 3. 고급형 (flower) - `template-flower.png`
- **디자인**: 검정 배경 + 흰 국화 + "부고" 타이틀
- **배경**: 검정
- **특징**: 모던하고 고급스러운 느낌
- **파일 크기**: 19.5 KB

### 4. 안내형 (border) - `template-border.png`
- **디자인**: 대리석 배경 + 검은리본 코너 + "謹弔" 타이틀
- **배경**: 대리석 텍스처
- **특징**: 품격있고 고전적인 느낌
- **파일 크기**: 31.2 KB

---

## 🎯 텍스트 오버레이 구조

### HTML 구조
```html
<div class="bugo-header template-ribbon">
    <!-- 배경 이미지 -->
    <img id="templateImage" src="images/template-ribbon.png" alt="부고장 템플릿">
    
    <!-- 텍스트 오버레이 -->
    <div class="text-overlay">
        <p class="overlay-deceased-name">故 홍길동 님</p>
        <p class="overlay-death-info">11월 25일 별세하셨기에</p>
        <p class="overlay-condolence">삼가 알려드립니다.<br>고인의 명복을 빕니다.</p>
    </div>
</div>
```

### CSS 배치 원리
```css
/* 컨테이너 */
.bugo-header {
    position: relative;  /* 부모 요소 */
}

/* 텍스트 오버레이 */
.text-overlay {
    position: absolute;  /* 절대 위치 */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 45%;    /* 템플릿별로 다름 */
}
```

---

## 📐 템플릿별 텍스트 배치

### 정중형 (ribbon)
```css
.template-ribbon .text-overlay {
    padding-top: 45%;  /* 검은 리본 + 부고 타이틀 아래 */
}

.template-ribbon .overlay-deceased-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
}

.template-ribbon .overlay-death-info {
    font-size: 16px;
    color: #2a2a2a;
}

.template-ribbon .overlay-condolence {
    font-size: 14px;
    color: #3a3a3a;
}
```

**텍스트 내용:**
- 고인명: "故 홍길동 님"
- 별세 정보: "11월 25일 별세하셨기에"
- 애도 문구: "삼가 알려드립니다. / 고인의 명복을 빕니다."

---

### 기본형 (basic)
```css
.template-basic .text-overlay {
    padding-top: 38%;  /* 訃告 타이틀 아래 */
}

.template-basic .overlay-deceased-name {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
}

.template-basic .overlay-death-info {
    font-size: 17px;
    color: #2a2a2a;
}

.template-basic .overlay-condolence {
    font-size: 15px;
    color: #3a3a3a;
}
```

**텍스트 내용:**
- 고인명: "故 홍길동 님"
- 별세 정보: "11월 25일 별세하셨기에"
- 애도 문구: "삼가 알려드립니다. / 고인의 명복을 빕니다."

---

### 고급형 (flower)
```css
.template-flower .text-overlay {
    padding-top: 25%;  /* 상단 부고 타이틀 아래, 국화 위 */
}

.template-flower .overlay-deceased-name {
    font-size: 24px;
    font-weight: 700;
    color: #FFFFFF;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.template-flower .overlay-death-info {
    font-size: 18px;
    color: #F0F0F0;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.template-flower .overlay-condolence {
    font-size: 15px;
    color: #E0E0E0;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
```

**텍스트 내용:**
- 고인명: "故 홍길동 님"
- 별세 정보: "11월 25일 별세"
- 애도 문구: "삼가 조의를 표합니다."

**특징:** 검정 배경이므로 흰색 텍스트 + 그림자 효과

---

### 안내형 (border)
```css
.template-border .text-overlay {
    padding-top: 40%;  /* 謹弔 타이틀 아래 */
}

.template-border .overlay-deceased-name {
    font-size: 21px;
    font-weight: 700;
    color: #1a1a1a;
}

.template-border .overlay-death-info {
    font-size: 17px;
    color: #2a2a2a;
}

.template-border .overlay-condolence {
    font-size: 14px;
    color: #3a3a3a;
}
```

**텍스트 내용:**
- 고인명: "故 홍길동 님"
- 별세 정보: "2024년 11월 25일" (년도 포함)
- 애도 문구: "삼가 고인의 명복을 빕니다. / 가시는 길 편안하시길 기원합니다."

---

## 🔄 동적 데이터 처리

### JavaScript 렌더링
```javascript
function renderTemplateHeader(data) {
    const template = data.template || 'basic';
    
    // 이미지 설정
    templateImage.src = `images/template-${template}.png`;
    
    // 고인명
    overlayDeceasedName.textContent = `故 ${data.deceased_name} 님`;
    
    // 별세 정보 (날짜)
    if (data.death_date) {
        const deathDate = new Date(data.death_date);
        const month = deathDate.getMonth() + 1;
        const day = deathDate.getDate();
        
        switch(template) {
            case 'flower':
                overlayDeathInfo.textContent = `${month}월 ${day}일 별세`;
                break;
            case 'border':
                const year = deathDate.getFullYear();
                overlayDeathInfo.textContent = `${year}년 ${month}월 ${day}일`;
                break;
            default:
                overlayDeathInfo.textContent = `${month}월 ${day}일 별세하셨기에`;
        }
    }
    
    // 애도 문구 (템플릿별)
    switch(template) {
        case 'ribbon':
            overlayCondolence.innerHTML = '삼가 알려드립니다.<br>고인의 명복을 빕니다.';
            break;
        case 'flower':
            overlayCondolence.innerHTML = '삼가 조의를 표합니다.';
            break;
        // ...
    }
}
```

---

## 📱 반응형 디자인

### 데스크톱 (기본)
- 정중형: 20px / 16px / 14px
- 기본형: 22px / 17px / 15px
- 고급형: 24px / 18px / 15px
- 안내형: 21px / 17px / 14px

### 태블릿 (768px 이하)
```css
@media (max-width: 768px) {
    .template-ribbon .overlay-deceased-name {
        font-size: 18px;  /* 20px → 18px */
    }
}
```

### 모바일 (480px 이하)
```css
@media (max-width: 480px) {
    .template-ribbon .overlay-deceased-name {
        font-size: 16px;  /* 18px → 16px */
    }
    
    .text-overlay {
        padding: 6%;  /* 8% → 6% */
    }
}
```

---

## 🌓 다크모드

### 밝은 배경 템플릿 (정중형, 기본형, 안내형)
```css
.dark .template-ribbon .bugo-header,
.dark .template-basic .bugo-header,
.dark .template-border .bugo-header {
    border: 1px solid #3A3A3C;  /* 테두리 추가 */
}
```

### 어두운 배경 템플릿 (고급형)
```css
.dark .template-flower .bugo-header {
    border: none;  /* 테두리 불필요 */
}
```

---

## 🎨 커스터마이징

### 텍스트 위치 조정
```css
/* 텍스트를 더 위로 */
.template-ribbon .text-overlay {
    padding-top: 40%;  /* 45% → 40% */
}

/* 텍스트를 더 아래로 */
.template-ribbon .text-overlay {
    padding-top: 50%;  /* 45% → 50% */
}
```

### 폰트 크기 조정
```css
.template-ribbon .overlay-deceased-name {
    font-size: 24px;  /* 20px → 24px (더 크게) */
}
```

### 텍스트 색상 변경
```css
.template-ribbon .overlay-deceased-name {
    color: #000000;  /* 더 진하게 */
}

.template-flower .overlay-deceased-name {
    color: #FFFFEE;  /* 더 따뜻한 흰색 */
}
```

### 그림자 효과 추가
```css
.template-basic .overlay-deceased-name {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

## ✅ 체크리스트

- [x] 고해상도 PNG 이미지 4개 적용
- [x] 텍스트 오버레이 구조 구현
- [x] 템플릿별 정밀 위치 조정
- [x] 동적 데이터 (고인명, 날짜) 처리
- [x] 템플릿별 애도 문구 차별화
- [x] 반응형 디자인 (모바일/태블릿/데스크톱)
- [x] 다크모드 지원
- [x] 폰트 크기 최적화
- [x] 텍스트 가독성 (색상, 그림자)

---

## 🚀 다음 개선 사항

### 가능한 추가 기능:
- [ ] 텍스트 위치 실시간 조정 UI
- [ ] 폰트 선택 기능
- [ ] 텍스트 색상 커스터마이징
- [ ] 애도 문구 편집 기능
- [ ] 추가 템플릿 생성

---

**Made with ❤️ - v4.2.0**
