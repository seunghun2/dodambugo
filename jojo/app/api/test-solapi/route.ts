import { NextRequest, NextResponse } from 'next/server';
import { sendAlimtalk, sendSMS } from '@/lib/solapi';

// 테스트용 - 개발환경에서만 동작
export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'dev only' }, { status: 403 });
    }

    const { phone, type } = await request.json();

    try {
        if (type === 'sms') {
            const result = await sendSMS(phone, '[마음부고 테스트] 알림톡 자동화 시스템 정상 동작 확인! 🎉');
            return NextResponse.json({ success: true, result });
        }

        // 알림톡 테스트 (템플릿 미승인이면 실패할 수 있음)
        const result = await sendAlimtalk(phone, 'PENDING_SHARE_REVIEW', {
            '고인명': '故 테스트',
            '부고번호': 'TEST-001',
            'owner_token': 'test',
        });
        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
