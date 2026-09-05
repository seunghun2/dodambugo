import crypto from 'crypto';

const ACCESS_LICENSE = '0100000000e412a734d595eda2c3fed12d693a20f99c5ce1c3df63c238030be52bd5cd3e58';
const SECRET_KEY = 'AQAAAADkEqc01ZXtosP+0S1pOiD5fNlkEx2S6OnKIH/uZFdhXQ==';
const CUSTOMER_ID = '4257905';
const BASE_URL = 'https://api.searchad.naver.com';

function generateSignature(timestamp, method, path, secretKey) {
    const basePath = path.split('?')[0];
    const message = `${timestamp}.${method}.${basePath}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

async function fetchStatsForMonth(campaignId, year, month) {
    const startDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const timestamp = Date.now().toString();
    const method = 'GET';
    const fields = encodeURIComponent('["impCnt","clkCnt","salesAmt","ctr","cpc","avgRnk"]');
    const timeRange = encodeURIComponent(JSON.stringify({ since: startDay, until: endDay }));
    const path = `/stats?id=${campaignId}&fields=${fields}&timeRange=${timeRange}`;
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': CUSTOMER_ID,
                'X-Signature': signature,
            }
        });

        if (!res.ok) {
            const err = await res.json();
            return { month: `${year}-${String(month).padStart(2, '0')}`, error: err.detail || 'Error' };
        }

        const json = await res.json();
        const dailyData = json.data || [];

        const totalCost = dailyData.reduce((sum, d) => sum + (d.salesAmt || 0), 0);
        const totalClicks = dailyData.reduce((sum, d) => sum + (d.clkCnt || 0), 0);
        const totalImps = dailyData.reduce((sum, d) => sum + (d.impCnt || 0), 0);
        const avgCpc = totalClicks > 0 ? Math.round(totalCost / totalClicks) : 0;
        const avgCtr = totalImps > 0 ? ((totalClicks / totalImps) * 100).toFixed(2) : '0.00';

        return {
            month: `${year}년 ${month}월`,
            totalCost,
            totalClicks,
            totalImps,
            avgCpc,
            avgCtr,
            days: dailyData.length
        };
    } catch (err) {
        return { month: `${year}-${String(month).padStart(2, '0')}`, error: err.message };
    }
}

async function main() {
    const campaignId = 'cmp-a001-01-000000010252118';
    console.log('=== 네이버 검색광고 월별 집행 내역 분석 ===\n');

    // 2025년 9월 ~ 12월도 확인
    const prevYearMonths = [9, 10, 11, 12];
    const prevResults = [];
    for (const m of prevYearMonths) {
        const data = await fetchStatsForMonth(campaignId, 2025, m);
        if (data.totalCost > 0) {
            prevResults.push(data);
        }
    }

    const currentYearMonths = [1, 2, 3, 4, 5, 6, 7, 8];
    const currentResults = [];
    for (const m of currentYearMonths) {
        const data = await fetchStatsForMonth(campaignId, 2026, m);
        currentResults.push(data);
    }

    console.log('2025년:', JSON.stringify(prevResults, null, 2));
    console.log('2026년:', JSON.stringify(currentResults, null, 2));
}

main();
