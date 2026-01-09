# 마음부고 변경 이력

## 2026-01-09

### 장례가이드 페이지
- `/guide` 페이지 신규 생성
- 장례 절차, 비용, 예절, 장례식장 찾기 4가지 카드 UI
- 헤더 네비게이션에 "장례가이드" 메뉴 추가

### 공통 네비게이션 구조 개선
- `MainLayout` 컴포넌트로 헤더 통합 관리
- 홈, FAQ, Guide, Search, Create 페이지 공통 헤더 적용
- 중복 코드 제거 및 유지보수성 향상
- 모바일 `SideMenu`에 장례가이드 링크 추가

### UI 수정
- "자주묻는 질문" → "자주 묻는 질문" 띄어쓰기 수정

### 빌드 오류 수정
- `useSearchParams` Suspense boundary 오류 해결
- `useEffect` + `window.location` 방식으로 변경

### 서버 환경 복구
- npm ghosting (npm install 무한 대기) 해결
- ENOTEMPTY 오류 해결 (Finder 수동 삭제)
- Deep Purge 프로토콜 적용

---

## 2026-01-06

### 검색엔진 등록 (SEO)
- **네이버 서치어드바이저** 등록
  - HTML 메타태그 인증 완료
  - robots.txt 확인
  - 사이트맵 제출
- **구글 서치콘솔** 등록
  - DNS TXT 레코드 인증 완료
  - 사이트맵 제출

### 동적 사이트맵 구현
- `app/sitemap.ts` 동적 생성
- 정적 페이지 7개 포함
- 부고장 페이지 자동 포함 (현재 57개)
- Supabase에서 실시간 조회

### Google Analytics 4
- GA4 설정 (ID: G-6H5TT2F5RB)
- 이벤트 추적 구현:
  - `select_template`: 템플릿 선택
  - `complete_create`: 부고 생성 완료
  - `view`: 부고 조회
  - `share` (kakao/sms/link): 공유
  - `click_map`: 지도/내비
  - `copy_account`: 계좌 복사

### AI 검색 최적화 (LLM SEO)
- `llms.txt` 생성 (AI 크롤러용)
- `llms-full.txt` 상세 문서 생성
- `robots.txt` AI 봇 허용 규칙 추가
- Schema.org JSON-LD 메인 페이지에 추가

### 배포 자동화
- Vercel Production 브랜치: `main` → `nextjs`
- GitHub Default 브랜치: `main` → `nextjs`
- 이제 `git push`만으로 자동 Production 배포

### 개발/프로덕션 DB 분리
- **개발용 Supabase 프로젝트 생성** (maeumbugo-dev)
  - URL: `https://mnlyqhrjnpbkleenmszm.supabase.co`
  - Region: Seoul (ap-northeast-2)
- 테이블 스키마 복사 (bugo, drafts, facilities, guestbook, inquiries)
- 테스트 데이터 30개 생성
- `.env.local` 개발 DB 설정
  - 로컬: 개발 DB (maeumbugo-dev)
  - Production: 기존 DB (dodambugo)

### 버그 수정
- **상주 목록 중복 표시** 버그 수정
  - 대표상주가 mourners 배열에도 포함될 때 한 번만 표시되도록 수정

### 모바일 메인 UX 개선
- **플로팅 CTA 버튼** 추가 (모바일 전용)
  - 하단 고정 "부고장 만들기" 버튼
  - 하단에서 슬라이드업 애니메이션
  - 검은색 말풍선 툴팁: "링크형 부고장 무료 제작하기"
- **상단 nav-cta 숨김** (모바일에서 플로팅 버튼으로 대체)
- **검색바 입력 가능** (기존: 클릭 시 페이지 이동)
- **검색 자동완성** 기능
  - 실시간 DB 검색 (300ms 디바운스)
  - 상주 이름 매칭 우선 정렬
  - 검색어 하이라이트 (노란색)
  - 형식: `상주 김상민 (故 홍길동) | 발인 01/08`

---

## 2026-01-05

### 브랜드명 변경
- **도담부고 → 마음부고** 전체 변경
- 헤더, 푸터, 메타태그, OG 태그 등 50곳 이상 수정
- 문서 파일 (README, CHANGELOG, TODO 등) 전체 수정

### 도메인 & 카카오 설정
- 도메인 구매: maeumbugo.co.kr (가비아)
- Vercel 도메인 연결
- 카카오 새 앱 생성 (마음부고, ID: 1364022)
- 카카오 JS SDK 도메인 등록

---

## 2026-01-04

### UI/UX 개선

#### 모달 스타일 통일
- 모달 버튼 색상: 파란색 → 브랜드 컬러(#FFCC45)
- 모달 버튼 텍스트: 흰색 → 검은색(#191919)
- 임시저장 모달 문구: "임시저장된 정보" → "임시저장된 부고장"
- 개인정보 모달 "전문보기" 링크: 검은색(#191919)
- 개인정보 모달 "확인" 버튼 글씨: 검은색(#191919)

#### 모달 z-index 수정
- 모달 열렸을 때 헤더가 위에 보이는 문제 해결
- modal-overlay z-index: 99999 (인라인 스타일로 강제)
- 계좌 등록 모달, 상주별 계좌 모달, 임시저장 모달 모두 적용

#### 페이지 레이아웃 통일
- FAQ 페이지 헤더 스타일 통일 (section-header marginBottom: 16px)
- Contact 페이지 헤더 스타일 통일
- 개인정보처리방침 섹션 간격 줄임 (32px → 20px)

### 부고 검색 페이지 개선
- 제목/부제목 패딩 줄임
- 검색 버튼 아이콘만 표시 (텍스트 제거)
- 카드 레이아웃 변경:
  - 첫 줄: 부고번호 + 발인일
  - 둘째 줄: 상주 이름(故고인명)
  - 셋째 줄: 장례유형 | 장례식장
- 페이지네이션: 화살표 아이콘 + 브랜드 컬러(#FFCC45)

### OG 메타태그 개선
- 제목 형식: "故 OOO님 부고(향년 OO세)"
- 설명 형식: "장례식장 호실 | 날짜 별세하셨음을 삼가 알려드립니다."
- 이미지: 직사각형 og-bugo-v4.png

### 카카오 공유 이미지
- og-bugo-v4.png 적용 (캐시 문제 해결)

### 디자인 시스템
- 브랜드 컬러 #FFCC45 문서화

---

## 2026-01-03

### 부고 뷰 페이지
- 섹션 순서 변경
- 장례유형별 메시지 표시
- 발인 시간 포맷 개선

---

*이전 변경 내역은 Git 히스토리 참조*
