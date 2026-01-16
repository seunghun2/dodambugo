# 마음부고 프로젝트 브리핑
> 2026-01-16 14:00 기준

---

## 📊 프로젝트 현황

| 항목 | 상태 |
|------|------|
| **도메인** | maeumbugo.co.kr ✅ |
| **호스팅** | Vercel Pro ✅ |
| **DB** | Supabase ✅ |
| **런칭** | 2025-12-28 (Day 20) |

---

## 🏢 사업자 정보

| 항목 | 내용 |
|------|------|
| **상호** | 마음부고 |
| **사업자번호** | 408-22-68851 |
| **대표자** | 김미연 |
| **주소** | 서울시 강남구 압구정로 306 |
| **업종** | 소프트웨어개발 / 통신판매업 |

---

## ✅ 오늘 완료한 작업 (2026-01-16)

### 1. 법적/행정 절차
- [x] **사업자등록** 완료 (408-22-68851)
- [x] **KB에스크로** 판매자 인증마크 등록
- [x] **통신판매업 신고** 접수 (심사 대기 3-5일)
- [x] **카카오 비즈니스 인증** 신청 (1-2일 대기)

### 2. 카카오톡 채널
- [x] **마음부고** 채널 생성 완료
- [x] 아내 계정으로 채널 오너 설정
- [x] 관리자 추가 완료

### 3. 슬랙 알림 자동화 🔔
- [x] Slack Workspace 생성 (마음부고)
- [x] **#01_01_주문알림** 채널 생성
- [x] Webhook URL 발급 및 연동
- [x] `lib/slack.ts` 유틸리티 생성
- [x] **부고장 생성 시** → 슬랙 알림 ✅
- [x] **화환 주문 시** → 슬랙 알림 ✅
- [x] Vercel 환경변수 등록

### 4. SEO 개선 🔍
- [x] `favicon.ico` 메타데이터 연결
- [x] `icon.png` (48x48) 생성 - 구글 권장 크기
- [x] `apple-icon.png` (180x180) 생성
- [x] **JSON-LD 구조화 데이터** 추가
  - Organization (사업자 정보)
  - WebSite (검색 기능)
  - WebApplication (앱 정보)
  - FAQPage (FAQ 리치 스니펫)
- [x] 메타태그 강화 (키워드, GoogleBot 설정)
- [x] verification 태그 정리
- [x] **Google Search Console 색인 요청** 완료

---

## ⏳ 대기 중인 항목

| 항목 | 상태 | 예상 소요 |
|------|------|----------|
| 카카오 사업자 인증 | 심사 중 | 1-2일 |
| 통신판매업 신고 | 심사 중 | 3-5일 |
| Alimtalk 연동 | 카카오 인증 후 | - |
| 구글 SEO 반영 | 크롤링 대기 | 수일~수주 |

---

## 🐛 알려진 버그

| 이슈 | 상태 | 우선순위 |
|------|------|----------|
| `/view/[id]/flower` 404 | 미수정 | 높음 |
| flower-orders API 500 | 점검 필요 | 높음 |

---

## 📁 주요 파일 구조

```
dodam-next/
├── app/
│   ├── api/
│   │   ├── bugo-notify/route.ts    # 부고 생성 알림 API
│   │   └── flower-orders/route.ts  # 화환 주문 API (+슬랙 연동)
│   ├── layout.tsx                  # SEO 메타데이터
│   ├── page.tsx                    # 홈 (JSON-LD 포함)
│   ├── favicon.ico
│   ├── icon.png                    # 48x48 구글용
│   └── apple-icon.png              # 180x180 애플용
├── lib/
│   └── slack.ts                    # 슬랙 알림 유틸리티
├── components/
│   └── KBEscrow.tsx                # KB에스크로 인증마크
└── public/
    ├── robots.txt
    └── sitemap.xml
```

---

## 🔧 환경변수

### .env.local
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
NEXT_PUBLIC_GA_ID=G-6H5TT2F5RB
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Vercel에 등록된 변수
- `SLACK_WEBHOOK_URL` ✅ (All Environments)

---

## 📈 다음 단계

### 🔴 즉시 가능
1. `/view/[id]/flower` 404 버그 수정
2. 감사 페이지 디자인
3. SVG 아이콘 전환 (성능 최적화)

### 🟡 승인 대기 후
1. **Alimtalk 연동** (Solapi 사용)
   - 주문 접수 확인 문자
   - 발인 완료 후 감사 문자
2. **통신판매업 번호** 푸터/페이지에 추가

### 🟢 향후 계획
1. 일일 장례 리포트 (Slack/Email)
2. 꽃집 API 연동 (자동 발주)
3. 어드민 대시보드 고도화

---

## 📞 연락처

- **슬랙:** 마음부고 Workspace
- **카카오톡 채널:** 마음부고
- **이메일:** (설정 필요)

---

*생성일: 2026-01-16 14:00*
