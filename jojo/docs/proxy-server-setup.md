# 프록시 서버 셋업 가이드 (네이버 클라우드)

## 왜 필요한가?

Innopay 송금 API는 **IP 화이트리스트** 방식이라, 허용된 IP에서만 요청 가능.
Vercel은 배포할 때마다 IP가 바뀌므로 직접 호출 불가.
→ **고정 IP를 가진 프록시 서버**를 중간에 두면 해결!

```
[Vercel 서버] → [프록시 서버 (고정IP)] → [Innopay API]
```

## 네이버 클라우드 서버 생성 과정

### 1. VPC 생성
- **VPC 이름**: `dodam-vpc`
- **IP 주소 범위**: `10.0.0.0/16` (사설 IP 범위)
- **유형**: NORMAL

### 2. Subnet 생성
- **Subnet 이름**: `dodam-subnet`
- **VPC**: dodam-vpc
- **IP 주소 범위**: `10.0.0.0/24`
- **가용 Zone**: KR-1
- **Internet Gateway 전용 여부**: **Y (Public)** ← 공인 IP 연결 위해 필수!
- **용도**: 일반

### 3. 서버 생성 설정
- **서버 이미지**: Ubuntu 24.04 base
- **서버 스펙**: mi1-g3 (vCPU 1EA, Memory 1GB) — Micro
- **서버 이름**: `dodam-proxy`
- **서버 가수**: 1
- **요금제**: 월요금제
- **반납 보호**: 해제

### 4. Network Interface
- **디바이스**: eth0
- **Subnet**: dodam-subnet | KR-1 | 10.0.0.0/24 | Public
- **IP**: 자동할당

### 5. 공인 IP
- **새로운 공인 IP 할당** 선택 (월 4,032원)
- 이 IP가 Innopay에 등록할 **고정 IP**!

### 6. 스토리지
- 기본 스토리지 10GB, CB1 (기본값)

### 7. 인증키
- **인증키 이름**: `dodam-proxy-key`
- `.pem` 파일 → `dodam-next/네이버 인증키/dodam-proxy-key.pem`에 저장

### 8. 네트워크 접근 설정 (ACG)
- **ACG**: `dodam-vpc-default-acg`
- 추후 포트 규칙 추가 필요:
  - TCP 22 (SSH 접속)
  - TCP 443 (HTTPS 프록시)

---

## 서버 생성 후 할 일

### 1. 공인 IP 확인
- 서버 상태가 "운영중"이 되면 공인 IP 확인
- 이 IP를 **Innopay에 화이트리스트 등록 요청**

### 2. SSH 접속
```bash
chmod 400 ~/Desktop/dodam/dodam-next/네이버\ 인증키/dodam-proxy-key.pem
ssh -i ~/Desktop/dodam/dodam-next/네이버\ 인증키/dodam-proxy-key.pem root@[공인IP]
```

### 3. 프록시 서버 설치 (Nginx)
```bash
apt update && apt install -y nginx
```

### 4. Nginx 프록시 설정
```nginx
server {
    listen 443 ssl;
    server_name [공인IP];

    # SSL 인증서 설정 (Let's Encrypt 등)

    location /api/innopay/ {
        proxy_pass https://api.innopay.co.kr/;
        proxy_set_header Host api.innopay.co.kr;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. ACG 포트 오픈
- 네이버 클라우드 콘솔 → ACG → `dodam-vpc-default-acg`
- Inbound 규칙 추가:
  - TCP / 22 / 0.0.0.0/0 (SSH)
  - TCP / 443 / 0.0.0.0/0 (HTTPS)

### 6. Vercel 코드 수정
- `app/api/condolence/transfer/route.ts`에서 Innopay API URL을 프록시 서버로 변경:
```typescript
// 변경 전
const response = await fetch('https://api.innopay.co.kr/...');

// 변경 후
const response = await fetch('https://[공인IP]/api/innopay/...');
```

### 7. Innopay에 IP 등록
- Innopay 담당자에게 프록시 서버의 **공인 IP** 전달
- 화이트리스트 등록 완료 후 송금 API 테스트

---

## 비용 요약
| 항목 | 월 비용 |
|------|--------|
| Micro 서버 (vCPU 1, 1GB) | ~약 15,000원 |
| 공인 IP | 4,032원 |
| **합계** | **~약 19,000원/월** |

---

## 현재 진행 상태
- [x] VPC 생성 (dodam-vpc)
- [x] Subnet 생성 (dodam-subnet, Public)
- [x] 서버 생성 요청 (dodam-proxy)
- [x] 인증키 생성 및 저장 (dodam-proxy-key.pem)
- [ ] 서버 생성 완료 대기 (5~10분)
- [ ] 공인 IP 확인
- [ ] ACG 포트 규칙 추가 (22, 443)
- [ ] SSH 접속 및 Nginx 설치
- [ ] 프록시 설정
- [ ] Innopay에 IP 등록 요청
- [ ] 코드 수정 및 배포
- [ ] 송금 테스트
