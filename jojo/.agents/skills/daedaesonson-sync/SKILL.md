---
name: daedaesonson-sync
description: 마음부고 장지 이용 후기(burial_reviews)와 대대손손(daedaesonson.com) 전국 장지 DB 및 리뷰(Review) 자동 연동 시스템 가이드
---

# 🕊️ 마음부고 ⇄ 대대손손 장지 리뷰 자동 동기화 시스템

> **이 스킬셋은 마음부고에서 수집된 장지 후기를 대대손손 전국 장지 비교 플랫폼으로 안전하게 자동 매칭 및 동기화하기 위한 엔지니어링 표준입니다.**

---

## 1. 🏗️ 아키텍처 개요

- **마음부고 DB**: Supabase `tbteghoppechzotdojna`
  - 테이블: `burial_reviews` (부고별 상주가 작성한 장지 후기)
- **대대손손 DB**: Supabase `jbydmhfuqnpukfutvrgs`
  - 테이블: `Facility` (전국 1,495개 공공 e하늘 등록 장례식장/봉안당/묘지/화장시설)
  - 테이블: `Review` (시설별 리뷰, `source: 'maeumbugo'`, `photos: string[]`)
- **실행 모듈**: `jojo/lib/daedaesonson-sync.ts`
- **호출 지점**: `jojo/app/api/burial-review/route.ts` (POST 핸들러)

---

## 2. 🛡️ 4대 안전 가드 (오매칭 및 장애 전파 방지)

1. **Non-blocking (Fire-and-Forget)**
   - 대대손손 동기화는 `syncReviewToDaedaesonson().catch(...)`로 비동기 실행됩니다.
   - 대대손손 DB 네트워크 지연이나 에러가 발생해도 마음부고 사용자의 리뷰 저장 응답(200 OK)은 0.1초도 지연되지 않습니다.
2. **별칭 사전 (ALIAS_MAP) 최우선 매칭**
   - '벽제승화원', '벽제화장장' 등 빈출 통칭은 `park-1479`(서울시립승화원)로 100% 즉시 매칭됩니다.
3. **블랙리스트 & 지역명 단독 입력 자동 스킵**
   - '선영', '선산', '화장 후 봉안', '미정', '부산 기장군' 등 일반명사/지역명은 매칭 시도 없이 자동 스킵됩니다.
4. **유사도 75% 임계값 (Threshold)**
   - Bigram(Dice 계수) 유사도가 75% 미만인 애매한 시설은 억지로 매칭하지 않고 대대손손 반영을 거부합니다.
   - 예: 국립현충원, 호국원, 사설 기독교 시설 등 e하늘 미등록 시설은 오매칭 없이 안전하게 미매칭 처리됩니다.

---

## 3. 📂 파일 탐색 무한로딩 방지 규칙 (.ignore)

- 프로젝트 루트에는 2.65GB XD 파일 등 거대 바이너리가 존재합니다.
- 루트의 `.ignore` 파일에 `*.xd`, `*.psd`, `*.ai`, `*.mov`, `*.zip`, `node_modules/`가 등록되어 있습니다.
- CLI 검색(`grep`, `find`) 시 반드시 `.ignore`를 존중하거나 대용량 바이너리 폴더를 제외해야 합니다.

---

## 4. 🔑 필수 환경변수 (Vercel)

```env
DAEDAE_SUPABASE_URL="https://jbydmhfuqnpukfutvrgs.supabase.co"
DAEDAE_SUPABASE_SERVICE_KEY="sb_secret_***" # 로컬 .env.local 또는 Vercel 환경변수 등록값 참조
```
