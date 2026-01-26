import { NextRequest, NextResponse } from 'next/server';
import { sendBugoNotification } from '@/lib/slack';
import { createClient } from '@supabase/supabase-js';

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

        // 📱 신청자에게 알림톡 발송 (알림톡 실패 시 SMS 대체)
        try {
            const supabase = getSupabase();
            const { data: bugo } = await supabase
                .from('bugo')
                .select('phone_password, applicant_name')  // phone_password에 전화번호 저장됨
                .eq('bugo_number', bugo_number)
                .single();

            if (bugo?.phone_password) {
                const phoneNumber = bugo.phone_password.replace(/-/g, '');

                // 장례식장 정보 조합
                const funeralLocation = `${funeral_home || ''} ${room_number || ''}`.trim();

                // 발인일시 포맷
                const funeralDateTime = `${funeral_date || ''} ${funeral_time || ''}`.trim();

                // 알림톡 발송
                const { sendAlimtalk } = await import('@/lib/solapi');
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP260122110120730mPhOlSAUi3r',  // 부고장 생성 완료 템플릿 (검수완료)
                    {
                        '장례식장': funeralLocation,
                        '발인일시': funeralDateTime,
                        '부고번호': bugo_number,
                    }
                );
                console.log('✅ 부고 생성 알림톡 발송 완료:', phoneNumber);
            }
        } catch (alimtalkErr) {
            console.error('알림톡 발송 실패:', alimtalkErr);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('부고 알림 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
