import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 의심 활동 리포트 수신
export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        const { type, detail } = await request.json();

        const supabase = getSupabase();

        // suspicious_activity 테이블에 기록
        await supabase.from('suspicious_activity').insert({
            ip_address: ip,
            type,
            detail,
            user_agent: request.headers.get('user-agent') || '',
        });

        console.log(`🚨 의심 활동: [${type}] ${ip} - ${detail}`);

        // 슬랙 알림 (웹훅 있으면)
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
