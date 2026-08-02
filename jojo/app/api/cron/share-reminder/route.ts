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
                // B2B 부고장 공유 리마인더일 경우 B2B bugoon 템플릿 및 B2B 파라미터 적용
                const templateId = isB2B 
                    ? 'KA01TP260714223554397jpnpiNrrFt2'  // B2B 전용 부고온 템플릿
                    : SHARE_REMINDER_TEMPLATE_ID;

                const alimtalkVars: Record<string, string> = isB2B ? {
                    '대표상주명': bugo.deceased_name ? `故 ${bugo.deceased_name} 상주` : '',
                    '고인명': bugo.deceased_name || '',
                    '장례식장': '부고장 공유 안내',
                    '발인일시': '지인분들에게 간편하게 전하세요',
                    '부고번호': bugo.bugo_number,
                    'owner_token': bugo.owner_token || '',
                } : {
                    '고인명': bugo.deceased_name ? `故 ${bugo.deceased_name}` : '',
                    '부고번호': bugo.bugo_number,
                    'owner_token': bugo.owner_token || '',
                };

                await sendAlimtalk(
                    phone,
                    templateId,
                    alimtalkVars,
                    undefined,
                    isB2B
                );

                // share_reminder_sent 플래그 업데이트
                await supabase
                    .from('bugo')
                    .update({ share_reminder_sent: true })
                    .eq('bugo_number', bugo.bugo_number);

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
