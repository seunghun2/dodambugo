import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNaverDailyStats, getNaverBizmoney, B2B_CAMPAIGN_ID } from '@/lib/naver-ads';

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
    condolence_count: number;
    condolence_amount: number;
    condolence_fee: number;
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

    // 1. 네이버 검색광고(B2C + B2B) 실적 & 비즈머니 조회
    const [naverStats, naverB2BStats, bizmoney] = await Promise.all([
        getNaverDailyStats(targetDateStr),
        getNaverDailyStats(targetDateStr, B2B_CAMPAIGN_ID),
        getNaverBizmoney(),
    ]);

    // 2. Supabase 어제 부고, 화환 주문, 부의금 결제, B2B 신규 파트너 가입/문의 조회
    const supabase = getSupabase();
    const [bugoRes, b2bUsersRes, b2bInquiriesRes] = await Promise.all([
        supabase
            .from('bugo')
            .select('id, bugo_number, view_count, source, b2b_user_id, created_at')
            .is('deleted_at', null)
            .gte('created_at', fromIso)
            .lte('created_at', toIso),
        supabase
            .from('b2b_users')
            .select('id, owner_name, company_name, created_at')
            .neq('status', 'withdrawn')
            .gte('created_at', fromIso)
            .lte('created_at', toIso),
        supabase
            .from('inquiries')
            .select('id, name, company, created_at')
            .eq('inquiry_type', '부고온 제휴문의')
            .gte('created_at', fromIso)
            .lte('created_at', toIso),
    ]);

    const bugos = bugoRes.data;
    const bugoError = bugoRes.error;
    const b2bNewUsers = b2bUsersRes.data || [];
    const b2bInquiries = b2bInquiriesRes.data || [];

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

    // 3. 부의금 결제 내역 조회 (어제 결제 완료/이체 완료된 건)
    const { data: condolenceOrders } = await supabase
        .from('condolence_orders')
        .select('bugo_number, amount, fee, status, created_at')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .in('status', ['transferred', 'completed']);

    // 부의금 부고 source 매핑용
    const condolenceBugoNums = Array.from(new Set((condolenceOrders || []).map((c: any) => c.bugo_number).filter(Boolean)));
    const knownBugoNumbers = new Set((bugos || []).map((b: any) => b.bugo_number));
    const unknownBugoNums = condolenceBugoNums.filter((num: string) => !knownBugoNumbers.has(num));

    let bugoSourceMap: Record<string, string> = {};
    for (const b of (bugos || [])) {
        bugoSourceMap[b.bugo_number] = b.source || '';
    }

    if (unknownBugoNums.length > 0) {
        const { data: extraBugos } = await supabase
            .from('bugo')
            .select('bugo_number, source')
            .in('bugo_number', unknownBugoNums);
        for (const eb of (extraBugos || [])) {
            bugoSourceMap[eb.bugo_number] = eb.source || '';
        }
    }

    // 4. 채널별 집계 (naver_ad, google_ad, 오가닉/직접)
    const stats: Record<string, ChannelStat> = {
        naver_ad: { channel: '네이버 검색광고', key: 'naver_ad', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0, condolence_count: 0, condolence_amount: 0, condolence_fee: 0 },
        google_ad: { channel: '구글 광고', key: 'google_ad', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0, condolence_count: 0, condolence_amount: 0, condolence_fee: 0 },
        organic: { channel: '오가닉/직접/공유', key: 'organic', total_bugo: 0, genuine_20plus: 0, flower_order_count: 0, flower_revenue: 0, condolence_count: 0, condolence_amount: 0, condolence_fee: 0 },
    };

    const naverKeywords: Record<string, { genuine: number; flowerOrders: number; condolenceOrders: number }> = {};

    for (const b of (bugos || [])) {
        const src = (b.source || '').toLowerCase();
        let targetKey = 'organic';
        if (src.startsWith('naver_ad') || src.includes('naver_ad')) {
            targetKey = 'naver_ad';
            if (src.includes(':')) {
                const kw = src.split(':')[1]?.trim() || '미지정';
                if (!naverKeywords[kw]) naverKeywords[kw] = { genuine: 0, flowerOrders: 0, condolenceOrders: 0 };
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

    // 부의금 채널별 배분
    if (condolenceOrders) {
        for (const cord of condolenceOrders) {
            const bSrc = (bugoSourceMap[cord.bugo_number] || '').toLowerCase();
            let targetKey = 'organic';
            if (bSrc.startsWith('naver_ad') || bSrc.includes('naver_ad')) {
                targetKey = 'naver_ad';
                if (bSrc.includes(':')) {
                    const kw = bSrc.split(':')[1]?.trim() || '미지정';
                    if (!naverKeywords[kw]) naverKeywords[kw] = { genuine: 0, flowerOrders: 0, condolenceOrders: 0 };
                    naverKeywords[kw].condolenceOrders += 1;
                }
            } else if (bSrc.startsWith('google_ad') || bSrc.includes('google_ad')) {
                targetKey = 'google_ad';
            }

            stats[targetKey].condolence_count += 1;
            stats[targetKey].condolence_amount += Number(cord.amount || 0);
            const fee = Number(cord.fee || 0) || Math.round(Number(cord.amount || 0) * 0.086);
            stats[targetKey].condolence_fee += fee;
        }
    }

    // 5. 구글 광고 실적 조회 (marketing_ad_spends)
    const { data: googleSpends } = await supabase
        .from('marketing_ad_spends')
        .select('cost, clicks, impressions')
        .eq('platform', 'google')
        .eq('spend_date', targetDateStr);

    let gCost = 0;
    let gClicks = 0;
    let gImpressions = 0;
    if (googleSpends && googleSpends.length > 0) {
        for (const s of googleSpends) {
            gCost += Number(s.cost || 0);
            gClicks += Number(s.clicks || 0);
            gImpressions += Number(s.impressions || 0);
        }
    }
    const gCpc = gClicks > 0 ? Math.round(gCost / gClicks) : 0;
    const gGenuine = stats.google_ad.genuine_20plus;
    const gCpa = gGenuine > 0 ? Math.round(gCost / gGenuine) : 0;
    const gFlowerOrders = stats.google_ad.flower_order_count;
    const gFlowerRev = stats.google_ad.flower_revenue;
    const gFlowerMargin = gFlowerOrders * 50000;
    const gCondolenceFee = stats.google_ad.condolence_fee;
    const gPlatformRevenue = gFlowerMargin + gCondolenceFee;
    const gNetProfit = gPlatformRevenue - gCost;

    // 6. 네이버 B2C 핵심 지표 계산
    const nCost = naverStats?.cost || 0;
    const nClicks = naverStats?.clicks || 0;
    const nCpc = naverStats?.cpc || 0;
    const nGenuine = stats.naver_ad.genuine_20plus;
    const nCpa = nGenuine > 0 ? Math.round(nCost / nGenuine) : 0;
    const nFlowerOrders = stats.naver_ad.flower_order_count;
    const nFlowerRev = stats.naver_ad.flower_revenue;
    const nFlowerMargin = nFlowerOrders * 50000; // 화환 건당 마진 5만 원 기준
    const nCondolenceFee = stats.naver_ad.condolence_fee;
    const nPlatformRevenue = nFlowerMargin + nCondolenceFee;
    const nNetProfit = nPlatformRevenue - nCost;

    // 6-2. 부고온 B2B 네이버 광고 & 파트너 지표 계산
    const b2bCost = naverB2BStats?.cost || 0;
    const b2bClicks = naverB2BStats?.clicks || 0;
    const b2bCpc = naverB2BStats?.cpc || 0;
    const b2bSignups = b2bNewUsers.length;
    const b2bInquiryCount = b2bInquiries.length;
    const b2bTotalLeads = b2bSignups + b2bInquiryCount;
    const b2bLeadCpa = b2bTotalLeads > 0 ? Math.round(b2bCost / b2bTotalLeads) : 0;

    let b2bTotalBugo = 0;
    let b2bGenuineBugo = 0;
    let b2bFlowerOrders = 0;
    for (const b of (bugos || [])) {
        if (b.b2b_user_id) {
            b2bTotalBugo += 1;
            if ((b.view_count || 0) >= 20) b2bGenuineBugo += 1;
            const ord = ordersMap[b.id];
            if (ord) b2bFlowerOrders += ord.count;
        }
    }

    // 7. 전체 광고 통합 손익 (네이버 B2C + 네이버 B2B + 구글)
    const totalAdCost = nCost + b2bCost + gCost;
    const totalAdPlatformRev = nPlatformRevenue + gPlatformRevenue;
    const totalAdNetProfit = totalAdPlatformRev - totalAdCost;

    // 8. 플랫폼 전체(오가닉 포함) 바닥 수치
    const totalGenuine = Object.values(stats).reduce((sum, c) => sum + c.genuine_20plus, 0);
    const totalBugo = Object.values(stats).reduce((sum, c) => sum + c.total_bugo, 0);
    const totalFlowerOrders = Object.values(stats).reduce((sum, c) => sum + c.flower_order_count, 0);
    const totalFlowerRev = Object.values(stats).reduce((sum, c) => sum + c.flower_revenue, 0);
    const totalFlowerMargin = totalFlowerOrders * 50000;

    const totalCondolenceOrders = Object.values(stats).reduce((sum, c) => sum + c.condolence_count, 0);
    const totalCondolenceAmount = Object.values(stats).reduce((sum, c) => sum + c.condolence_amount, 0);
    const totalCondolenceFee = Object.values(stats).reduce((sum, c) => sum + c.condolence_fee, 0);

    const totalPlatformProfit = totalFlowerMargin + totalCondolenceFee;
    const overallNetProfit = totalPlatformProfit - totalAdCost;

    const fmtMoney = (v: number) => `${v.toLocaleString()}원`;

    // 잔액 경고 문구
    const bizAlert = bizmoney !== null && bizmoney < 30000
        ? `⚠️ *비즈머니 잔액 부족: ${fmtMoney(bizmoney)}* (충전 필요)`
        : `• 비즈머니 잔액: ${bizmoney !== null ? fmtMoney(bizmoney) : '확인불가'}`;

    const keywordListStr = Object.keys(naverKeywords).length > 0
        ? '\n- 유입 키워드 실적: ' + Object.entries(naverKeywords)
            .map(([kw, data]) => {
                const parts = [`진성 ${data.genuine}건`];
                if (data.flowerOrders > 0) parts.push(`화환 ${data.flowerOrders}건`);
                if (data.condolenceOrders > 0) parts.push(`부의금 ${data.condolenceOrders}건`);
                return `[${kw}] ${parts.join(' / ')}`;
            })
            .join(', ')
        : '';

    const b2bSignupNames = b2bSignups > 0
        ? ` (${b2bNewUsers.map((u: any) => `${u.owner_name || '-'}/${u.company_name || '개인'}`).join(', ')})`
        : '';

    // 9. 슬랙 메시지 구성
    const b2bAdSection = `2. 부고온 B2B 검색광고 & 파트너 실적 (어제)
- 지출 광고비: ${fmtMoney(b2bCost)} (${b2bClicks}클릭, CPC ${fmtMoney(b2bCpc)})
- 신규 파트너 가입: *${b2bSignups}명*${b2bSignupNames} | 제휴 문의: *${b2bInquiryCount}건*
- 파트너·문의 획득단가(CPA): ${b2bTotalLeads > 0 ? fmtMoney(b2bLeadCpa) : '가입·문의 0건'}
- B2B 파트너 부고 발행: 총 ${b2bTotalBugo}건 중 *진성 ${b2bGenuineBugo}건* (화환 ${b2bFlowerOrders}건)`;

    const googleAdSection = gCost > 0 || stats.google_ad.total_bugo > 0
        ? `3. 구글 광고 실적 (어제)
- 지출 광고비: ${fmtMoney(gCost)} (${gClicks}클릭, CPC ${fmtMoney(gCpc)})
- 유입 부고: 총 ${stats.google_ad.total_bugo}건 중 *진성 ${gGenuine}건*
- 진성 부고 획득단가(CPA): ${gGenuine > 0 ? fmtMoney(gCpa) : '진성 0건'}
- 화환 결제: ${gFlowerOrders}건 (${fmtMoney(gFlowerRev)})
- 부의금 결제: ${stats.google_ad.condolence_count}건 (${fmtMoney(stats.google_ad.condolence_amount)} / 수익 ${fmtMoney(gCondolenceFee)})
- 구글 광고 실질 손익: ${gNetProfit >= 0 ? '+' : ''}${fmtMoney(gNetProfit)} (화환+부의금마진 - 광고비)`
        : `3. 구글 광고: 데이터 없음 (총 ${stats.google_ad.total_bugo}건 / 진성 ${gGenuine}건)`;

    const totalAdSection = totalAdCost > 0
        ? `\n5. 전체 광고 통합 손익 (네이버 B2C+B2B+구글)
- 총 광고비 지출: ${fmtMoney(totalAdCost)} (네이버 B2C ${fmtMoney(nCost)} + 부고온 B2B ${fmtMoney(b2bCost)} + 구글 ${fmtMoney(gCost)})
- 광고 유입 수익: ${fmtMoney(totalAdPlatformRev)} (화환 마진 ${fmtMoney(nFlowerMargin + gFlowerMargin)} + 부의금 수익 ${fmtMoney(nCondolenceFee + gCondolenceFee)})
- 광고 집행 최종 순손익: ${totalAdNetProfit >= 0 ? '+' : ''}${fmtMoney(totalAdNetProfit)}`
        : '';

    const slackText = `📊 [마음부고] 일일 광고 & 전환 리포트 (${targetDateStr})
${bizAlert}

1. 네이버 검색광고 - 마음부고 B2C (어제)
- 지출 광고비: ${fmtMoney(nCost)} (${nClicks}클릭, CPC ${fmtMoney(nCpc)})
- 유입 부고: 총 ${stats.naver_ad.total_bugo}건 중 *진성 ${nGenuine}건*${keywordListStr}
- 진성 부고 획득단가(CPA): ${nGenuine > 0 ? fmtMoney(nCpa) : '진성 0건'}
- 화환 결제: ${nFlowerOrders}건 (${fmtMoney(nFlowerRev)})
- 부의금 결제: ${stats.naver_ad.condolence_count}건 (${fmtMoney(stats.naver_ad.condolence_amount)} / 수익 ${fmtMoney(nCondolenceFee)})
- 네이버 B2C 실질 손익: ${nNetProfit >= 0 ? '+' : ''}${fmtMoney(nNetProfit)} (화환+부의금마진 - 광고비)

${b2bAdSection}

${googleAdSection}

4. 오가닉/직접 유입 (어제)
- 총 ${stats.organic.total_bugo}건 | *진성 ${stats.organic.genuine_20plus}건* | 화환 ${stats.organic.flower_order_count}건 | 부의금 ${stats.organic.condolence_count}건 (${fmtMoney(stats.organic.condolence_amount)} / 수익 ${fmtMoney(stats.organic.condolence_fee)})
${totalAdSection}

6. 어제 전체 실사용자 바닥 수치
- 진성 부고: *${totalGenuine}건* (전체 ${totalBugo}건)
- 화환 결제: *${totalFlowerOrders}건* (${fmtMoney(totalFlowerRev)} / 마진 ${fmtMoney(totalFlowerMargin)})
- 부의금 결제: *${totalCondolenceOrders}건* (${fmtMoney(totalCondolenceAmount)} / 플랫폼수익 ${fmtMoney(totalCondolenceFee)})
- 어제 플랫폼 총수익 (광고비 차감 전): *${fmtMoney(totalPlatformProfit)}*
- 어제 플랫폼 최종 순마진 (광고비 차감 후): *${overallNetProfit >= 0 ? '+' : ''}${fmtMoney(overallNetProfit)}*`;

    // 10. 슬랙 전송
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
        naverB2BStats,
        b2bStats: {
            cost: b2bCost,
            clicks: b2bClicks,
            cpc: b2bCpc,
            signups: b2bSignups,
            inquiries: b2bInquiryCount,
            leadCpa: b2bLeadCpa,
            totalBugo: b2bTotalBugo,
            genuineBugo: b2bGenuineBugo,
            flowerOrders: b2bFlowerOrders,
        },
        googleStats: {
            cost: gCost,
            clicks: gClicks,
            impressions: gImpressions,
            cpc: gCpc,
            genuine: gGenuine,
            cpa: gCpa,
            platformRevenue: gPlatformRevenue,
            netProfit: gNetProfit,
        },
        channelStats: stats,
        summary: {
            totalBugo,
            totalGenuine,
            totalFlowerOrders,
            totalFlowerRev,
            totalFlowerMargin,
            totalCondolenceOrders,
            totalCondolenceAmount,
            totalCondolenceFee,
            totalPlatformProfit,
            naverNetProfit: nNetProfit,
            b2bAdCost: b2bCost,
            googleNetProfit: gNetProfit,
            totalAdCost,
            totalAdNetProfit,
            overallNetProfit,
        },
    });
}
