import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_LICENSE = process.env.NAVER_ADS_ACCESS_LICENSE || '0100000000e412a734d595eda2c3fed12d693a20f99c5ce1c3df63c238030be52bd5cd3e58';
const SECRET_KEY = process.env.NAVER_ADS_SECRET_KEY || 'AQAAAADkEqc01ZXtosP+0S1pOiD5fNlkEx2S6OnKIH/uZFdhXQ==';
const CUSTOMER_ID = process.env.NAVER_ADS_CUSTOMER_ID || '4257905';
const BASE_URL = 'https://api.searchad.naver.com';

function generateSignature(timestamp: string, method: string, path: string, secretKey: string) {
    const basePath = path.split('?')[0];
    const message = `${timestamp}.${method}.${basePath}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

async function fetchNaverMonthly(year: string) {
    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp, 'GET', '/billing/bizmoney', SECRET_KEY);

    let bizmoney = 0;
    try {
        const res = await fetch(`${BASE_URL}/billing/bizmoney`, {
            method: 'GET',
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': ACCESS_LICENSE,
                'X-Customer': CUSTOMER_ID,
                'X-Signature': signature,
            }
        });
        if (res.ok) {
            const data = await res.json();
            bizmoney = Math.round(data.bizmoney || 0);
        }
    } catch (e) {
        console.error('Error fetching bizmoney:', e);
    }

    const currentMonth = new Date().getMonth() + 1;
    const campaignId = 'cmp-a001-01-000000010252118';
    const monthlyMap: Record<number, { cost: number; clicks: number; impressions: number }> = {};

    for (let m = 1; m <= currentMonth; m++) {
        const startDay = `${year}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(Number(year), m, 0).getDate();
        const endDay = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const fields = encodeURIComponent('["impCnt","clkCnt","salesAmt","ctr","cpc","avgRnk"]');
        const timeRange = encodeURIComponent(JSON.stringify({ since: startDay, until: endDay }));
        const statsPath = `/stats?id=${campaignId}&fields=${fields}&timeRange=${timeRange}`;

        const statsSig = generateSignature(Date.now().toString(), 'GET', '/stats', SECRET_KEY);

        try {
            const res = await fetch(`${BASE_URL}${statsPath}`, {
                method: 'GET',
                headers: {
                    'X-Timestamp': Date.now().toString(),
                    'X-API-KEY': ACCESS_LICENSE,
                    'X-Customer': CUSTOMER_ID,
                    'X-Signature': statsSig,
                }
            });
            if (res.ok) {
                const json = await res.json();
                const daily = json.data || [];
                const cost = daily.reduce((s: number, d: any) => s + (d.salesAmt || 0), 0);
                const clicks = daily.reduce((s: number, d: any) => s + (d.clkCnt || 0), 0);
                const impressions = daily.reduce((s: number, d: any) => s + (d.impCnt || 0), 0);
                monthlyMap[m] = { cost, clicks, impressions };
            }
        } catch (e) {
            console.error(`Error stats for month ${m}:`, e);
        }
    }

    return { bizmoney, monthlyMap };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || '2026';

        // 1. 네이버 광고 데이터 가져오기
        const { bizmoney, monthlyMap: naverMonthly } = await fetchNaverMonthly(year);

        // 2. 구글 광고 데이터 DB 조회
        const { data: googleSpends } = await supabase
            .from('marketing_ad_spends')
            .select('*')
            .eq('platform', 'google')
            .gte('spend_date', `${year}-01-01`)
            .lte('spend_date', `${year}-12-31`);

        const googleMonthly: Record<number, { cost: number; clicks: number; impressions: number }> = {};
        if (googleSpends) {
            for (const row of googleSpends) {
                const m = new Date(row.spend_date).getMonth() + 1;
                if (!googleMonthly[m]) {
                    googleMonthly[m] = { cost: 0, clicks: 0, impressions: 0 };
                }
                googleMonthly[m].cost += Number(row.cost || 0);
                googleMonthly[m].clicks += Number(row.clicks || 0);
                googleMonthly[m].impressions += Number(row.impressions || 0);
            }
        }

        // 3. 실제 매출 데이터 (배송완료 화환 + 입금완료 부의금) 조회
        const { data: flowerOrders } = await supabase
            .from('flower_orders')
            .select('created_at, product_price, status')
            .in('status', ['delivered', 'completed'])
            .gte('created_at', `${year}-01-01T00:00:00Z`)
            .lte('created_at', `${year}-12-31T23:59:59Z`);

        const { data: condolenceOrders } = await supabase
            .from('condolence_orders')
            .select('created_at, amount, status')
            .in('status', ['transferred', 'completed'])
            .gte('created_at', `${year}-01-01T00:00:00Z`)
            .lte('created_at', `${year}-12-31T23:59:59Z`);

        // 4. 생성된 부고장 수 조회
        const { data: bugoList } = await supabase
            .from('bugo')
            .select('created_at')
            .gte('created_at', `${year}-01-01T00:00:00Z`)
            .lte('created_at', `${year}-12-31T23:59:59Z`);

        const salesMonthly: Record<number, { flowerCount: number; flowerProfit: number; condolenceGross: number; condolenceProfit: number; bugoCount: number }> = {};
        const currentMonth = new Date().getMonth() + 1;
        for (let m = 1; m <= currentMonth; m++) {
            salesMonthly[m] = { flowerCount: 0, flowerProfit: 0, condolenceGross: 0, condolenceProfit: 0, bugoCount: 0 };
        }

        // 화환: 건당 50,000원 순수익
        flowerOrders?.forEach(o => {
            const m = new Date(o.created_at).getMonth() + 1;
            if (salesMonthly[m]) {
                salesMonthly[m].flowerCount += 1;
                salesMonthly[m].flowerProfit += 50000;
            }
        });

        // 부의금: 결제액의 8.6% 순수익
        condolenceOrders?.forEach(o => {
            const m = new Date(o.created_at).getMonth() + 1;
            if (salesMonthly[m]) {
                const gross = Number(o.amount || 0);
                salesMonthly[m].condolenceGross += gross;
                salesMonthly[m].condolenceProfit += Math.round(gross * 0.086);
            }
        });

        bugoList?.forEach(b => {
            const m = new Date(b.created_at).getMonth() + 1;
            if (salesMonthly[m]) salesMonthly[m].bugoCount += 1;
        });

        // 5. 통합 월별 테이블 데이터 조립
        const monthlyReport = [];
        let totalMarketingSpend = 0;
        let totalPlatformProfit = 0;
        let totalFlowerCount = 0;
        let totalCondolenceGross = 0;
        let totalBugoCreated = 0;
        let totalClicks = 0;

        for (let m = 1; m <= currentMonth; m++) {
            const naver = naverMonthly[m] || { cost: 0, clicks: 0, impressions: 0 };
            const google = googleMonthly[m] || { cost: 0, clicks: 0, impressions: 0 };
            const sales = salesMonthly[m] || { flowerCount: 0, flowerProfit: 0, condolenceGross: 0, condolenceProfit: 0, bugoCount: 0 };

            const totalCost = naver.cost + google.cost;
            const monthProfit = sales.flowerProfit + sales.condolenceProfit;
            const netProfit = monthProfit - totalCost;
            const roas = totalCost > 0 ? Math.round((monthProfit / totalCost) * 100) : 0;
            const cpa = sales.bugoCount > 0 ? Math.round(totalCost / sales.bugoCount) : 0;

            totalMarketingSpend += totalCost;
            totalPlatformProfit += monthProfit;
            totalFlowerCount += sales.flowerCount;
            totalCondolenceGross += sales.condolenceGross;
            totalBugoCreated += sales.bugoCount;
            totalClicks += naver.clicks + google.clicks;

            monthlyReport.push({
                month: m,
                monthLabel: `${year}년 ${m}월`,
                naverCost: naver.cost,
                googleCost: google.cost,
                totalCost,
                flowerCount: sales.flowerCount,
                flowerProfit: sales.flowerProfit,
                condolenceGross: sales.condolenceGross,
                condolenceProfit: sales.condolenceProfit,
                totalRevenue: monthProfit, // 실제 플랫폼 마진 수익
                netProfit,
                roas,
                bugoCount: sales.bugoCount,
                cpa,
                totalClicks: naver.clicks + google.clicks
            });
        }

        const overallRoas = totalMarketingSpend > 0 ? Math.round((totalPlatformProfit / totalMarketingSpend) * 100) : 0;
        const overallCpa = totalBugoCreated > 0 ? Math.round(totalMarketingSpend / totalBugoCreated) : 0;

        return NextResponse.json({
            success: true,
            summary: {
                bizmoney,
                totalMarketingSpend,
                totalRevenue: totalPlatformProfit,
                totalFlowerCount,
                totalCondolenceGross,
                netProfit: totalPlatformProfit - totalMarketingSpend,
                overallRoas,
                totalBugoCreated,
                overallCpa,
                totalClicks
            },
            monthlyReport: monthlyReport.reverse() // 최신 월이 위로
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '마케팅 통합 통계 오류' }, { status: 500 });
    }
}
