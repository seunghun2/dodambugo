# 마음부고 B2B 파트너 앱 — 디자인 시스템 규칙

> **이 파일은 AI가 코드를 생성할 때 반드시 참조해야 하는 디자인 규칙입니다.**
> 마음부고 기존 디자인을 베이스로, 바로부고/삼가 스타일(정중·품격·업계 친화)을 B2B 레이어로 적용합니다.
> 다크모드는 지원하지 않습니다.

---

## 1. 디자인 방향

### 벤치마킹 대상
- **마음부고** (maeumbugo.co.kr) — 기존 B2C 디자인 베이스
- **바로부고** (barobugo.com) — 무채색+베이지+네이비, 격식 있는 정중함, 건별 정산 투명성
- **삼가** (samga.co.kr) — 갈색+흰색, 심플·세련, 카드형 데이터, 상태 색상 코딩

### 톤앤매너
- **정중한 존댓말**: "~해 주세요", "~됩니다", "~하셨습니다"
- **이모지 사용 금지** — 아이콘은 반드시 Tabler Icons
- **CTA 간결**: "로그인", "가입하기", "다음", "출금 신청"
- **업계 용어 사용**: 고인, 상주, 빈소, 발인, 근조화환, 조문객, 예치금, 정산
- **광고 배제** — 품격·엄숙함 유지

### 절대 하지 말 것 (AI 티 나는 패턴)
| ❌ 금지 | ✅ 대신 이렇게 |
|---------|---------------|
| 무지개색 그라데이션 | 단색 배경 또는 네이비 그라디언트만 허용 |
| 완벽한 좌우 대칭으로만 구성 | 여백과 계층으로 시각적 흐름 만들기 |
| `box-shadow` 3개 이상 중첩 | `border: 1px solid` + `box-shadow` 최대 1개 |
| `border-radius: 20px` 이상 | `8px~14px` 범위 내 통일 |
| 모든 요소에 애니메이션 | 버튼 hover/active, 모달 진입에만 transition |
| 제네릭 파란색 `#0000FF` | 브랜드 컬러 팔레트만 사용 |
| `linear-gradient(45deg, ...)` 배경 | 단색 또는 수직(`180deg`) 그라디언트만 |
| 이모지로 섹션 장식 (🔥📊💰) | Tabler Icons (stroke={1.5}) |
| 텍스트 과밀 (여백 없음) | `line-height: 1.5` + 섹션 간 `--space-6` 이상 |
| 과도한 카드 그림자 + 둥근 모서리 | 얇은 보더 + 미세 그림자 + `12px` radius |
| 하드코딩된 색상값 | 반드시 CSS 변수 사용 (`var(--변수명)`) |
| 인라인 `style={{ }}` | CSS Module 클래스 사용 |
| px 직접 입력 (12px, 24px) | spacing 토큰 사용 (`var(--space-3)`, `var(--space-6)`) |

---

## 2. 색상 팔레트

### globals.css `:root` 변수 사용 (하드코딩 금지)

```css
:root {
  /* 브랜드 — 마음부고 기존 유지 */
  --primary: #FFD43B;           /* 골드 옐로우 (CTA 버튼) */
  --primary-dark: #FCC419;      /* hover/active */
  --primary-light: #FFF3BF;     /* focus glow */
  --primary-text: #1A1A1A;      /* 버튼 위 텍스트 */
  --accent: #364F6B;            /* 네이비 (신뢰/카드/활성탭) */

  /* B2B 보조 — 바로부고/삼가 톤 */
  --brown: #8B7355;             /* 품격 브라운 (보조 강조) */
  --brown-dark: #6B5744;        /* 브라운 hover */

  /* 뉴트럴 그레이 — 이미 정의된 것 사용 */
  --gray-900 ~ --gray-50        /* 기존 globals.css 값 그대로 */

  /* 시맨틱 */
  --success: #27AE60;           /* 정산 완료, 적립(+) */
  --warning: #F39C12;           /* 입금 대기, 주의 */
  --error: #E74C3C;             /* 오류, 출금(-) */
  --info: #3498DB;              /* 안내 */

  /* 시맨틱 배경 (하드코딩 대신 변수화) */
  --success-bg: #F0FDF4;
  --success-border: #BBF7D0;
  --error-bg: #FEF2F2;
  --error-border: #FECACA;
  --warning-bg: #FFFBEB;
  --warning-border: #FDE68A;
}
```

