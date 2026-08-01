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
const ADMIN_IPS = ['14.38.63.241', '127.0.0.1', '::1', '117.111.6.111', '210.121.187.54'];

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

// 의심 페이지 과다 열람 감지 (IP → 카운트)
const policyCounter: Map<string, number> = new Map();
const SUSPICIOUS_PAGES = ['/terms', '/privacy', '/contact'];
const SUSPICIOUS_PAGE_THRESHOLD = 8; // 8회 이상 → 자동 차단

// 검색 페이지 과다 방문 감지 (IP → 카운트)
const searchCounter: Map<string, number> = new Map();
const SEARCH_THRESHOLD = 4; // 4회 이상 → 자동 차단

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
    policyCounter.clear();
    searchCounter.clear();
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
    body: JSON.stringify({ ip_address: ip, reason: encodeURIComponent(reason), is_active: true }),
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
  const host = request.headers.get('host') || '';
  const hostLower = host.toLowerCase();

  // 로컬 호스트 여부 감지 (localhost, 127.0.0.1, 192.168.x.x 등)
  const isLocal = hostLower.startsWith('localhost') || hostLower.startsWith('127.0.0.1') || hostLower.startsWith('192.168.');

  // B2B 전용 서브도메인 여부 감지 (partner.*, b2b.*, bugoon.*) - 대소문자 구분 없이 다양한 환경 지원
  const isB2BSubdomain =
    // 로컬 환경에서는 포트 3000번, 3001번, 3009번 모두 지원
    (isLocal ? (hostLower.includes(':3000') || hostLower.includes(':3001') || hostLower.includes(':3009')) : false) ||
    hostLower.startsWith('partner.') ||
    hostLower.startsWith('b2b.') ||
    hostLower.startsWith('bugoon.') ||
    hostLower.startsWith('partner-') ||
    hostLower.startsWith('b2b-') ||
    hostLower.startsWith('bugoon-') ||
    hostLower.includes('.partner.') ||
    hostLower.includes('.b2b.') ||
    hostLower.includes('.bugoon.') ||
    hostLower.includes('.partner-') ||
    hostLower.includes('.b2b-') ||
    hostLower.includes('.bugoon-');

  // B2C 도메인에서 /b2b 경로로 직접 접근하는 경우 404 차단 (scoping 및 보안 강화) - 로컬 환경 또는 개발 모드에서는 허용
  if (process.env.NODE_ENV !== 'development' && !isLocal && !isB2BSubdomain && path.startsWith('/b2b')) {
    return new NextResponse(null, { status: 404 });
  }

  // 개발 환경(NODE_ENV === 'development')이 아닐 때만 보안/차단/로깅 로직 실행
  if (process.env.NODE_ENV !== 'development') {
    // 클라이언트 IP 가져오기
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '';

    // 사설 IP 대역 (10.x.x.x, 172.16.x.x~172.31.x.x, 192.168.x.x) 체크
    const isPrivateIp = (ipAddress: string) => {
      if (!ipAddress) return false;
      if (ipAddress === '127.0.0.1' || ipAddress === '::1') return true;
      const parts = ipAddress.split('.').map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) return false;
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      return false;
    };

    // 관리자, 사설 IP, B2B 접속 여부 체크 (B2B 사용자는 차단 대상에서 예외 처리)
    const isAdminCookie = request.cookies.get('admin_ip')?.value === 'true';
    const isExcluded = 
      ADMIN_IPS.includes(ip) || 
      isAdminCookie || 
      isPrivateIp(ip) || 
      isB2BSubdomain || 
      path.startsWith('/b2b');

    if (!isExcluded) {
      // 접속 로그 기록 (논블로킹)
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
      const friendlyBots = /vercel|googlebot|bingbot|yandex|naverbot|daumoa|kakaotalk/i;

      if (!friendlyBots.test(ua)) {
        // 악성 봇/크롤러 감지 → 자동 차단
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

        // 총 방문 횟수 감지
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

        // 의심 페이지 과다 열람 감지
        if (SUSPICIOUS_PAGES.includes(path)) {
          const count = (policyCounter.get(ip) || 0) + 1;
          policyCounter.set(ip, count);
          if (count >= SUSPICIOUS_PAGE_THRESHOLD && !cachedBlockedIPs.includes(ip)) {
            const reason = `[자동] 의심 페이지 과다 열람 (${count}회)`;
            autoBlockIP(ip, reason);
            notifySlack(ip, reason);
            cachedBlockedIPs.push(ip);
            policyCounter.delete(ip);
          }
        }
      }

      // 부고 생성 완료 → 자동 차단 해제 (실제 고객이므로)
      if (path.startsWith('/create/complete')) {
        if (cachedBlockedIPs.includes(ip)) {
          cachedBlockedIPs = cachedBlockedIPs.filter(blocked => blocked !== ip);
        }
        if (SUPABASE_URL && SUPABASE_KEY) {
          fetch(`${SUPABASE_URL}/rest/v1/blocked_ips?ip_address=eq.${ip}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active: false, reason: encodeURIComponent('[자동 해제] 부고 생성 완료 - 실제 고객') }),
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
    }
  }

  // B2B subdomain rewrite logic
  if (isB2BSubdomain) {
    // static assets, _next 내부 파일, api 경로는 rewrite 대상에서 제외
    const isStaticOrApi =
      path.startsWith('/_next') ||
      path.startsWith('/_vercel') ||
      path.startsWith('/api') ||
      path.startsWith('/favicon.ico') ||
      /\.(css|js|json|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|txt|xml|pdf|ico|webmanifest|mp3|mp4|wav|map)$/.test(path);

    if (!isStaticOrApi && !path.startsWith('/b2b')) {
      // /order 경로는 redirect(302)로 URL을 명시적으로 변경 (B2B 주문 페이지 표시)
      if (path.startsWith('/order')) {
        const redirectUrl = new URL(`/b2b${path}`, request.url);
        return NextResponse.redirect(redirectUrl);
      }
      // 나머지 경로는 서버 내부적으로 /b2b를 붙여서 rewrite 처리
      const rewriteUrl = new URL(`/b2b${path}`, request.url);
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

// 모든 페이지에 적용 (API, 정적 파일 제외)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
