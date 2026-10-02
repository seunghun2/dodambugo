import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron: 매주 금요일 오전 10시 (KST) = UTC 01:00 ("0 1 * * 5")
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
    total_bugo: number;
    genuine_20plus: number;
    flower_order_count: number;
    flower_revenue: number;
}

async function fetchStats(supabase: any, fromDateIso: string, toDateIso: string): Promise<ChannelStat[]> {
    // 1. 해당 기간 내 부고 조회
    const { data: bugos, error: bugoError } = await supabase
        .from('bugo')
        .select('id, bugo_number, view_count, source, created_at')
        .is('deleted_at', null)
        .gte('created_at', fromDateIso)
        .lte('created_at', toDateIso);

    if (bugoError || !bugos) {
        console.error('부고 통계 조회 실패:', bugoError);
        return [];
    }

    const bugoIds = bugos.map((b: any) => b.id);

    // 2. 해당 부고들의 화환 결제 조회
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

    // 3. 채널별 집계
    const stats: Record<string, ChannelStat> = {
        '구글': { channel: '구글', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0 },
        '네이버': { channel: '네이버', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0 },
        '기타/직접': { channel: '기타/직접', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0 },
    };

    for (const b of bugos) {
        const src = (b.source || '').toLowerCase();
        let ch = '기타/직접';
        if (src.includes('google')) ch = '구글';
        else if (src.includes('naver')) ch = '네이버';

        stats[ch].total_bugo += 1;
        if ((b.view_count || 0) >= 20) {
            stats[ch].genuine_20plus += 1;
        }

        const ord = ordersMap[b.id];
        if (ord) {
            stats[ch].flower_order_count += ord.count;
            stats[ch].flower_revenue += ord.revenue;
        }
    }

    return Object.values(stats);
}

export async function GET(request: NextRequest) {
    if (!verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const now = new Date();

    // 1. 최근 7일 기간 계산 (KST 기준)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyStats = await fetchStats(supabase, sevenDaysAgo.toISOString(), now.toISOString());

    // 2. 당월 1일 ~ 현재 누적
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const monthlyStats = await fetchStats(supabase, startOfMonth.toISOString(), now.toISOString());

    // 3. 포맷팅
    const fmtMoney = (v: number) => {
        if (v === 0) return '0원';
        return `${Math.round(v / 10000).toLocaleString()}만 원`;
    };

    const weeklyTotalGenuine = weeklyStats.reduce((acc, cur) => acc + cur.genuine_20plus, 0);
    const weeklyTotalBugo = weeklyStats.reduce((acc, cur) => acc + cur.total_bugo, 0);
    const weeklyTotalOrders = weeklyStats.reduce((acc, cur) => acc + cur.flower_order_count, 0);
    const weeklyTotalRevenue = weeklyStats.reduce((acc, cur) => acc + cur.flower_revenue, 0);

    const monthlyTotalGenuine = monthlyStats.reduce((acc, cur) => acc + cur.genuine_20plus, 0);
    const monthlyTotalBugo = monthlyStats.reduce((acc, cur) => acc + cur.total_bugo, 0);
    const monthlyTotalOrders = monthlyStats.reduce((acc, cur) => acc + cur.flower_order_count, 0);
    const monthlyTotalRevenue = monthlyStats.reduce((acc, cur) => acc + cur.flower_revenue, 0);

    const formatChannelText = (list: ChannelStat[]) => {
        return list.map(c => {
            const rate = c.total_bugo > 0 ? ((c.genuine_20plus / c.total_bugo) * 100).toFixed(1) : '0.0';
            return `• *${c.channel}*: 총 ${c.total_bugo}건 | *진성 ${c.genuine_20plus}건* (${rate}%) | 화환 ${c.flower_order_count}건 (${fmtMoney(c.flower_revenue)})`;
        }).join('\n');
    };

    const dateStr = now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short' });
    const monthNum = now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric' });

    const message = {
        text: `📊 [마음부고] 주간 광고 & 부고 성과 리포트 (${dateStr})`,
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `📊 [마음부고] 주간 광고 & 부고 성과 리포트`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*🗓 최근 7일 성과 (지난주 금 ~ 금요일 10시)*\n${formatChannelText(weeklyStats)}\n\n👉 *주간 총합*: 총 부고 ${weeklyTotalBugo}건 중 *진성 ${weeklyTotalGenuine}건* | 화환 ${weeklyTotalOrders}건 (${fmtMoney(weeklyTotalRevenue)})`,
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*📈 당월 누적 (${monthNum} 누적)*\n${formatChannelText(monthlyStats)}\n\n👉 *당월 총합*: 총 부고 ${monthlyTotalBugo}건 중 *진성 ${monthlyTotalGenuine}건* | 화환 ${monthlyTotalOrders}건 (${fmtMoney(monthlyTotalRevenue)})`,
                },
            },
        ],
    };

    // 4. 슬랙 웹훅 전송
    const webhookUrl = process.env.SLACK_WEBHOOK_REPORT
        || process.env.SLACK_WEBHOOK_URL
        || process.env.SLACK_WEBHOOK_BUGO;

    if (!webhookUrl) {
        return NextResponse.json({ error: 'Slack webhook not configured', weeklyStats, monthlyStats }, { status: 500 });
    }

    try {
        const slackRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!slackRes.ok) {
            throw new Error(`Slack API error: ${slackRes.statusText}`);
        }

        return NextResponse.json({
            success: true,
            weekly: { total: weeklyTotalBugo, genuine: weeklyTotalGenuine, revenue: weeklyTotalRevenue },
            monthly: { total: monthlyTotalBugo, genuine: monthlyTotalGenuine, revenue: monthlyTotalRevenue },
        });
    } catch (err: any) {
        console.error('슬랙 리포트 발송 실패:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