### 색상 사용 규칙
- **CTA 버튼**: `--primary` (골드 옐로우) — 페이지당 최대 1~2개
- **카드/헤더 강조**: `--accent` (네이비) — 예치금 카드, 활성 탭
- **보조 강조**: `--brown` — 품격 있는 포인트 (아이콘, 구분선, 라벨)
- **일반 텍스트**: `--gray-900` (제목), `--gray-700` (본문), `--gray-500` (보조)
- **배경**: `--bg-gray` (#F8F9FA) 페이지, `--bg-white` 카드/모달
- **상태 뱃지**: 연한 배경 + 진한 텍스트 (아래 컴포넌트 규칙 참고)

---

## 3. 타이포그래피

### 폰트
```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
- **반드시 `var(--font-family)` 사용**
- 버튼/인풋에 `font-family: inherit` 적용

### 크기 스케일 (기존 globals.css 변수 활용)
| 용도 | 크기 | weight | 예시 |
|------|------|--------|------|
| 캡션/보조 | 11~12px | 400 | 탭 라벨, 날짜, 메타 |
| 라벨/설명 | 13px | 400~500 | 인풋 라벨, 리스트 보조 |
| 본문 기본 | 14px | 400 | 일반 텍스트 |
| 강조 본문 | 15~16px | 500~600 | 거래 항목, 카드 제목 |
| 섹션 제목 | 17~18px | 600~700 | 페이지 내 섹션 |
| 페이지 제목 | 20~22px | 700 | 헤더 타이틀 |
| 금액/히어로 | 28~36px | 700~800 | 잔액, 대시보드 핵심 수치 |

### 규칙
- **금액**: 항상 `font-weight: 700~800`, 가장 큰 크기
- **UI 기본 weight**: `500` (medium) — 토스/배민 등 한국 B2B 앱 표준
- **`letter-spacing`**: 건드리지 않기 (Pretendard 기본값 유지)
- **`line-height`**: 본문 `1.5~1.6`, 제목 `1.3`, 금액 `1.2`

---

## 4. 스페이싱 (4px 그리드)

### globals.css 변수 사용 (px 직접 입력 금지)
```
--spacing-xs: 4px    → 아이콘-텍스트 간격
--spacing-sm: 8px    → 인라인 요소 간격
--spacing-md: 16px   → 카드 내부 패딩, 리스트 아이템 간격
--spacing-lg: 24px   → 섹션 간격
--spacing-xl: 40px   → 페이지 상단 여백
--spacing-2xl: 60px  → 대 섹션 구분
```

### 규칙
- 카드 내부 패딩: `--spacing-md` (16px)
- 카드 간 간격: `--spacing-sm` ~ `--spacing-md` (8~16px)
- 섹션 간 간격: `--spacing-lg` (24px)
- 페이지 사이드 패딩: `20px`
- 바텀탭 있는 페이지: `padding-bottom: 80px`

---

## 5. 둥근 모서리 (radius)

### globals.css 변수 사용
```
--radius-sm: 6px     → 뱃지, 작은 요소
--radius-md: 10px    → 인풋, 일반 버튼
--radius-lg: 14px    → 카드, CTA 버튼
--radius-xl: 20px    → ❌ B2B에서는 사용 금지 (AI 티)
--radius-2xl: 28px   → ❌ B2B에서는 사용 금지
```

### B2B 규칙
- **카드**: `12~14px` (`--radius-lg`)
- **버튼**: `10~12px` (`--radius-md` ~ 12px)
- **인풋**: `10px` (`--radius-md`)
- **뱃지**: `6px` (`--radius-sm`)
- **20px 이상은 B2B에서 금지** — 장난감 느낌, 업계 신뢰감 저하

---

## 6. 그림자

### globals.css 변수 사용
```
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04)   → 일반 카드
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06)   → 강조 카드
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08)   → 예치금 카드, 모달
```

### B2B 규칙
- **카드 기본**: `border: 1px solid var(--gray-200)` + `--shadow-sm` (보더 우선, 그림자 보조)
- **강조 카드 (예치금)**: `--shadow-md` 또는 `--shadow-lg`
- **모달/바텀시트**: `--shadow-lg`
- **그림자 2개 이상 중첩 금지**

---

## 7. 컴포넌트 패턴

### 버튼
```css
/* CTA (메인 액션) — 페이지당 1~2개 */
.btnPrimary {
  background: var(--primary);
  color: var(--primary-text);
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-weight: 700;
  font-size: 16px;
  min-height: 52px;           /* 터치 타겟 44px 이상 */
  width: 100%;
  transition: background-color var(--transition-fast);
  cursor: pointer;
}
.btnPrimary:hover { background: var(--primary-dark); }
.btnPrimary:disabled { background: var(--gray-200); color: var(--gray-500); cursor: not-allowed; }

