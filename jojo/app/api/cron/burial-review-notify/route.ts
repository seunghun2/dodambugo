import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';
import { generateReviewCode } from '@/lib/burial-review';

// Cron Job: 매일 오후 5시 (한국시간) 실행
// "0 8 * * *" = UTC 08:00 = KST 17:00
// 발인 후 2일째 오후 5시에 장지 후기 알림톡 발송

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    if (process.env.NODE_ENV === 'development') return true;
    return false;
}

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabase();

        // 한국시간 기준 2일 전 날짜 (발인 후 2일)
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        koreaTime.setDate(koreaTime.getDate() - 2);
        const twoDaysAgoStr = koreaTime.toISOString().split('T')[0];

        console.log('🔍 장지 후기 알림 대상 검색: 발인일 =', twoDaysAgoStr);

        // 2일 전 발인한 부고 중 장지가 있고, 후기 알림 아직 안 보낸 것
        const { data: bugos, error } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password, burial_place, review_notify_sent, b2b_user_id')
            .eq('funeral_date', twoDaysAgoStr)
            .not('burial_place', 'is', null)
            .is('deleted_at', null)
            .or('review_notify_sent.is.null,review_notify_sent.eq.false');

        if (error) {
            console.error('DB 조회 에러:', JSON.stringify(error, null, 2));
            return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 });
        }

        if (!bugos || bugos.length === 0) {
            console.log('📭 오늘 발송할 장지 후기 알림 없음');
            return NextResponse.json({ success: true, message: 'No review notifications', count: 0 });
        }

        // 같은 전화번호로 여러 부고가 있으면 마지막(가장 큰 bugo_number) 하나만 발송
        const phoneMap: Record<string, typeof bugos[0]> = {};
        for (const bugo of bugos) {
            if (!bugo.phone_password) continue;
            const phone = bugo.phone_password.replace(/-/g, '');

            // 이미 있으면 bugo_number가 더 큰 것(최신)으로 교체
            if (!phoneMap[phone] || Number(bugo.bugo_number) > Number(phoneMap[phone].bugo_number)) {
                phoneMap[phone] = bugo;
            }
        }

        const targets = Object.entries(phoneMap);
        console.log(`📬 장지 후기 알림 발송 대상: ${targets.length}건 (전체 ${bugos.length}건 중 중복번호 제거)`);

        let sentCount = 0;
        const errors: string[] = [];

        for (const [phone, bugo] of targets) {
            try {
                const reviewCode = generateReviewCode(String(bugo.bugo_number));
                const isB2B = !!bugo.b2b_user_id;

                await sendAlimtalk(
                    phone,
                    'KA01TP260310031832180MIhfBqgYYoB',
                    {
                        '상주명': bugo.mourner_name || '',
                        '고인명': bugo.deceased_name || '',
                        '장지명': bugo.burial_place || '',
                        '리뷰링크': reviewCode,
                    },
                    undefined,
                    isB2B
                );

                // 해당 전화번호의 모든 부고에 대해 review_notify_sent 플래그 업데이트
                const sameBugos = bugos.filter(b =>
                    b.phone_password?.replace(/-/g, '') === phone
                );
                for (const sb of sameBugos) {
                    await supabase
                        .from('bugo')
                        .update({ review_notify_sent: true })
                        .eq('bugo_number', sb.bugo_number);
                }

                console.log(`✅ 장지 후기 알림 발송: ${bugo.bugo_number} → ${phone} (${reviewCode})`);
                sentCount++;

            } catch (err) {
                console.error(`❌ 발송 실패: ${bugo.bugo_number}`, err);
                errors.push(String(bugo.bugo_number));
            }
        }

        console.log(`📊 장지 후기 알림 완료: ${sentCount}/${targets.length}건`);

        return NextResponse.json({
            success: true,
            message: `Review notifications sent: ${sentCount}/${targets.length}`,
            sentCount,
            totalBugos: bugos.length,
            uniquePhones: targets.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron 실행 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
