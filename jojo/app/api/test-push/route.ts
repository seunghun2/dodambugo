/**
 * GET /api/test-push
 * 테스트용 푸시 발송 API (임시 — 테스트 후 삭제)
 * 직접 sendPushToPartner를 호출하여 FCM 발송 결과까지 반환
 */
import { NextResponse } from 'next/server';
import { sendPushToPartner } from '@/lib/fcm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    const partnerId = '552650f0-3243-4e46-97ec-d2e7ff5de2e2';
    
    try {
        // 1. 토큰 존재 여부 확인
        const { data: tokens } = await supabase
            .from('b2b_push_tokens')
            .select('*')
            .eq('partner_id', partnerId);
        
        // 2. FCM 직접 발송
        const result = await sendPushToPartner(
            partnerId,
            '🎉 부고온 푸시 테스트',
            '백승훈 사장님, 실시간 푸시 알림이 정상 작동합니다!',
            { type: 'notice', url: '/b2b/dashboard' }
        );

        return NextResponse.json({
            success: true,
            tokens_count: tokens?.length || 0,
            tokens: tokens?.map(t => ({ platform: t.platform, token_prefix: t.fcm_token?.substring(0, 20) })),
            fcm_result: result,
        });
    } catch (err: any) {
        return NextResponse.json({ 
            success: false, 
            error: err.message,
            stack: err.stack?.split('\n').slice(0, 3),
        }, { status: 500 });
    }
}
