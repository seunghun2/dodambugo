---
name: deploy
description: Vercel 프로덕션 배포 절차. 배포할 때 반드시 참조.
---

# 배포 가이드

## 배포 명령어

```bash
# 1. 빌드 확인 (필수!)
cd /Users/el/Desktop/dodam/jojo && npm run build

# 2. 배포
cd /Users/el/Desktop/dodam && npx vercel --prod --force --yes
```

> ⚠️ 반드시 `/Users/el/Desktop/dodam` (루트)에서 실행. `jojo/` 안에서 실행하면 안 됨.

## 배포 전 체크리스트

1. `npm run build` 성공 확인
2. 관련 테스트 통과 확인 (`npx jest`)
3. git commit 완료

## 되돌리기

```bash
git revert HEAD
cd /Users/el/Desktop/dodam && npx vercel --prod --force --yes
```

## .vercelignore

`/Users/el/Desktop/dodam/.vercelignore`에 배포 불필요 파일 목록이 있음.
대용량 파일 추가 시 반드시 여기에도 추가할 것:
- `tmp` (빌드 캐시 4GB)
- `*.xd`, `*.psd` (디자인 원본)
- `*.pdf`, `*.pptx` (문서)
- `node_modules`, `.next`, `.git` (자동 제외)

## 배포 URL

- 프로덕션: https://dodambugo.com
- Vercel 대시보드: https://vercel.com/daedaesonsons-projects/dodam-next

## 주의사항

- 라이브 서비스이므로 배포 전 충분히 검증
- 배포 후 문제 시 즉시 `git revert` → 재배포
- `.vercelignore` 없이 배포하면 용량 초과로 실패함 (프로젝트 루트에 대용량 디자인 파일 있음)
