# 📢 부고온 B2B & B2C 슬랙 웹훅 채널 연동 가이드

이 문서는 마음부고 / 부고온 서비스의 슬랙(Slack) 알림 채널 목록 및 환경변수 매핑 가이드입니다.

---

## 📌 B2B 파트너 전용 슬랙 채널 목록

| 알림 분류 | 환경변수 Key | 웹훅 URL | 설명 |
| :--- | :--- | :--- | :--- |
| **B2B 부고장 작성** | `SLACK_WEBHOOK_BUGO` | `https://hooks.slack.com/services/T0A518DUP6K/***/***` | B2B 파트너(지도사)가 모바일 부고장을 생성/수정/발송할 때 수신 |
| **B2B 회원가입 / 정산 / 출금** | `SLACK_WEBHOOK_URL` / `SLACK_WEBHOOK_DEPOSIT` | `https://hooks.slack.com/services/T0A518DUP6K/***/***` | B2B 파트너 신규 가입, 화환 결제 수당 적립(20,000원), 출금 신청/승인 수신 |

---

## 📌 B2C 및 플랫폼 알림 슬랙 채널 목록 (절대 수정 금지!)

> ⚠️ **경고**: 아래 B2C 채널들은 기존 마음부고 실서비스 영업 및 세무/운영과 실시간 연동되어 있으므로 절대 수정하거나 건드리지 않습니다.

| 알림 분류 | 환경변수 Key | 설명 |
| :--- | :--- | :--- |
| **01_01_부고알림** | `SLACK_WEBHOOK_BUGO` (레거시 B2C) | 일반 B2C 부고장 생성 및 발송 알림 수신 |
| **01_02_화환구매** | `SLACK_WEBHOOK_FLOWER` | 조문객 B2C 화환 주문 완료 시 수신 |
| **01_03_조의금판매** | `SLACK_WEBHOOK_CONDOLENCE` | 조문객 B2C 부의금/조의금 송금 시 수신 |
| **99_00_예치금금액** | `SLACK_WEBHOOK_DEPOSIT` | B2C 상주 예치금 잔액 및 정산 알림 수신 |
| **장지 이용후기** | `SLACK_WEBHOOK_REVIEW` | 조문객/상주 장지 후기 작성 시 수신 |

---

## ⚙️ 시스템 구현 유틸리티 위치

* **슬랙 알림 유틸리티 모듈**: [`lib/slack.ts`](file:///Users/el/Desktop/dodam/jojo/lib/slack.ts)
* **Vercel 실서버 환경변수**: Vercel Dashboard ➡️ Project Settings ➡️ Environment Variables
* **로컬 환경변수 파일**: `.env.local` 및 `.env.production`

---

## 💡 수칙 (Guidelines)

1. 모든 슬랙 알림 메시지 텍스트에서는 **이모지를 100% 제거**하고 품격 있는 정통 텍스트 포맷(`[부고온 B2B] ...`)을 사용합니다.
2. 새 웹훅 채널이 변경되거나 추가될 경우 `lib/slack.ts` 와 이 문서를 함께 업데이트합니다.
