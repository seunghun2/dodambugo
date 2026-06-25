# 마음부고 프로젝트 규칙

> **이 파일은 AI가 작업 시작 시 자동으로 읽습니다.**

## 프로젝트 구조

```
/Users/el/Desktop/dodam/          ← Vercel 배포 루트
├── jojo/                         ← Next.js 앱 (메인 코드)
│   ├── app/view/                 ← B2C 부고 보기
│   ├── app/b2b/                  ← B2B 파트너 앱
│   ├── lib/                      ← 공통 유틸리티
│   └── __tests__/                ← 테스트
├── js/                           ← 레거시 JS (ES module 불가)
├── css/                          ← 레거시 CSS
└── .vercelignore                 ← 배포 제외 목록
```

## 핵심 규칙

### 1. 라이브 서비스
이 프로젝트는 **실제 운영 중인 서비스**입니다.
- 코드 수정 전 반드시 영향 범위 파악
- 배포 전 `npm run build` 확인 필수
- 되돌리기: `git revert HEAD && git push`

### 2. 배포
배포 방법은 `.agents/skills/deploy/SKILL.md` 참조.

### 3. 장례 표시 로직
장례 타입별 표시 규칙은 `.agents/skills/funeral-display/SKILL.md` 참조.
**절대로** ViewContent에 장례 타입 문자열을 직접 비교하지 말 것 → `lib/funeral-display.ts` 함수 사용.

### 4. 디자인 규칙
`.agent/design-system.md` 참조.

### 5. 코드 스타일
- 한국어 주석 사용
- B2C/B2B 동일 로직은 `lib/`에 공통화
- 레거시 `js/` 파일은 ES module import 불가 — 인라인 로직 유지

### 6. 테스트
```bash
cd /Users/el/Desktop/dodam/jojo
npx jest                                    # 전체 테스트
npx jest __tests__/funeral-display.test.ts  # 장례 표시 테스트
```
