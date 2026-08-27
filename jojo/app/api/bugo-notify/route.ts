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
            const supabaseForCheck = getSupabase();
            const { data: bugoCheck } = await supabaseForCheck
                .from('bugo')
                .select('b2b_user_id')
                .eq('bugo_number', bugo_number)
                .single();

            const isB2B = !!bugoCheck?.b2b_user_id;

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
            }, isB2B);

            // 인앱 알람: 부고 생성 알림 (비동기)
            if (isB2B && bugoCheck?.b2b_user_id) {
                import('@/lib/partner-notification').then(({ insertInAppAlarm }) => {
                    insertInAppAlarm(
                        bugoCheck.b2b_user_id,
                        'new_funeral',
                        '새 부고장이 등록되었습니다',
                        `故 ${deceased_name || ''}님 | ${funeral_home || ''} ${room_number || ''}`,
                        '/b2b/manage',
                        'alarm_deceased'
                    );
                });
            }
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
                .select('phone_password, applicant_name, ilpo_date, ilpo_time, owner_token, b2b_user_id')
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
                const isB2B = !!bugo?.b2b_user_id;

                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2602070138097871zexjvolnSU',  // 부고장 생성 완료 템플릿 (2/9 검수완료)
                    {
                        '고인명': deceased_name ? `故 ${deceased_name}` : '',
                        '장례식장': funeralLocation,
                        '발인일시': dateTimeInfo,
                        '부고번호': bugo_number,
                        'owner_token': bugo.owner_token || '',
                        'm': '0',
                    },
                    undefined,
                    isB2B
                );
                console.log('✅ 부고 생성 알림톡 발송 완료:', phoneNumber);

                // 📅 감사장 알림톡은 발인 다음날 Cron(/api/cron/thanks-notify)에서 전화번호당 1회 단일 발송됨
                // (부고 복제 시 솔라피 예약 중복 생성 및 수정 전 날짜 오발송 방지)

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
