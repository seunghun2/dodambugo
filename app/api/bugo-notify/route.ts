import { NextRequest, NextResponse } from 'next/server';
import { sendBugoNotification } from '@/lib/slack';

// POST: 부고 생성 알림 (부고 생성 후 호출)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bugo_number, deceased_name, funeral_home, room_number, funeral_date, funeral_time, mourner_name, created_new } = body;

        // 신규 생성일 때만 알림
        if (!created_new) {
            return NextResponse.json({ success: true, message: 'Notification skipped (not new)' });
        }

        // 슬랙 알림 전송 (부고드림 스타일)
        await sendBugoNotification({
            bugo_number,
            deceased_name,
            mourner_name,
            funeral_home,
            room_number,
            funeral_date,
            funeral_time,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('부고 알림 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
