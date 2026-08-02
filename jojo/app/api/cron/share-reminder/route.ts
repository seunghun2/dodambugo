import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

// Cron Job: 매시간 실행
// 부고 생성 1시간 경과 + 공유 0회인 상주에게 공유 리마인더 발송

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        return true;
    }
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    return false;
}

// 알림톡 템플릿 ID (솔라피 검수 완료 후 교체)
const SHARE_REMINDER_TEMPLATE_ID = 'KA01TP260207020322069HCW4FIURXNp'; // 공유 리마인더 (2/9 검수완료)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const testBugoNumber = searchParams.get('test_bugo');

    if (process.env.CRON_SECRET && !verifyCronRequest(request) && !testBugoNumber) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabase();

        let bugos: any[] = [];

        if (testBugoNumber) {
            // 강제 테스트 실행
            const { data, error } = await supabase
                .from('bugo')
                .select('bugo_number, deceased_name, phone_password, owner_token, share_count, share_reminder_sent, b2b_user_id')
                .eq('bugo_number', testBugoNumber);
            
            if (error) throw error;
            bugos = data || [];
        } else {
            // 한국시간 기준 09~21시 사이만 발송
            const koreaHour = new Date().getUTCHours() + 9;
            const adjustedHour = koreaHour >= 24 ? koreaHour - 24 : koreaHour;
            if (adjustedHour < 9 || adjustedHour >= 21) {
                return NextResponse.json({
                    success: true,
                    message: `Skip: outside business hours (${adjustedHour}시)`,
                    count: 0
                });
            }

            // 1시간 전 시간
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);

            // 24시간 전 (너무 오래된 건 스킵)
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            // 조건: 1~24시간 전 생성 + 공유 0회 + 리마인더 미발송 + 연락처 있음
            const { data, error } = await supabase
                .from('bugo')
                .select('bugo_number, deceased_name, phone_password, owner_token, share_count, share_reminder_sent, b2b_user_id')
                .lt('created_at', oneHourAgo.toISOString())
                .gt('created_at', oneDayAgo.toISOString())
                .or('share_count.is.null,share_count.eq.0')
                .or('share_reminder_sent.is.null,share_reminder_sent.eq.false')
                .not('phone_password', 'is', null);

            if (error) {
                console.error('DB 조회 에러:', JSON.stringify(error, null, 2));
                return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 });
            }
            bugos = data || [];
        }

        if (!bugos || bugos.length === 0) {
            console.log('📭 공유 리마인더 발송 대상 없음');
            return NextResponse.json({
                success: true,
                message: 'No share reminders to send',
                count: 0
            });
        }

        console.log(`📬 공유 리마인더 발송 대상: ${bugos.length}건`);

        let sentCount = 0;
        const errors: string[] = [];

        for (const bugo of bugos) {
            const phone = bugo.phone_password.replace(/-/g, '');

            try {
                const isB2B = !!bugo.b2b_user_id;
                if (isB2B) {
                    // B2B 부고장의 공유 리마인더: B2B 부고온 전용 LMS 문자로 깔끔하게 전송 (생성완료 템플릿 오남용 방지)
                    const { sendLMS } = await import('@/lib/solapi');
                    const b2bShareMsg = `[부고온] 상주님, 아직 부고장을 지인분들께 공유하지 않으셨습니다.

■ 고인: 故 ${bugo.deceased_name || ''}님

아래 링크를 눌러 지인분들에게 간편하게 부고장을 전달해 주세요.

■ 부고장 확인 및 공유하기:
https://bugoon.maeumbugo.co.kr/view/${bugo.bugo_number}?token=${bugo.owner_token || ''}&share=true`;

                    await sendLMS(phone, `[부고온] 부고장 공유 안내`, b2bShareMsg);
                } else {
                    // B2C 부고장의 공유 리마인더: B2C 알림톡 발송
                    await sendAlimtalk(
                        phone,
                        SHARE_REMINDER_TEMPLATE_ID,
                        {
                            '고인명': bugo.deceased_name ? `故 ${bugo.deceased_name}` : '',
                            '부고번호': bugo.bugo_number,
                            'owner_token': bugo.owner_token || '',
                        },
                        undefined,
                        false
                    );
                }

                // testBugoNumber가 아닐 때만 share_reminder_sent 플래그 업데이트
                if (!testBugoNumber) {
                    await supabase
                        .from('bugo')
                        .update({ share_reminder_sent: true })
                        .eq('bugo_number', bugo.bugo_number);
                }

                console.log(`✅ 공유 리마인더 발송 완료: ${bugo.bugo_number} → ${phone}`);
                sentCount++;

            } catch (err) {
                console.error(`❌ 발송 실패: ${bugo.bugo_number}`, err);
                errors.push(bugo.bugo_number);
            }
        }

        console.log(`📊 공유 리마인더 발송: ${sentCount}/${bugos.length}건`);

        return NextResponse.json({
            success: true,
            message: `Share reminders sent: ${sentCount}/${bugos.length}`,
            sentCount,
            totalCount: bugos.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron 실행 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
