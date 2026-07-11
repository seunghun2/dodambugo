import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPartnerNotification } from '@/lib/partner-notification';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 발인 3시간 전 파트너 리마인더 푸시 크론
 * 
 * Vercel Cron: 매시간 실행
 * 동작: 현재 시각 기준 3시간 뒤에 발인 예정인 부고를 찾아
 *       해당 부고를 만든 B2B 파트너에게 푸시 알림을 보냄
 */
export async function GET() {
    try {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstNow = new Date(now.getTime() + kstOffset);
        const kstHour = kstNow.getUTCHours();

        // 야간(22시~6시)에는 푸시 안 보냄
        if (kstHour >= 22 || kstHour < 6) {
            return NextResponse.json({ message: '야간 시간대 스킵', skipped: true });
        }

        // 3시간 후 = 발인 시간 범위 (±30분 여유)
        const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const rangeStart = new Date(threeHoursLater.getTime() - 30 * 60 * 1000);
        const rangeEnd = new Date(threeHoursLater.getTime() + 30 * 60 * 1000);

        // 발인일시가 3시간 후인 부고 조회 (B2B 파트너 부고만)
        const { data: bugos, error } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, funeral_home, funeral_date, funeral_time, b2b_user_id')
            .not('b2b_user_id', 'is', null)
            .is('deleted_at', null);

        if (error) {
            console.error('[FuneralReminder] 부고 조회 오류:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!bugos || bugos.length === 0) {
            return NextResponse.json({ message: '발인 예정 부고 없음', sent: 0 });
        }

        let sent = 0;

        for (const bugo of bugos) {
            if (!bugo.funeral_date || !bugo.b2b_user_id) continue;

            // funeral_date + funeral_time을 합쳐서 Date 객체로 변환
            let funeralDateTime: Date;
            try {
                const dateStr = bugo.funeral_date;
                const timeStr = bugo.funeral_time || '10:00';
                
                // "2026-07-12" + "10:00" 형식 파싱 (KST)
                const [year, month, day] = dateStr.split(/[-/.]/);
                const [hour, minute] = timeStr.replace(/시|분/g, ':').replace(/\s/g, '').split(':');
                
                funeralDateTime = new Date(
                    parseInt(year), parseInt(month) - 1, parseInt(day),
                    parseInt(hour || '10'), parseInt(minute || '0')
                );
                // KST → UTC
                funeralDateTime = new Date(funeralDateTime.getTime() - kstOffset);
            } catch {
                continue; // 날짜 파싱 실패 시 스킵
            }

            // 3시간 후 범위 안에 있는지 확인
            if (funeralDateTime >= rangeStart && funeralDateTime <= rangeEnd) {
                try {
                    // 중복 발송 방지 체크
                    const { data: alreadySent } = await supabase
                        .from('b2b_notifications')
                        .select('id')
                        .eq('partner_id', bugo.b2b_user_id)
                        .eq('type', 'funeral_reminder')
                        .contains('data', { bugo_number: bugo.bugo_number })
                        .limit(1);

                    if (alreadySent && alreadySent.length > 0) {
                        console.log(`[FuneralReminder] ⏭️ 이미 리마인더 발송 완료된 부고: ${bugo.bugo_number}`);
                        continue;
                    }

                    await sendPartnerNotification(bugo.b2b_user_id, 'funeral_reminder', {
                        고인명: bugo.deceased_name || '',
                        장례식장: bugo.funeral_home || '',
                        발인일시: `${bugo.funeral_date} ${bugo.funeral_time || ''}`.trim(),
                    }, { url: '/b2b/manage', bugo_number: bugo.bugo_number });
                    sent++;
                    console.log(`[FuneralReminder] ✅ 발인 리마인더 발송: 故 ${bugo.deceased_name} → 파트너 ${bugo.b2b_user_id}`);
                } catch (err) {
                    console.error(`[FuneralReminder] ❌ 발송 실패: ${bugo.bugo_number}`, err);
                }
            }
        }

        return NextResponse.json({ message: `발인 리마인더 ${sent}건 발송 완료`, sent });
    } catch (error) {
        console.error('[FuneralReminder] 크론 실행 오류:', error);
        return NextResponse.json({ error: '크론 실행 실패' }, { status: 500 });
    }
}
