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
        const { bugo_number, deceased_name, funeral_home, room_number, funeral_date, funeral_time, mourner_name, funeral_type, created_new, phone_changed } = body;

        // 신규 생성일 때만 슬랙 알림
        if (created_new) {
            // 슬랙 알림 전송
            await sendBugoNotification({
                bugo_number,
                deceased_name,
                mourner_name,
                funeral_type,
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
                .select('phone_password, applicant_name, ilpo_date, ilpo_time, owner_token')
                .eq('bugo_number', bugo_number)
                .single();

            if (bugo?.phone_password) {
                const phoneNumber = bugo.phone_password.replace(/-/g, '');

                // 장례식장 정보 조합 (가족장/무빈소는 장례형식 표시)
                const funeralLocation = (funeral_type === '가족장' || funeral_type === '무빈소장례')
                    ? funeral_type
                    : `${funeral_home || ''} ${room_number || ''}`.trim();

                // 일포가 있으면 줄바꿈 포맷, 없으면 기존 포맷
                let dateTimeInfo = '';
                if (bugo.ilpo_date) {
                    const ilpoDateTime = `${bugo.ilpo_date || ''} ${bugo.ilpo_time || ''}`.trim();
                    const funeralDateTime = `${funeral_date || ''} ${funeral_time || ''}`.trim();
                    dateTimeInfo = `\n(일포) ${ilpoDateTime}${funeralDateTime ? `\n(발인) ${funeralDateTime}` : ''}`;
                } else {
                    dateTimeInfo = `${funeral_date || ''} ${funeral_time || ''}`.trim();
                }

                // 알림톡 발송 (토큰 포함 새 템플릿)
                const { sendAlimtalk } = await import('@/lib/solapi');
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2602070138097871zexjvolnSU',  // 부고장 생성 완료 템플릿 (2/9 검수완료)
                    {
                        '고인명': deceased_name ? `故 ${deceased_name}` : '',
                        '장례식장': funeralLocation,
                        '발인일시': dateTimeInfo,
                        '부고번호': bugo_number,
                        'owner_token': bugo.owner_token || '',
                    }
                );
                console.log('✅ 부고 생성 알림톡 발송 완료:', phoneNumber);

                // 📅 감사장 알림톡 예약 발송 (발인 다음날 10시 KST)
                if (funeral_date) {
                    try {
                        const [fy, fm, fd] = funeral_date.split('-').map(Number);
                        const nextDay = new Date(fy, fm - 1, fd + 1);
                        const ny = nextDay.getFullYear();
                        const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
                        const nd = String(nextDay.getDate()).padStart(2, '0');
                        const scheduledKST = `${ny}-${nm}-${nd} 10:00:00`;

                        await sendAlimtalk(
                            phoneNumber,
                            'KA01TP260122105940293Z83PibzRM5z',  // 감사장 알림톡 템플릿
                            {
                                '상주명': mourner_name || '',
                                '고인명': deceased_name || '',
                                '부고ID': bugo_number,
                            },
                            scheduledKST  // 예약 발송!
                        );
                        console.log('📅 감사장 알림톡 예약 완료:', phoneNumber, '→', scheduledKST);
                    } catch (thanksErr) {
                        console.error('감사장 예약 발송 실패:', thanksErr);
                    }
                }

                // 📢 공유 리마인더는 cron(/api/cron/share-reminder)에서 처리
                // share_count = 0인 사람에게만 발송하기 위해
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
