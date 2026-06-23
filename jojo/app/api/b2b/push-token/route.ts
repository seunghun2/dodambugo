import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FCM 토큰 저장
export async function POST(req: NextRequest) {
    try {
        const { partner_id, fcm_token, platform } = await req.json();

        if (!partner_id || !fcm_token) {
            return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
        }

        // upsert: 같은 파트너의 같은 플랫폼이면 토큰 업데이트
        const { error } = await supabase
            .from('b2b_push_tokens')
            .upsert({
                partner_id,
                fcm_token,
                platform: platform || 'unknown',
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'partner_id,platform',
            });

        if (error) {
            console.error('[PushToken] 저장 에러:', error);
            return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// FCM 토큰 삭제 (로그아웃 시)
export async function DELETE(req: NextRequest) {
    try {
        const { partner_id } = await req.json();

        if (!partner_id) {
            return NextResponse.json({ error: '파트너 ID 누락' }, { status: 400 });
        }

        await supabase
            .from('b2b_push_tokens')
            .delete()
            .eq('partner_id', partner_id);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
