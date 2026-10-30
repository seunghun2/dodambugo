// 구글 공식 크롤러 IP 검증 (UA 위장 방지 + 진짜 구글봇 오차단 방지)
// 근거: https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests
import { GOOGLE_CRAWLER_CIDRS } from './googleIp.generated';

// 구글 소유 대역 (스냅샷이 오래돼도 진짜 구글봇이 가짜로 오판되지 않도록 넓게 허용)
const GOOGLE_OWNED_CIDRS = [
  '66.249.64.0/19', '74.125.0.0/16', '72.14.192.0/18', '209.85.128.0/17',
  '64.233.160.0/19', '66.102.0.0/20', '108.177.0.0/17', '142.250.0.0/15',
  '172.253.0.0/16', '192.178.0.0/15',
];

function ipToLong(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

type Range = [number, number];
function toRange(cidr: string): Range | null {
  const [base, bitsStr] = cidr.split('/');
  const b = ipToLong(base);
  const bits = Number(bitsStr);
  if (b === null || !(bits >= 0 && bits <= 32)) return null;
  const size = Math.pow(2, 32 - bits);
  const start = Math.floor(b / size) * size;
  return [start, start + size - 1];
}

let cachedRanges: Range[] | null = null;
function getRanges(): Range[] {
  if (!cachedRanges) {
    cachedRanges = [...GOOGLE_OWNED_CIDRS, ...GOOGLE_CRAWLER_CIDRS]
      .map(toRange)
      .filter((r): r is Range => r !== null);
  }
  return cachedRanges;
}

/** IPv4가 구글 공식 크롤러/페처 대역이면 true (IPv6/빈 값은 false) */
export function isGoogleIp(ip: string): boolean {
  const n = ipToLong((ip || '').trim());
  if (n === null) return false;
  return getRanges().some(([s, e]) => n >= s && n <= e);
}

/** 구글 크롤러를 사칭하는 UA인지 (일반 사용자 UA에는 절대 없는 토큰만) */
export function claimsGoogleCrawlerUA(ua: string): boolean {
  return /googlebot|adsbot-google|mediapartners-google|google-inspectiontool|googleother|google-extended|storebot-google|apis-google|feedfetcher-google|google-read-aloud|google-site-verification|playstore-google/i.test(ua || '');
}
