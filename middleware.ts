import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 차단할 IP 목록
const BLOCKED_IPS = [
  '183.98.166.235', // 아이리스코퍼레이션
  '112.184.95.41',  // 홍길동/신사임당 테스트
];

export function middleware(request: NextRequest) {
  // 클라이언트 IP 가져오기
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';

  // 차단 IP 체크
  if (BLOCKED_IPS.includes(ip)) {
    // 무한 로딩 페이지 😈
    const infiniteLoadingHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>마음부고</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #fff;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
</body>
</html>`;
    return new NextResponse(infiniteLoadingHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return NextResponse.next();
}

// 모든 페이지에 적용 (API, 정적 파일 제외)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
