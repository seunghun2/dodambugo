import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

// Cron Job: 매일 오전 10시 (한국시간) 실행
// "0 1 * * *" = UTC 01:00 = KST 10:00

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Vercel Cron 인증 확인
function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        return true;
    }
    // 개발 환경에서는 통과
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    return false;
}

export async function GET(request: NextRequest) {
    // Cron 인증 (선택사항 - CRON_SECRET 없으면 통과)
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabase();

        // 어제 발인한 부고 조회 (한국시간 기준)
        const now = new Date();
        // 한국시간으로 변환 (UTC+9)
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        koreaTime.setDate(koreaTime.getDate() - 1);
        const yesterdayStr = koreaTime.toISOString().split('T')[0];

        console.log('🔍 어제 발인한 부고 검색:', yesterdayStr);

        // funeral_date가 어제인 부고 + 아직 감사장 알림톡 안 보낸 것
        const { data: bugos, error } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password, thanks_sent')
            .eq('funeral_date', yesterdayStr)
            .or('thanks_sent.is.null,thanks_sent.eq.false');

        if (error) {
            console.error('DB 조회 에러:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: 'DB error',
                detail: error.message,
                code: error.code
            }, { status: 500 });
        }

        if (!bugos || bugos.length === 0) {
            console.log('📭 오늘 발송할 감사장 없음');
            return NextResponse.json({
                success: true,
                message: 'No thanks notifications to send',
                count: 0
            });
        }

        console.log(`📬 감사장 알림톡 발송 대상: ${bugos.length}건`);

        let sentCount = 0;
        const errors: string[] = [];

        for (const bugo of bugos) {
            if (!bugo.phone_password) {
                console.log(`⏭️ 전화번호 없음: ${bugo.bugo_number}`);
                continue;
            }

            const phoneNumber = bugo.phone_password.replace(/-/g, '');

            try {
                // 감사장 알림톡 발송
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2603110816428720O999vVNBCV',  // 감사장 알림톡 템플릿 (v2 - 께서 제거)
                    {
                        '상주명': bugo.mourner_name || '',
                        '고인명': bugo.deceased_name || '',
                        '부고ID': bugo.bugo_number,
                    }
                );

                // thanks_sent 플래그 업데이트
                await supabase
                    .from('bugo')
                    .update({ thanks_sent: true })
                    .eq('bugo_number', bugo.bugo_number);

                console.log(`✅ 감사장 알림톡 발송 완료: ${bugo.bugo_number} → ${phoneNumber}`);
                sentCount++;

            } catch (err) {
                console.error(`❌ 발송 실패: ${bugo.bugo_number}`, err);
                errors.push(bugo.bugo_number);
            }
        }

        console.log(`📊 발송 완료: ${sentCount}/${bugos.length}건`);

        return NextResponse.json({
            success: true,
            message: `Thanks notifications sent: ${sentCount}/${bugos.length}`,
            sentCount,
            totalCount: bugos.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron 실행 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
