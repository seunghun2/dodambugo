import { NextRequest, NextResponse } from 'next/server';
import { sendBugoNotification } from '@/lib/slack';
import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '@/lib/solapi';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 부고 생성 알림 (부고 생성 후 호출)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bugo_number, deceased_name, funeral_home, room_number, funeral_date, funeral_time, mourner_name, created_new } = body;

        // 신규 생성일 때만 알림
        if (!created_new) {
            return NextResponse.json({ success: true, message: 'Notification skipped (not new)' });
        }

        // 슬랙 알림 전송
        await sendBugoNotification({
            bugo_number,
            deceased_name,
            mourner_name,
            funeral_home,
            room_number,
            funeral_date,
            funeral_time,
        });

        // 📱 신청자에게 SMS 알림 (비동기)
        try {
            const supabase = getSupabase();
            const { data: bugo } = await supabase
                .from('bugo')
                .select('phone_password, applicant_name')  // phone_password에 전화번호 저장됨
                .eq('bugo_number', bugo_number)
                .single();

            if (bugo?.phone_password) {
                const phoneNumber = bugo.phone_password.replace(/-/g, '');
                const bugoLink = `https://maeumbugo.co.kr/view/${bugo_number}`;

                const message = `[마음부고] 부고장이 생성되었습니다.

■ 고인: ${deceased_name}
■ 장례식장: ${funeral_home} ${room_number || ''}
■ 발인: ${funeral_date || ''} ${funeral_time || ''}

▶ 부고장 보기
${bugoLink}

※ 수정 시 위 링크에서 '수정하기' 클릭`;

                await sendSMS(phoneNumber, message);
                console.log('✅ 부고 생성 SMS 발송 완료:', phoneNumber);
            }
        } catch (smsErr) {
            console.error('SMS 발송 실패 (무시):', smsErr);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('부고 알림 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
