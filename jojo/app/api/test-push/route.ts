/**
 * GET /api/test-push
 * 테스트용 푸시 발송 API (임시 — 테스트 후 삭제)
 */
import { NextResponse } from 'next/server';
import { sendPartnerNotification } from '@/lib/partner-notification';

export async function GET() {
    try {
        await sendPartnerNotification(
            '552650f0-3243-4e46-97ec-d2e7ff5de2e2', // 백승훈
            'notice',
            {
                제목: '부고온 푸시 테스트',
                내용: '백승훈 사장님, 실시간 푸시 알림이 정상 작동합니다!',
            },
            { url: '/b2b/dashboard' }
        );
        return NextResponse.json({ success: true, message: '푸시 발송 완료!' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
