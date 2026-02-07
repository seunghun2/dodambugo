import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 하드코딩 차단 IP (항상 적용)
const HARDCODED_BLOCKED_IPS = [
  '183.98.166.235', // 아이리스코퍼레이션
  '112.184.95.41',  // 홍길동/신사임당 테스트
];

// DB 차단 IP 캐시 (5분마다 갱신)
let cachedBlockedIPs: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

// Supabase 직접 접근 (미들웨어에서 자기 API 호출 방지)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getBlockedIPs(): Promise<string[]> {
  const now = Date.now();

  // 캐시 유효하면 바로 반환
  if (now - lastFetchTime < CACHE_TTL && cachedBlockedIPs.length > 0) {
    return [...HARDCODED_BLOCKED_IPS, ...cachedBlockedIPs];
  }

  // Supabase REST API 직접 호출 (자기 API 호출 방지)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return [...HARDCODED_BLOCKED_IPS];
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blocked_ips?is_active=eq.true&select=ip_address`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      cachedBlockedIPs = data.map((item: { ip_address: string }) => item.ip_address);
      lastFetchTime = now;
    }
  } catch {
    // 실패 시 캐시 유지
  }

  return [...HARDCODED_BLOCKED_IPS, ...cachedBlockedIPs];
}

// 관리자 IP (로그 제외)
const ADMIN_IPS = ['14.38.63.241'];

// 접속 로그 기록 (비동기, 논블로킹)
function logAccess(ip: string, path: string, userAgent: string, referer: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  if (path.startsWith('/admin')) return;
  if (ADMIN_IPS.includes(ip)) return;

  fetch(`${SUPABASE_URL}/rest/v1/access_logs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ip_address: ip, path, user_agent: userAgent, referer }),
  }).catch(() => { });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 클라이언트 IP 가져오기
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';

  // 접속 로그 기록 (논블로킹)
  logAccess(
    ip,
    path,
    request.headers.get('user-agent') || '',
    request.headers.get('referer') || ''
  );

  // 차단 IP 체크
  const blockedIPs = await getBlockedIPs();

  if (blockedIPs.includes(ip)) {
    // 무한 로딩 페이지 😈
    const infiniteLoadingHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>마음부고</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
