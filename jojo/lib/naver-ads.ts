import crypto from 'crypto';

const ACCESS_LICENSE = process.env.NAVER_AD_ACCESS_LICENSE || '0100000000e412a734d595eda2c3fed12d693a20f99c5ce1c3df63c238030be52bd5cd3e58';
const SECRET_KEY = process.env.NAVER_AD_SECRET_KEY || 'AQAAAADkEqc01ZXtosP+0S1pOiD5fNlkEx2S6OnKIH/uZFdhXQ==';
const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID || '4257905';
const CAMPAIGN_ID = process.env.NAVER_AD_CAMPAIGN_ID || 'cmp-a001-01-000000010252118'; // 파워링크#1
const BASE_URL = 'https://api.searchad.naver.com';

function generateSignature(timestamp: string, method: string, path: string, secretKey: string): string {
    const basePath = path.split('?')[0];
    const message = `${timestamp}.${method}.${basePath}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

export interface NaverDailyStats {
    date: string;
    cost: number;
    clicks: number;
    impressions: number;
    cpc: number;
    ctr: number;
}

/**
 * 네이버 검색광고 특정 일자 실적 조회 (YYYY-MM-DD)
 */
export async function getNaverDailyStats(dateStr: string): Promise<NaverDailyStats | null> {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const fields = encodeURIComponent('["impCnt","clkCnt","salesAmt","ctr","cpc","avgRnk"]');
    const timeRange = encodeURIComponent(JSON.stringify({ since: dateStr, until: dateStr }));
    const path = `/stats?id=${CAMPAIGN_ID}&fields=${fields}&timeRange=${timeRange}`;
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': CUSTOMER_ID,
                'X-Signature': signature,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error('네이버 광고 통계 조회 실패:', res.status, await res.text());
            return null;
        }

        const json = await res.json();
        const data = json.data?.[0];
        if (!data) {
            return {
                date: dateStr,
                cost: 0,
                clicks: 0,
                impressions: 0,
                cpc: 0,
                ctr: 0,
            };
        }

        return {
            date: dateStr,
            cost: data.salesAmt || 0,
            clicks: data.clkCnt || 0,
            impressions: data.impCnt || 0,
            cpc: data.cpc || 0,
            ctr: data.ctr || 0,
        };
    } catch (err) {
        console.error('네이버 광고 API 에러:', err);
        return null;
    }
}

/**
 * 네이버 검색광고 비즈머니 잔액 조회
 */
export async function getNaverBizmoney(): Promise<number | null> {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/billing/bizmoney';
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': CUSTOMER_ID,
                'X-Signature': signature,
            },
            cache: 'no-store',
        });

        if (!res.ok) return null;
        const data = await res.json();
        return typeof data.bizmoney === 'number' ? Math.floor(data.bizmoney) : null;
    } catch (err) {
        console.error('네이버 비즈머니 조회 에러:', err);
        return null;
    }
}
