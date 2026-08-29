import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ACCESS_LICENSE = process.env.NAVER_ADS_ACCESS_LICENSE || '0100000000e412a734d595eda2c3fed12d693a20f99c5ce1c3df63c238030be52bd5cd3e58';
const SECRET_KEY = process.env.NAVER_ADS_SECRET_KEY || 'AQAAAADkEqc01ZXtosP+0S1pOiD5fNlkEx2S6OnKIH/uZFdhXQ==';
const CUSTOMER_ID = process.env.NAVER_ADS_CUSTOMER_ID || '4257905';
const BASE_URL = 'https://api.searchad.naver.com';

function generateSignature(timestamp: string, method: string, path: string, secretKey: string) {
    const basePath = path.split('?')[0];
    const message = `${timestamp}.${method}.${basePath}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

async function callNaverApi(path: string, method: string = 'GET') {
    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp, method, path, SECRET_KEY);

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
        const errorBody = await res.text();
        throw new Error(`Naver API error (${res.status}): ${errorBody}`);
    }

    return await res.json();
}

// GET: 네이버 검색광고 실시간 비즈머니 잔액, 당일 광고비 및 월별 집행 내역
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || '2026';

        // 1. 실시간 비즈머니 잔액 조회
        const bizmoneyData = await callNaverApi('/billing/bizmoney');
        const bizmoney = Math.round(bizmoneyData.bizmoney || 0);

        // 2. 캠페인 목록 조회
        const campaigns = await callNaverApi('/ncc/campaigns');
        const mainCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;
        const campaignId = mainCampaign ? mainCampaign.nccCampaignId : 'cmp-a001-01-000000010252118';

        // 3. 월별 통계 수집 (1월 ~ 8월)
        const currentMonth = new Date().getMonth() + 1;
        const monthlyStats = [];

        for (let m = 1; m <= currentMonth; m++) {
            const startDay = `${year}-${String(m).padStart(2, '0')}-01`;
            const lastDay = new Date(Number(year), m, 0).getDate();
            const endDay = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const fields = encodeURIComponent('["impCnt","clkCnt","salesAmt","ctr","cpc","avgRnk"]');
            const timeRange = encodeURIComponent(JSON.stringify({ since: startDay, until: endDay }));
            const statsPath = `/stats?id=${campaignId}&fields=${fields}&timeRange=${timeRange}`;

            try {
                const statsRes = await callNaverApi(statsPath);
                const dailyData = statsRes.data || [];

                const cost = dailyData.reduce((sum: number, d: any) => sum + (d.salesAmt || 0), 0);
                const clicks = dailyData.reduce((sum: number, d: any) => sum + (d.clkCnt || 0), 0);
                const impressions = dailyData.reduce((sum: number, d: any) => sum + (d.impCnt || 0), 0);
                const cpc = clicks > 0 ? Math.round(cost / clicks) : 0;
                const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

                monthlyStats.push({
                    month: m,
                    monthLabel: `${year}년 ${m}월`,
                    cost,
                    clicks,
                    impressions,
                    cpc,
                    ctr
                });
            } catch (err) {
                console.error(`Error fetching Naver stats for month ${m}:`, err);
            }
        }

        // 오늘 지출 광고비 추출 (마지막 달의 오늘 일자)
        const todayCost = monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1].cost : 0;

        return NextResponse.json({
            success: true,
            bizmoney,
            todayCost,
            campaignName: mainCampaign ? mainCampaign.name : '파워링크#1',
            monthlyStats
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '네이버 광고 API 연동 오류' }, { status: 500 });
    }
}
