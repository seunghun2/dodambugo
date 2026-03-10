import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 관리자 화이트리스트 (자동 차단 제외)
const ADMIN_WHITELIST_IPS = [
    '14.38.63.241',   // 관리자
    '211.36.143.67',  // 관리자 모바일
];

// 자동 차단 임계값
const AUTO_BLOCK_THRESHOLDS: Record<string, number> = {
    screenshot: 3,     // 캡처 3회 이상
    devtools: 2,       // 개발자 도구 2회 이상
    mass_view: 5,      // 부고 5건 이상 열람
};

// 사유 매핑
const REASON_MAP: Record<string, string> = {
    screenshot: '스크린샷 과다 감지',
    devtools: '개발자 도구 반복 사용',
    mass_view: '부고 대량 열람 (스크래핑 의심)',
};

// POST: 의심 활동 리포트 수신 + 자동 차단
export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        const { type, detail } = await request.json();

        const supabase = getSupabase();

        // 1. suspicious_activity 테이블에 기록
        await supabase.from('suspicious_activity').insert({
            ip_address: ip,
            type,
            detail,
            user_agent: request.headers.get('user-agent') || '',
        });

        console.log(`🚨 의심 활동: [${type}] ${ip} - ${detail}`);

        // 2. 자동 차단 판단
        const threshold = AUTO_BLOCK_THRESHOLDS[type];
        if (threshold && !ADMIN_WHITELIST_IPS.includes(ip)) {
            // 최근 24시간 내 같은 IP의 같은 유형 활동 횟수 조회
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const { count } = await supabase
                .from('suspicious_activity')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .eq('type', type)
                .gte('created_at', oneDayAgo.toISOString());

            const activityCount = count || 0;

            if (activityCount >= threshold) {
                // 이미 차단됐는지 확인
                const { data: existing } = await supabase
                    .from('blocked_ips')
                    .select('id')
                    .eq('ip_address', ip)
                    .eq('is_active', true)
                    .limit(1);

                if (!existing || existing.length === 0) {
                    // 자동 차단!
                    const reasonText = REASON_MAP[type] || type;
                    const fullReason = `[자동] ${reasonText} (${activityCount}회 감지) - ${detail}`;

                    await supabase
                        .from('blocked_ips')
                        .upsert(
                            { ip_address: ip, reason: fullReason, is_active: true },
                            { onConflict: 'ip_address' }
                        );

                    console.log(`🔒 자동 차단: ${ip} — ${fullReason}`);

                    // 슬랙 알림
                    const slackUrl = process.env.SLACK_WEBHOOK_URL;
                    if (slackUrl) {
                        await fetch(slackUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: `🔒 *IP 자동 차단*\n• IP: \`${ip}\`\n• 사유: ${fullReason}\n• 감지 횟수: ${activityCount}회`
                            })
                        }).catch(() => { });
                    }
                }
            }
        }

        // 3. 슬랙 알림 (일반 의심활동)
        const slackUrl = process.env.SLACK_WEBHOOK_URL;
        if (slackUrl) {
            await fetch(slackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 *의심 활동 감지*\n• IP: \`${ip}\`\n• 유형: ${type}\n• 상세: ${detail}`
                })
            }).catch(() => { });
        }

        return NextResponse.json({ received: true });
    } catch {
        return NextResponse.json({ error: 'error' }, { status: 500 });
    }
}
