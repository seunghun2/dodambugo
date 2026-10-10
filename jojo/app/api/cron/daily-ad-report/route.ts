import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNaverDailyStats, getNaverBizmoney } from '@/lib/naver-ads';

export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('token') === process.env.CRON_SECRET || searchParams.get('test') === 'true') return true;
    if (process.env.NODE_ENV === 'development') return true;
    return false;
}

interface ChannelStat {
    channel: string;
    key: string;
    total_bugo: number;
    genuine_20plus: number;
    flower_order_count: number;
    flower_revenue: number;
}

export async function GET(request: NextRequest) {
    if (!verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customDate = searchParams.get('date'); // 테스트용 (예: ?date=2026-10-09)

    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstYesterday = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000);

    const targetDateStr = customDate || `${kstYesterday.getUTCFullYear()}-${String(kstYesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(kstYesterday.getUTCDate()).padStart(2, '0')}`;

    const fromIso = `${targetDateStr}T00:00:00+09:00`;
    const toIso = `${targetDateStr}T23:59:59.999+09:00`;

    // 1. 네이버 검색광고 실적 & 비즈머니 조회
    const [naverStats, bizmoney] = await Promise.all([
        getNaverDailyStats(targetDateStr),
        getNaverBizmoney(),
    ]);

    // 2. Supabase 어제 부고 및 화환 주문 조회
    const supabase = getSupabase();
    const { data: bugos, error: bugoError } = await supabase
        .from('bugo')
        .select('id, bugo_number, view_count, source, created_at')
        .is('deleted_at', null)
        .gte('created_at', fromIso)
        .lte('created_at', toIso);

    if (bugoError) {
        console.error('부고 데이터 조회 실패:', bugoError);
        return NextResponse.json({ error: bugoError.message }, { status: 500 });
    }

    const bugoIds = (bugos || []).map((b: any) => b.id);
    let ordersMap: Record<string, { count: number; revenue: number }> = {};

    if (bugoIds.length > 0) {
        const { data: orders } = await supabase
            .from('flower_orders')
            .select('bugo_id, product_price')
            .in('bugo_id', bugoIds)
            .in('status', ['completed', 'delivered']);

        if (orders) {
            for (const ord of orders) {
                if (!ordersMap[ord.bugo_id]) {
                    ordersMap[ord.bugo_id] = { count: 0, revenue: 0 };
                }
                ordersMap[ord.bugo_id].count += 1;
                ordersMap[ord.bugo_id].revenue += (ord.product_price || 0);
            }
        }
    }

    // 3. 채널별 집계 (naver_ad, google_ad, 오가닉/직접)
    const stats: Record<string, ChannelStat> = {
        naver_ad: { channel: '네이버 검색광고', key: 'naver_ad', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0 },
        google_ad: { channel: '구글 광고', key: 'google_ad', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0 },
        organic: { channel: '오가닉/직접/공유', key: 'organic', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0 },
    };

    const naverKeywords: Record<string, { genuine: number; flowerOrders: number }> = {};

    for (const b of (bugos || [])) {
        const src = (b.source || '').toLowerCase();
        let targetKey = 'organic';
        if (src.startsWith('naver_ad') || src.includes('naver_ad')) {
            targetKey = 'naver_ad';
            if (src.includes(':')) {
                const kw = src.split(':')[1]?.trim() || '미지정';
                if (!naverKeywords[kw]) naverKeywords[kw] = { genuine: 0, flowerOrders: 0 };
                if ((b.view_count || 0) >= 20) naverKeywords[kw].genuine += 1;
                const ord = ordersMap[b.id];
                if (ord) naverKeywords[kw].flowerOrders += ord.count;
            }
        } else if (src.startsWith('google_ad') || src.includes('google_ad')) {
            targetKey = 'google_ad';
        }

        stats[targetKey].total_bugo += 1;
        if ((b.view_count || 0) >= 20) {
            stats[targetKey].genuine_20plus += 1;
        }

        const ord = ordersMap[b.id];
        if (ord) {
            stats[targetKey].flower_order_count += ord.count;
            stats[targetKey].flower_revenue += ord.revenue;
        }
    }

    // 4. 핵심 지표 계산
    const nCost = naverStats?.cost || 0;
    const nClicks = naverStats?.clicks || 0;
    const nCpc = naverStats?.cpc || 0;
    const nGenuine = stats.naver_ad.genuine_20plus;
    const nCpa = nGenuine > 0 ? Math.round(nCost / nGenuine) : 0;
    const nFlowerOrders = stats.naver_ad.flower_order_count;
    const nFlowerRev = stats.naver_ad.flower_revenue;
    const nFlowerMargin = nFlowerOrders * 20000; // 화환 건당 평균 마진 2만 원 기준
    const nNetProfit = nFlowerMargin - nCost;

    const totalGenuine = Object.values(stats).reduce((sum, c) => sum + c.genuine_20plus, 0);
    const totalBugo = Object.values(stats).reduce((sum, c) => sum + c.total_bugo, 0);
    const totalFlowerOrders = Object.values(stats).reduce((sum, c) => sum + c.flower_order_count, 0);
    const totalFlowerRev = Object.values(stats).reduce((sum, c) => sum + c.flower_revenue, 0);

    const fmtMoney = (v: number) => `${v.toLocaleString()}원`;

    // 잔액 경고 문구
    const bizAlert = bizmoney !== null && bizmoney < 30000
        ? `⚠️ *비즈머니 잔액 부족: ${fmtMoney(bizmoney)}* (충전 필요)`
        : `• 비즈머니 잔액: ${bizmoney !== null ? fmtMoney(bizmoney) : '확인불가'}`;

    const keywordListStr = Object.keys(naverKeywords).length > 0
        ? '\n- 유입 키워드 실적: ' + Object.entries(naverKeywords)
            .map(([kw, data]) => `[${kw}] 진성 ${data.genuine}건${data.flowerOrders > 0 ? ` / 화환 ${data.flowerOrders}건` : ''}`)
            .join(', ')
        : '';

    // 5. 슬랙 메시지 구성
    const slackText = `📊 [마음부고] 일일 광고 & 전환 리포트 (${targetDateStr})
${bizAlert}

1. 네이버 검색광고 실적 (어제)
- 지출 광고비: ${fmtMoney(nCost)} (${nClicks}클릭, CPC ${fmtMoney(nCpc)})
- 유입 부고: 총 ${stats.naver_ad.total_bugo}건 중 *진성 ${nGenuine}건*${keywordListStr}
- 진성 부고 획득단가(CPA): ${nGenuine > 0 ? fmtMoney(nCpa) : '진성 0건'}
- 화환 결제: ${nFlowerOrders}건 (${fmtMoney(nFlowerRev)})
- 네이버 광고 실질 손익: ${nNetProfit >= 0 ? '+' : ''}${fmtMoney(nNetProfit)} (화환마진 - 광고비)

2. 기타 유입 성과 (어제)
- 구글 광고: 총 ${stats.google_ad.total_bugo}건 | 진성 ${stats.google_ad.genuine_20plus}건 | 화환 ${stats.google_ad.flower_order_count}건
- 오가닉/직접: 총 ${stats.organic.total_bugo}건 | 진성 ${stats.organic.genuine_20plus}건 | 화환 ${stats.organic.flower_order_count}건

3. 어제 전체 실사용자 바닥 수치
- 진성 부고: *${totalGenuine}건* (전체 ${totalBugo}건)
- 화환 결제: *${totalFlowerOrders}건* (${fmtMoney(totalFlowerRev)})`;

    // 6. 슬랙 전송
    const webhookUrl = process.env.SLACK_WEBHOOK_REPORT
        || process.env.SLACK_WEBHOOK_B2C_BUGO
        || process.env.SLACK_WEBHOOK_BUGO
        || process.env.SLACK_WEBHOOK_URL;

    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: slackText }),
            });
        } catch (slackErr) {
            console.error('슬랙 전송 실패:', slackErr);
        }
    }

    return NextResponse.json({
        success: true,
        targetDate: targetDateStr,
        bizmoney,
        naverStats,
        channelStats: stats,
        summary: {
            totalBugo,
            totalGenuine,
            totalFlowerOrders,
            totalFlowerRev,
            nNetProfit,
        },
    });
}
