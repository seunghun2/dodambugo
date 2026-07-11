import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FCM 토큰 등록
export async function POST(request: NextRequest) {
    try {
        const { partner_id, fcm_token, platform } = await request.json();

        if (!partner_id || !fcm_token) {
            return NextResponse.json(
                { error: 'partner_id와 fcm_token이 필요합니다.' },
                { status: 400 }
            );
        }

        // upsert: 같은 partner_id + platform이면 토큰 업데이트
        const { error } = await supabase
            .from('b2b_push_tokens')
            .upsert(
                {
                    partner_id,
                    fcm_token,
                    platform: platform || 'ios',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'partner_id,platform' }
            );

        if (error) {
            console.error('FCM 토큰 저장 오류:', error);
            return NextResponse.json(
                { error: '토큰 저장에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('FCM 토큰 API 오류:', err);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// FCM 토큰 삭제 (로그아웃 시)
export async function DELETE(request: NextRequest) {
    try {
        const { partner_id, platform } = await request.json();

        if (!partner_id) {
            return NextResponse.json(
                { error: 'partner_id가 필요합니다.' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('b2b_push_tokens')
            .delete()
            .eq('partner_id', partner_id)
            .eq('platform', platform || 'ios');

        if (error) {
            console.error('FCM 토큰 삭제 오류:', error);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('FCM 토큰 삭제 API 오류:', err);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
