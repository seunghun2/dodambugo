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
        const { bugo_number, deceased_name, funeral_home, room_number, funeral_date, funeral_time, mourner_name, created_new, phone_changed } = body;

        // 신규 생성일 때만 슬랙 알림
        if (created_new) {
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
        }

        // 📱 신규 생성 또는 수정 시 연락처 변경 → 알림톡 발송
        if (!created_new && !phone_changed) {
            return NextResponse.json({ success: true, message: 'Notification skipped (no change)' });
        }

        // 📱 신청자에게 알림톡 발송
        try {
            const supabase = getSupabase();
            const { data: bugo } = await supabase
                .from('bugo')
                .select('phone_password, applicant_name, ilpo_date, ilpo_time')
                .eq('bugo_number', bugo_number)
                .single();

            if (bugo?.phone_password) {
                const phoneNumber = bugo.phone_password.replace(/-/g, '');

                // 장례식장 정보 조합
                const funeralLocation = `${funeral_home || ''} ${room_number || ''}`.trim();

                // 일포가 있으면 줄바꿈 포맷, 없으면 기존 포맷
                let dateTimeInfo = '';
                if (bugo.ilpo_date) {
                    const ilpoDateTime = `${bugo.ilpo_date || ''} ${bugo.ilpo_time || ''}`.trim();
                    const funeralDateTime = `${funeral_date || ''} ${funeral_time || ''}`.trim();
                    dateTimeInfo = `\n(일포) ${ilpoDateTime}${funeralDateTime ? `\n(발인) ${funeralDateTime}` : ''}`;
                } else {
                    dateTimeInfo = `${funeral_date || ''} ${funeral_time || ''}`.trim();
                }

                // 알림톡 발송
                const { sendAlimtalk } = await import('@/lib/solapi');
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP260122110120730mPhOlSAUi3r',  // 부고장 생성 완료 템플릿
                    {
                        '고인명': deceased_name ? `故 ${deceased_name}` : '',
                        '장례식장': funeralLocation,
                        '발인일시': dateTimeInfo,
                        '부고번호': bugo_number,
                    }
                );
                console.log('✅ 부고 생성 알림톡 발송 완료:', phoneNumber);

                // 📅 감사장 알림톡 예약 발송 (테스트: 1분 후 / 실제: 발인 다음날 10시)
                if (funeral_date) {
                    try {
                        // 🧪 테스트용: 1분 후 발송
                        const scheduledUtc = new Date(Date.now() + 1 * 60 * 1000);

                        // 🚀 실제 운영용 (나중에 주석 해제)
                        // const funeralDateObj = new Date(funeral_date);
                        // funeralDateObj.setDate(funeralDateObj.getDate() + 1);
                        // funeralDateObj.setHours(10, 0, 0, 0);
                        // const scheduledUtc = new Date(funeralDateObj.getTime() - (9 * 60 * 60 * 1000));

                        // 예약 시간이 현재보다 미래인 경우에만 발송
                        if (scheduledUtc > new Date()) {
                            await sendAlimtalk(
                                phoneNumber,
                                'KA01TP260122105940293Z83PibzRM5z',  // 감사장 알림톡 템플릿
                                {
                                    '상주명': mourner_name || '',
                                    '고인명': deceased_name || '',
                                    '부고ID': bugo_number,
                                },
                                scheduledUtc  // 예약 발송!
                            );
                            console.log('📅 감사장 알림톡 예약 완료 (테스트 1분 후):', phoneNumber, '→', scheduledUtc.toISOString());
                        }
                    } catch (thanksErr) {
                        console.error('감사장 예약 발송 실패:', thanksErr);
                    }
                }
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
