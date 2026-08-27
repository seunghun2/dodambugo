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
            .select('bugo_number, deceased_name, mourner_name, phone_password, thanks_sent, b2b_user_id')
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

        // 📱 전화번호별 중복 제거 (상주가 부고장을 복제/여러 개 만들어도 1명당 1회만 발송)
        const bugosByPhone = new Map<string, typeof bugos>();
        for (const bugo of bugos) {
            if (!bugo.phone_password) continue;
            const phone = bugo.phone_password.replace(/-/g, '');
            if (!bugosByPhone.has(phone)) {
                bugosByPhone.set(phone, []);
            }
            bugosByPhone.get(phone)!.push(bugo);
        }

        console.log(`📬 감사장 알림톡 고유 발송 대상: ${bugosByPhone.size}명 (총 부고 ${bugos.length}건)`);

        let sentCount = 0;
        const errors: string[] = [];

        for (const [phoneNumber, phoneBugos] of bugosByPhone.entries()) {
            // 대표 부고 1건 선택 (가장 최근 것)
            const primaryBugo = phoneBugos[0];
            const allBugoNumbers = phoneBugos.map(b => b.bugo_number);

            try {
                // 감사장 알림톡 발송 (상주당 1회)
                const isB2B = !!primaryBugo.b2b_user_id;
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2603110816428720O999vVNBCV',  // 감사장 알림톡 템플릿 (v2 - 께서 제거)
                    {
                        '상주명': primaryBugo.mourner_name || '',
                        '고인명': primaryBugo.deceased_name || '',
                        '부고ID': primaryBugo.bugo_number,
                    },
                    undefined,
                    isB2B
                );

                // 해당 전화번호의 모든 부고(복제본 포함) thanks_sent 일괄 업데이트
                await supabase
                    .from('bugo')
                    .update({ thanks_sent: true })
                    .in('bugo_number', allBugoNumbers);

                console.log(`✅ 감사장 알림톡 발송 완료: ${primaryBugo.bugo_number} 외 ${phoneBugos.length - 1}건 → ${phoneNumber}`);
                sentCount++;

            } catch (err) {
                console.error(`❌ 발송 실패: ${phoneNumber} (${allBugoNumbers.join(', ')})`, err);
                errors.push(...allBugoNumbers);
            }
        }

        console.log(`📊 발송 완료: ${sentCount}/${bugosByPhone.size}명 (부고 ${bugos.length}건)`);

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
