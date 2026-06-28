# 🔄 위패/축문/지방 개발 진행 상황

> 마지막 업데이트: 2026-06-28 08:14 KST

---

## 📊 전체 진행률

| 단계 | 상태 | 담당 |
|:---|:---|:---|
| 1. 대시보드 UI 수정 (화환→위패/축문/지방) | ✅ 완료 | 메인 에이전트 |
| 2. 핵심 로직 라이브러리 개발 (단설 전용/종교별/규격별) | ✅ 완료 (테스트 16/16 통과) | 메인 에이전트 |
| 3. 위패/축문/지방 페이지 UI (단설 단일화 및 기독교 직분 연계) | ✅ 완료 | 메인 에이전트 |
| 4. 세부 장례 축문 10종 복원 및 종교 연동 | ✅ 완료 | 메인 에이전트 |
| 5. 명조체(바탕체) 폰트 강제화 및 종교 SVG 문양 탑재 | ✅ 완료 | 메인 에이전트 |
| 6. 아래에서 위로 올라오는 바텀시트 날짜 피커 연동 | ✅ 완료 | 메인 에이전트 |
| 7. UI 상의 이모지 전면 제거 및 단정한 SVG 교체 | ✅ 완료 | 메인 에이전트 |
| 8. 전통 이중 금선 및 검정 아웃라인 액자/위패 스킨 적용 | ✅ 완료 | 메인 에이전트 |
| 9. 최종 빌드 및 타입 검증 | ✅ 완료 | 메인 에이전트 |

---

## 📁 생성/수정된 파일 목록

### ✏️ 수정된 파일
| 파일 | 변경 내용 |
|:---|:---|
| [dashboard/page.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/dashboard/page.tsx) | "화환 보내기" → "위패/축문/지방" 버튼 교체 |
| [lib/ritual/jibang.ts](file:///Users/el/Desktop/dodam/jojo/lib/ritual/jibang.ts) | 쌍설 제거, 단설 전용으로 재편. 일반, 불교(영가), 기독교(안식), 천주교(세례명/직분/세로기도) 문구 조립 엔진 리팩토링 |
| [lib/ritual/wipae.ts](file:///Users/el/Desktop/dodam/jojo/lib/ritual/wipae.ts) | 쌍설 제거, 종교별 룰 및 기도문구 연계 위패 렌더링 지원 |
| [lib/ritual/chukmun.ts](file:///Users/el/Desktop/dodam/jojo/lib/ritual/chukmun.ts) | 세부 장례식 축문 10종 완벽 탑재 (초혼, 발인, 평토, 성분, 산신, 삼우, 위령 등). 종교(`religion`) 상태를 매핑하여 기독교/천주교 시 현대적 쉬운 한글 추도 기도문으로 자동 분기 기능 구현. |
| [app/b2b/ritual/ritual.module.css](file:///Users/el/Desktop/dodam/jojo/app/b2b/ritual/ritual.module.css) | 지방/위패/축문 텍스트 폰트를 고딕체에서 전통 바탕/명조체로 전면 수정. 미리보기 용지 테두리를 고급 금박 한지 스킨(3px double #bda06a 및 1px 검정 내선)으로 수정. |
| [app/b2b/ritual/[bugoId]/page.tsx](file:///Users/el/Desktop/dodam/jojo/app/b2b/ritual/[bugoId]/page.tsx) | 명조체 바탕 폰트와 기독교/천주교/불교 종교별 SVG 문양 연동. 날짜 입력 상자를 터치하면 아래에서 위로 올라오는 부고온 고유의 바텀시트 달력 피커(`CalendarPicker`)가 열리도록 연동 완료. 날짜 표기 형식 또한 `2026. 07. 01.`로 닷(.) 포맷 조절. `🖨️`, `📲`, `📅` 등 불필요한 이모지를 전면 제거하고 단정한 텍스트 및 SVG 라인 캘린더 아이콘으로 전격 대체. A4 인쇄 화면에도 동일하게 이중 골드+블랙 내선 전통 스킨 테두리 및 종교 SVG 탑재 완료. |

---

## 🧪 테스트 결과

| 테스트 | 결과 | 시간 |
|:---|:---|:---|
| `npx jest __tests__/ritual.test.ts` | ✅ **16 passed, 0 failed** | 08:14 KST |
| `npx tsc --noEmit` | ✅ **Type Check Passed (No errors)** | 08:14 KST |