/* 서브 버튼 */
.btnSecondary {
  background: var(--bg-white);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 600;
  min-height: 44px;
}

/* 고스트 버튼 */
.btnGhost {
  background: none;
  color: var(--gray-600);
  border: none;
  padding: 8px;
  font-weight: 500;
}
```

### 카드
```css
/* 일반 카드 */
.card {
  background: var(--bg-white);
  border: 1px solid var(--gray-200);    /* 보더 우선 */
  border-radius: var(--radius-lg);       /* 14px */
  padding: var(--spacing-md);            /* 16px */
  box-shadow: var(--shadow-sm);
}

/* 강조 카드 (예치금/잔액) — 네이비 그라디언트 */
.cardAccent {
  background: linear-gradient(180deg, var(--accent) 0%, #2A3F54 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
}
```

### 상태 뱃지 (정산 필수)
```css
/* 정산 완료 */
.badgeSuccess {
  background: var(--success-bg);
  color: #065F46;
  border: 1px solid var(--success-border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}
/* 입금 대기 */
.badgeWarning {
  background: var(--warning-bg);
  color: #92400E;
  border: 1px solid var(--warning-border);
}
/* 오류/보류 */
.badgeError {
  background: var(--error-bg);
  color: #991B1B;
  border: 1px solid var(--error-border);
}
/* 기본/비활성 */
.badgeNeutral {
  background: var(--gray-100);
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
}
```

### 인풋
```css
.input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);       /* 10px */
  font-size: 15px;
  font-family: inherit;
  color: var(--gray-900);
  background: var(--bg-white);
  transition: border-color var(--transition-fast);
}
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}
.input::placeholder { color: var(--gray-400); }
.input:disabled { background: var(--gray-100); color: var(--gray-500); }
```

### 바텀탭바
```css
.bottomTab {
  position: fixed;
  bottom: 0;
  max-width: 480px;
  width: 100%;
  height: 56px;
  background: white;
  border-top: 1px solid var(--gray-200);
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}
/* 탭 아이콘: Tabler Icons, size=22 */
/* active: color=var(--accent), stroke={2}, font-weight: 700 */
/* inactive: color=var(--gray-400), stroke={1.5}, font-weight: 400 */
```

### 거래 내역 리스트
```css
/* 금액 표시 — 업계 필수 패턴 */
.amountPositive { color: var(--success); font-weight: 700; }  /* +20,000 */
.amountNegative { color: var(--error); font-weight: 700; }    /* -50,000 */
/* 날짜/시간: var(--gray-500), 12~13px, 400 weight */
/* 구분: border-bottom: 1px solid var(--gray-100) */
```

---

## 8. 레이아웃 규칙

### 모바일 퍼스트 (max-width: 480px)
```css
.container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--bg-gray);
  padding: 0 20px;
}
```

### 대시보드 구조 (위→아래)
```
[헤더: 인사말 + 알림 아이콘]
[예치금 카드: 잔액 + 출금 버튼]     ← --accent 그라디언트
[추천코드 카드]                     ← 흰색 카드
[빠른 메뉴: 2열 그리드]             ← 부고작성/정산/설정/고객센터
[최근 내역: 리스트]                 ← 거래 내역
[바텀탭바: 4탭]                    ← fixed bottom
```

### 정산 페이지 구조 (위→아래)
```
[sticky 헤더: ← 뒤로가기 + "정산"]
[잔액 카드: 출금가능 금액 + 출금 버튼]
[에러/성공 메시지 (조건부)]
[필터: 기간/유형]
[거래 내역 리스트]                  ← 무한스크롤 or 더보기
[바텀탭바]
```

---

## 9. 애니메이션 규칙

### 허용하는 애니메이션
| 대상 | transition | 값 |
|------|-----------|-----|
| 버튼 hover/active | `background-color` | `var(--transition-fast)` (150ms) |
| 인풋 focus | `border-color`, `box-shadow` | `var(--transition-fast)` |
| 탭 전환 | `color`, `font-weight` | `var(--transition-base)` (200ms) |
| 모달/바텀시트 진입 | `transform`, `opacity` | `var(--transition-slow)` (300ms) |
| 페이지 진입 | `opacity` | 300ms, 1회만 |

### 금지하는 애니메이션
- bounce, shake, jello, 무한 rotate
- 1초 이상 지속되는 애니메이션
- 스크롤 기반 parallax
- 모든 카드에 fade-in (핵심 1~2개만)
- 화려한 page transition

---

## 10. 아이콘 규칙

- **라이브러리**: `@tabler/icons-react` v3 **만** 사용
- **기본**: `stroke={1.5}`, `size={22}`
- **활성 상태**: `stroke={2}`, `color={var(--accent)}`
- **비활성**: `stroke={1.5}`, `color={var(--gray-400)}`
- **이모지 절대 금지**: 🔥📊💰❌ → Tabler 아이콘으로 대체
- **Material Symbols 사용 금지** (B2B에서는 Tabler만)

---

## 11. 코드 규칙

### CSS Module 필수
- 모든 B2B 페이지는 `*.module.css` 사용
- 인라인 `style={{ }}` 금지 — 로딩 fallback도 CSS 클래스로
- 공통 스타일은 `components/b2b/` 공용 CSS로 추출

### 변수 사용 강제
- 색상: `var(--변수명)` (하드코딩 `#FFF5F5` 같은 거 금지)
- 간격: `var(--spacing-*)` (px 직접 입력 최소화)
- 반경: `var(--radius-*)` (B2B는 `--radius-xl` 이상 금지)
- 그림자: `var(--shadow-*)` (직접 `box-shadow` 작성 금지)
- 트랜지션: `var(--transition-*)` (직접 `transition: 0.3s` 금지)

