import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 무한 로딩 페이지 (차단된 IP/국가에 표시) 😈
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

// 하드코딩 차단 IP (항상 적용)
const HARDCODED_BLOCKED_IPS = [
  '183.98.166.235', // 아이리스코퍼레이션
  '112.184.95.41',  // 홍길동/신사임당 테스트
];

// 관리자 IP (화이트리스트 — 차단/로그 제외)
const ADMIN_IPS = ['14.38.63.241', '127.0.0.1', '::1', '117.111.6.111'];

// DB 차단 IP 캐시 (5분마다 갱신)
let cachedBlockedIPs: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 부고 대량 열람 감지 (IP → 고유 부고번호 Set)
const viewTracker: Map<string, Set<string>> = new Map();

// 총 방문 횟수 감지 (IP → 카운트) - 같은 페이지 반복 방문 감지
const visitCounter: Map<string, number> = new Map();
let trackerResetTime = Date.now();
const TRACKER_TTL = 24 * 60 * 60 * 1000; // 24시간마다 리셋
const VIEW_THRESHOLD = 5; // 5개 이상 다른 부고 열람 → 자동 차단

const VISIT_THRESHOLD = 50; // 24시간 내 50회 이상 총 방문 → 자동 차단

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

// 부고 대량 열람 감지 + 자동 차단
function trackBugoView(ip: string, bugoNumber: string) {
  // 24시간마다 트래커 리셋 (메모리 관리)
  const now = Date.now();
  if (now - trackerResetTime > TRACKER_TTL) {
    viewTracker.clear();
    visitCounter.clear();
    trackerResetTime = now;
  }

  if (!viewTracker.has(ip)) {
    viewTracker.set(ip, new Set());
  }
  const viewed = viewTracker.get(ip)!;
  viewed.add(bugoNumber);

  // 임계값 초과 → 자동 차단 + 슬랙 알림
  if (viewed.size >= VIEW_THRESHOLD) {
    const reason = `[자동] 부고 대량 열람 (${viewed.size}건: ${[...viewed].join(', ')})`;
    autoBlockIP(ip, reason);
    notifySlack(ip, reason);
    // 차단 후 캐시에 즉시 추가 (DB 갱신 전에도 적용)
    if (!cachedBlockedIPs.includes(ip)) {
      cachedBlockedIPs.push(ip);
    }
    viewTracker.delete(ip); // 트래커에서 제거
  }
}



// IP 자동 차단 (DB 저장)
function autoBlockIP(ip: string, reason: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  fetch(`${SUPABASE_URL}/rest/v1/blocked_ips`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({ ip_address: ip, reason, is_active: true }),
  }).catch(() => { });
}

// 슬랙 알림 (경쟁사 의심)
function notifySlack(ip: string, reason: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 *경쟁사 의심 IP 자동 차단*\nIP: \`${ip}\`\n사유: ${reason}\n\n👉 /admin/blocked-ips 에서 확인`,
    }),
  }).catch(() => { });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 클라이언트 IP 가져오기
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';

  // 관리자는 모든 차단/감지 스킵 (하드코딩 IP + 어드민 로그인 쿠키)
  const isAdminCookie = request.cookies.get('admin_ip')?.value === 'true';
  if (ADMIN_IPS.includes(ip) || isAdminCookie) {
    return NextResponse.next();
  }

  // 접속 로그 기록 (논블로킹, 어드민 제외 후)
  logAccess(
    ip,
    path,
    request.headers.get('user-agent') || '',
    request.headers.get('referer') || ''
  );

  // 🇨🇳 중국 IP 차단 (Vercel geo 감지 + IP 대역 fallback)
  const country = (request as any).geo?.country || request.headers.get('x-vercel-ip-country') || '';
  if (country === 'CN') {
    return new NextResponse(infiniteLoadingHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 봇/크롤러 User-Agent 감지
  const ua = request.headers.get('user-agent') || '';

  // Vercel + 검색엔진 봇은 화이트리스트 (감지/차단 스킵)
  const friendlyBots = /vercel|googlebot|bingbot|yandex|naverbot|daumoa|kakaotalk/i;
  if (friendlyBots.test(ua)) {
    return NextResponse.next();
  }

  // 악성 봇/크롤러 감지 → 자동 차단 (모든 페이지)
  const botPatterns = /python|scrapy|curl\/|wget|httpclient|java\/|libwww|mechanize|phantom|selenium/i;
  if (botPatterns.test(ua)) {
    autoBlockIP(ip, `[자동] 봇/크롤러 감지 (UA: ${ua.substring(0, 80)})`);
    notifySlack(ip, `[자동] 봇/크롤러 감지 (UA: ${ua.substring(0, 80)})`);
    if (!cachedBlockedIPs.includes(ip)) {
      cachedBlockedIPs.push(ip);
    }
  }

  // 부고 열람 감지 (/view/숫자 패턴만)
  const bugoMatch = path.match(/^\/view\/(\d+)$/);
  if (bugoMatch) {
    trackBugoView(ip, bugoMatch[1]);
  }



  // 총 방문 횟수 감지 (같은 페이지 반복 방문 포함, /view·/create·/guide·/admin 제외 - 고객/관리자 정상 이용)
  if (!/\.(css|js|json|ico|png|jpg|svg|webp)$/.test(path) && !path.startsWith('/view') && !path.startsWith('/create') && !path.startsWith('/guide') && !path.startsWith('/admin')) {
    const count = (visitCounter.get(ip) || 0) + 1;
    visitCounter.set(ip, count);
    if (count >= VISIT_THRESHOLD && !cachedBlockedIPs.includes(ip)) {
      const reason = `[자동] 과다 방문 (${count}회/24시간)`;
      autoBlockIP(ip, reason);
      notifySlack(ip, reason);
      cachedBlockedIPs.push(ip);
      visitCounter.delete(ip);
    }
  }

  // 부고 생성 완료 → 자동 차단 해제 (실제 고객이므로)
  if (path.startsWith('/create/complete')) {
    if (cachedBlockedIPs.includes(ip)) {
      cachedBlockedIPs = cachedBlockedIPs.filter(blocked => blocked !== ip);
    }
    // DB에서도 해제
    if (SUPABASE_URL && SUPABASE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/blocked_ips?ip_address=eq.${ip}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false, reason: '[자동 해제] 부고 생성 완료 - 실제 고객' }),
      }).catch(() => { });
    }
    visitCounter.delete(ip);
    viewTracker.delete(ip);
  }

  // 차단 IP 체크
  const blockedIPs = await getBlockedIPs();

  if (blockedIPs.includes(ip)) {
    return new NextResponse(infiniteLoadingHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
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

