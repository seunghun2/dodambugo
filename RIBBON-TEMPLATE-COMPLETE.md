# 정중형(ribbon) 템플릿 구현 완료 ✅

## 📋 최종 스펙

### 텍스트 내용
```
故[이름]님께서 [날짜]
별세하셨기에 삼가 알려드립니다.
마음으로 따뜻한 위로 부탁드리며
고인의 명복을 빌어주시길 바랍니다.
```

### 스타일 스펙
- **위치**: `padding-top: 110%` - "부고" 글자 바로 아래
- **폰트 크기**: 16px (데스크톱), 15px (태블릿), 14px (모바일)
- **폰트 굵기**: 700 (bold)
- **정렬**: center (중앙 정렬)
- **색상**: #1a1a1a (검은색)
- **줄 간격**: 1.8
- **폰트**: Noto Serif KR

### 동적 교체 변수
- `[이름]`: `data.deceased_name` (고인명)
- `[날짜]`: `death_date`에서 추출한 `월 + 일` (예: "11월 25일")

---

## 🔧 기술적 해결 과정

### 문제 1: test-quick.html에서만 보이고 view.html에서 안 보임
**원인**: 이미지 로드 완료 전에 텍스트 오버레이를 적용하려고 함
- 이미지 높이를 기준으로 % 계산이 필요한데, 이미지가 로드되지 않아 높이가 0
- 결과: `padding-top: 110%`가 0의 110% = 0px로 계산됨

**해결**:
```javascript
// 이미지 로드 완료 후 텍스트 적용
templateImage.onload = function() {
    applyTextOverlay();  // 이미지 높이 확정 후 호출
};

// 이미 로드된 경우도 처리
if (templateImage.complete) {
    applyTextOverlay();
}
```

### 문제 2: 위치 조정 (52% → 110%)
**과정**:
1. 초기: `calc(45% - 16px)` → 너무 위쪽
2. 수정: `52%` → 여전히 위쪽
3. 테스트: `100~140%` 범위 비교 (test-quick.html)
4. **최종: `110%`** - "부고" 글자 바로 아래 최적 위치

---

## 📁 수정된 파일

### 코어 파일
1. **js/view-new.js**
   - `applyTextOverlay()` 함수 생성
   - 이미지 로드 이벤트 핸들러 추가
   - `padding-top: 110%` 인라인 적용

2. **css/view-overlay.css**
   - `.template-ribbon .text-overlay { padding-top: 110% !important; }`

3. **view.html**
   - `overlayFullMessage` 초기 인라인 스타일 추가

### 테스트 파일
4. **test-simple.html** - 순수 인라인 스타일 테스트
5. **test-quick.html** - 100~140% 위치 비교
6. **test-ribbon-style.html** - CSS 진단
7. **test-view.html** - 템플릿 종류 표시 `[정중형]`

---

## 🎯 테스트 결과

### ✅ 성공 확인
- **test-simple.html**: 110% 위치에서 완벽하게 렌더링
- **test-quick.html**: 110%가 최적 위치로 선택됨
- **view.html**: 실제 부고 데이터에서 정상 작동
- **콘솔 로그**: 모든 단계에서 성공 로그 출력

### 디버깅 로그 예시
```
🎨 템플릿: ribbon (정중형)
🖼️ 이미지 URL: images/template-ribbon.png
✅ 이미지 로드 성공
🎨 텍스트 오버레이 적용 시작... template: ribbon
✅ 정중형 템플릿 텍스트 적용: 홍길동, 11월 25일
✅ 스타일 적용 확인: { fontSize: '16px', fontWeight: '700', textAlign: 'center' }
✅ textOverlay padding-top: 110%
```

---

## 🚀 다음 단계

### 나머지 3개 템플릿 하드코딩 필요
1. **기본형 (basic)** - 나뭇가지 + "訃告"
2. **고급형 (flower)** - 검정배경 + 국화
3. **안내형 (border)** - 대리석 + "謹弔"

각 템플릿별로:
- 하드코딩할 문구 확정
- 최적 위치 결정 (test-quick.html 활용)
- 스타일 적용 및 테스트

---

## 📌 핵심 코드 스니펫

### JavaScript (view-new.js)
```javascript
function applyTextOverlay() {
    if (template === 'ribbon') {
        let month = deathDate.getMonth() + 1;
        let day = deathDate.getDate();
        
        overlayFullMessage.innerHTML = `故${data.deceased_name}님께서 ${month}월 ${day}일<br>별세하셨기에 삼가 알려드립니다.<br>마음으로 따뜻한 위로 부탁드리며<br>고인의 명복을 빌어주시길 바랍니다.`;
        
        overlayFullMessage.style.cssText = `
            display: block !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            text-align: center !important;
            /* ... */
        `;
        
        textOverlay.style.cssText = `
            padding-top: 110% !important;
            display: flex !important;
            align-items: center !important;
            /* ... */
        `;
    }
}

// 이미지 로드 후 적용
templateImage.onload = () => applyTextOverlay();
if (templateImage.complete) applyTextOverlay();
```

### CSS (view-overlay.css)
```css
.template-ribbon .text-overlay {
    padding-top: 110% !important;
    text-align: center !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
}

.template-ribbon .overlay-full-message {
    font-size: 16px !important;
    font-weight: 700 !important;
    color: #1a1a1a !important;
    text-align: center !important;
}
```

---

## 📝 버전 정보

- **버전**: v4.3.0
- **완료일**: 2025-11-08
- **상태**: ✅ 정중형 템플릿 완료
- **테스트**: 통과

---

## 🙏 최종 확인사항

- [x] 텍스트가 "부고" 글자 아래에 정확히 배치됨
- [x] 16px bold 중앙 정렬로 표시됨
- [x] 이름과 날짜가 동적으로 교체됨
- [x] 4줄 문구가 완벽하게 하드코딩됨
- [x] 이미지 로드 타이밍 문제 해결
- [x] 모든 테스트 페이지에서 정상 작동
- [x] test-view.html에 템플릿 종류 표시 추가

**정중형(ribbon) 템플릿 구현 완료! 🎉**
