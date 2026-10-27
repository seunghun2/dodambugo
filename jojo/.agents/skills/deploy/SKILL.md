---
name: deploy
description: Vercel 프로덕션 배포 절차. 배포할 때 반드시 참조.
---

# 배포 가이드

## 배포 명령어

```bash
# 1. 빌드 확인 (필수!)
cd /Users/el/Desktop/dodam/jojo && npm run build

# 2. git commit & push (Vercel 자동 프로덕션 배포 트리거 - 1회만 실행됨)
cd /Users/el/Desktop/dodam
git add jojo/수정한파일
git commit -m "feat(b2b): 설명"
git push origin main
```

> ⚠️ **주의 (비용 절감 필수 규칙)**: 
> `git push origin main`을 실행하면 Vercel이 자동으로 프로덕션 배포를 1회 실행합니다.
> **절대로 수동 Deploy Hook(curl)을 중복 호출하지 말 것!** (빌드 CPU 요금이 2배로 청구됨)

## 배포 전 체크리스트

1. `npm run build` 성공 확인
2. 관련 테스트 통과 확인 (`npx jest`)
3. git commit & push 완료
4. jojo/ 외 파일이 커밋에 섞이지 않았는지 확인: `git show --name-only HEAD | grep -v "^jojo/"`

## 되돌리기

```bash
git revert HEAD
git push origin main
```

## .vercelignore

`/Users/el/Desktop/dodam/.vercelignore`에 배포 불필요 파일 목록이 있음.
대용량 파일 추가 시 반드시 여기에도 추가할 것:
- `tmp` (빌드 캐시)
- `*.xd`, `*.psd` (디자인 원본)
- `*.pdf`, `*.pptx` (문서)
- `node_modules`, `.next`, `.git` (자동 제외)

## 배포 URL

- 프로덕션: https://maeumbugo.co.kr (B2B: https://bugoon.maeumbugo.co.kr)
- Vercel 대시보드: https://vercel.com/daedaesonsons-projects/dodam-next

## 주의사항

- 라이브 서비스이므로 배포 전 충분히 검증
- 배포 후 문제 시 즉시 `git revert` → 재배포
- `jojo/` 안에 android/, ios/ 등 앱 빌드 폴더가 있으면 CLI 배포 불가 (Deploy Hook 사용)
- vercel.json의 `ignoreCommand`에 `[skip ci]`를 커밋 메시지에 넣으면 빌드 스킵됨
