# 업데이트 내역

## 2026-06-22 B2C 입관 제거, 데이터 유실 방지 및 빌드 정상화 핫픽스

### 템플릿 변경 시 데이터 유실 방지
- `app/create/[templateId]/page.tsx`의 localStorage 임시저장 키(`bugo_draft_${templateId}`)를 **`bugo_draft` 공통 키**로 통일했습니다.
- 이제 부고장 작성 중 템플릿을 변경해도 기존 작성 중이던 모든 폼 데이터가 초기화되지 않고 100% 보존됩니다.

### 백업 폴더 컴파일 제외 (Vercel 빌드 에러 해결)
- `app_backup/`, `components_backup/`, `scripts_backup/` 폴더가 TypeScript 스캔 대상에 들어가 `Duplicate identifier 'LayoutProps'` 오류를 일으키며 빌드가 중단되던 현상을 해결했습니다.
- `tsconfig.json`의 exclude에 해당 백업 폴더들을 등록하고, 백업 디렉토리들을 `dodam-next` 저장소 바깥(루트 디렉토리)으로 대피시켰습니다.
- 현재 로컬 빌드 및 컴파일이 깨끗하게 성공하는 상태입니다.

### B2C 입관일 노출 제거 및 DB 검증
- B2C 부고장에서 입관이 노출되지 않도록 하는 핫픽스를 배포 완료했습니다.
- DB에 직접 `null` 값을 넣어 insert하는 테스트를 수행하여, Supabase DB 트리거 오작동 없이 입관일이 정상적으로 `null` 저장되는 것을 최종 검증 완료했습니다.

---

## 2026-02-13 미리보기 모달 리뉴얼 & UI 개선


### 미리보기 모달 리팩토링
- **경쟁사 스타일 확인 화면**: "모바일 부고장 내용을 확인해주세요" 타이틀 + "발인 3일 후 답례메세지를 자동으로 전달드려요" 부제
- **테이블 레이아웃**: 라벨(좌) / 값(우, 볼드) 형식으로 전체 정보 표시
  - 부고장테마, 장례식장정보, 고인정보, 별세일, 입관일, 발인일, 장지
  - 대표상주 (계좌 포함), 추가 상주 (연락처/계좌)
  - 안내사항 (항상 표시, 비어있으면 기본 메세지)
- **헤더 제거**: "부고장 미리보기" 제목 + X 버튼 제거 (수정하기/부고장만들기 버튼으로 충분)
- **footer 바닥 고정**: `position: absolute; bottom: 0`으로 항상 모달 하단 고정
- **대표상주 계좌 버그 수정**: `tempAccount` → `accounts[0]`에서 읽도록 변경

### 부고장 작성 페이지 UI
- `create-page`, `create-main` 에서 `min-height: 100vh` 제거 (불필요한 하단 여백 제거)
- `.bugo-form` padding-bottom: 100px → 20px (하단 빈 공간 축소)

### 부의금 카드결제 비활성화
- 부고 열람 페이지(`ViewContent.tsx`)에서 카드결제 버튼 주석처리
- 고객에게 미완성 기능이 노출되지 않도록 처리
- 추후 기능 완성 시 주석 해제 예정

### 변경 파일
- `app/create/[templateId]/page.tsx` — 미리보기 모달 JSX 리팩토링
- `app/globals.css` — 미리보기 모달 CSS, 작성 페이지 여백 수정
- `app/view/[id]/ViewContent.tsx` — 카드결제 버튼 주석처리