### Mantine 활용 방침
- Mantine v8이 설치되어 있지만, **B2B에서는 순수 CSS Module 우선**
- Mantine 사용 시: `TextInput`, `Button`, `Modal`, `Notification`만 선택적 사용
- Mantine 테마는 globals.css 변수와 동기화

### 파일 구조
```
app/b2b/
├── login/           page.tsx + login.module.css
├── signup/          page.tsx + signup.module.css
├── dashboard/       page.tsx + dashboard.module.css
├── wallet/          page.tsx + wallet.module.css
├── settings/        page.tsx + settings.module.css  ← 신규
└── admin/           ← 미구현
components/b2b/
├── BottomTabBar.tsx + .module.css
├── common.module.css  ← 공통 스타일 추출 (신규)
└── ...
```

---

## 12. 참조 레퍼런스

### 경쟁사 (UI 참조)
| 서비스 | URL | 참조 포인트 |
|--------|-----|------------|
| 바로부고 | barobugo.com | B2B 정산 UI, 추천인 수당 대시보드 |
| 예지파트너스 | biz.yejibugo.co.kr | 건당 수익 표시, 파트너 포털 구조 |
| 삼가 | samga.co.kr | 갈색 브랜딩, 카드형 데이터, 상태 색상 |
| 가온프라임 | gaonprime.com | 올인원 대시보드, 빈소 관리 |

### 한국 B2B 앱 (UX 패턴 참조)
| 앱 | 참조 포인트 |
|----|------------|
| 토스 파트너 | 플로팅 탭바, KPI 카드, 금융 데이터 표현 |
| 배민 사장님 | 큰 폰트/높은 대비 (다양한 연령대), 친근한 UX Writing |
| 숨고 고수 | 탭 인터페이스, 컬러 뱃지 정산, 수익 추이 차트 |
| 카카오페이 가맹점 | 요약→상세 계층 내비게이션 |

### GitHub 레포 (구현 참조)
| 레포 | 참조 포인트 |
|------|------------|
| toss/overlay-kit | 모달/토스트 선언적 관리 |
| daangn/seed-design | 디자인 토큰 구조, 시맨틱 컬러 |
| formkit/auto-animate | 제로설정 레이아웃 전환 (1줄 적용) |
| design-sparx/mantine-analytics-dashboard | Next.js 16 + Mantine 8 대시보드 구조 |

### UI/UX 패턴 사이트
| 사이트 | URL | 용도 |
|--------|-----|------|
| WWIT | wwit.design | 한국 앱 UI 패턴 (가장 추천) |
| Mobbin | mobbin.com | 글로벌 앱 스크린샷 |
