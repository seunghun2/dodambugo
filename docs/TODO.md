# 마음부고 할 일 목록

---

## ✅ 오늘 완료한 것 (2026-01-06)

### 검색엔진 등록 (SEO)
- [x] **네이버 서치어드바이저** 사이트 등록
  - HTML 메타태그 인증 완료
  - robots.txt 확인
  - 사이트맵 제출
- [x] **구글 서치콘솔** 사이트 등록
  - DNS TXT 레코드 인증 완료
  - 사이트맵 제출 (sitemap.xml)

### 동적 사이트맵
- [x] **sitemap.xml 동적 생성** 구현
  - 정적 페이지: `/`, `/create`, `/search`, `/faq`, `/contact`, `/terms`, `/privacy`
  - 동적 페이지: 모든 부고장 URL (`/view/[id]`) 자동 포함
  - 현재 57개 부고장 포함
  - Supabase에서 실시간 조회

### Google Analytics 4
- [x] **GA4 설정 완료** (ID: G-6H5TT2F5RB)
- [x] **이벤트 추적** 구현
  - `select_template`: 템플릿 선택 페이지 진입
  - `complete_create`: 부고 생성 완료
  - `view`: 부고 조회
  - `share` (kakao/sms/link): 공유 버튼 클릭
  - `click_map`: 지도/내비 클릭
  - `copy_account`: 계좌번호 복사

### AI 검색 최적화 (LLM SEO)
- [x] **llms.txt** 파일 생성
  - 위치: `/public/llms.txt`
  - ChatGPT, Perplexity 등 AI가 사이트 이해하도록
- [x] **llms-full.txt** 상세 문서 생성
  - FAQ, 경쟁사 비교, 사용 시나리오 포함
- [x] **robots.txt** AI 봇 허용
  - GPTBot, ChatGPT-User, PerplexityBot, Claude-Web, anthropic-ai
- [x] **Schema.org JSON-LD** 추가
  - WebApplication 타입
  - FAQPage 포함
  - 메인 페이지에 내장

### 배포 자동화
- [x] **Vercel Production 브랜치** 변경
  - `main` → `nextjs`
  - 이제 `git push`만 하면 자동 Production 배포
- [x] **GitHub Default 브랜치** 변경
  - `main` → `nextjs`
  - GitHub에서도 `nextjs`가 기본으로 표시

---

## 🟡 나중에 할 것

### OG 이미지 교체 (선택)
- [ ] `/public/images/og-image.png` 새로 만들기 (마음부고 브랜드)

---

## 🟡 수익화 기능 (사업자 필요)

### 화환 주문
- [ ] 화환 상품 페이지 구현
- [ ] 결제 시스템 연동 (토스페이먼츠)
- [ ] 화훼업체 API/알림 연동
- [ ] 부고 뷰 페이지에 화환 버튼

### 조의금
- [ ] 모바일 조의금 결제 페이지
- [ ] 상주 계좌 정산 시스템
- [ ] 수수료 자동 계산

### 답례품
- [ ] 답례품 상품 페이지
- [ ] 주문/배송 시스템

---

## 🟢 UX 개선

- [ ] 부고장 생성 완료율 ↑
- [ ] 모바일 최적화 점검
- [ ] 로딩 속도 개선

---

## 🔵 마케팅/광고

- [ ] 네이버 광고 세팅
- [ ] 키워드 최적화
- [ ] SEO 블로그 글

---

## 💜 2호 사이트 (나중에)

- [ ] 도메인 구매
- [ ] 디자인 차별화
- [ ] 별도 사업자?

---

## ✅ 완료 기록

### 2026-01-06
- [x] 네이버/구글 검색엔진 등록
- [x] 동적 사이트맵 (57개 부고 포함)
- [x] GA4 설정 + 이벤트 추적 8종
- [x] AI SEO (llms.txt, Schema.org)
- [x] Vercel/GitHub 자동 배포 설정

### 2026-01-05
- [x] 브랜드명 변경: 도담부고 → 마음부고 (50곳+)
- [x] 메타태그, OG 태그 텍스트 변경
- [x] 문서 파일 전체 업데이트
- [x] 도메인 구매: maeumbugo.co.kr (가비아)
- [x] Vercel 도메인 연결
- [x] 카카오 새 앱 생성 (마음부고)
- [x] 카카오 JS SDK 도메인 등록

### 2026-01-04
- [x] 모달 스타일 통일 (버튼 색상, z-index)
- [x] 부고 검색 모바일 레이아웃 개선
- [x] OG 메타태그 형식 변경
- [x] 카카오 공유 이미지 캐시 해결
- [x] 디자인 시스템 문서화
- [x] 수익 분석 문서 작성

---

*마지막 업데이트: 2026-01-06*
