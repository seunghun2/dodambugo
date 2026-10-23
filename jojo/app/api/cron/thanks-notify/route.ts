import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk, resolveThanksTemplateId, resolveThanksReminderTemplateId } from '@/lib/solapi';

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

        // 어제(발인 1일 후) 및 3일 전(발인 3일 후) 날짜 계산 (한국시간 기준)
        const now = new Date();
        // 한국시간으로 변환 (UTC+9)
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const yesterday = new Date(koreaTime);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const threeDaysAgo = new Date(koreaTime);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

        console.log('🔍 어제 발인한 부고 검색:', yesterdayStr, '/ 3일 전 발인한 부고 검색:', threeDaysAgoStr);

        // 1) 1차 감사장 알림톡: funeral_date가 어제인 부고 + 삭제되지 않은 부고 + 아직 감사장 알림톡 안 보낸 것 (조회수 높은 실사용 부고 우선)
        const { data: bugos, error } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password, thanks_sent, b2b_user_id, view_count')
            .eq('funeral_date', yesterdayStr)
            .is('deleted_at', null)
            .or('thanks_sent.is.null,thanks_sent.eq.false')
            .order('view_count', { ascending: false });

        if (error) {
            console.error('DB 조회 에러:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: 'DB error',
                detail: error.message,
                code: error.code
            }, { status: 500 });
        }

        let sentCount = 0;
        const errors: string[] = [];

        if (bugos && bugos.length > 0) {
            console.log(`📬 1차 감사장 알림톡 발송 대상: ${bugos.length}건`);

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

            console.log(`📬 1차 감사장 알림톡 고유 발송 대상: ${bugosByPhone.size}명 (총 부고 ${bugos.length}건)`);

            for (const [phoneNumber, phoneBugos] of bugosByPhone.entries()) {
                // 대표 부고 1건 선택 (조회수 높은 것 우선)
                const primaryBugo = phoneBugos[0];
                const allBugoNumbers = phoneBugos.map(b => b.bugo_number);

                try {
                    // 감사장 알림톡 발송 (상주당 1회)
                    const isB2B = !!primaryBugo.b2b_user_id;
                    const templateId = await resolveThanksTemplateId(isB2B);
                    await sendAlimtalk(
                        phoneNumber,
                        templateId,
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

                    console.log(`✅ 1차 감사장 알림톡 발송 완료: ${primaryBugo.bugo_number} 외 ${phoneBugos.length - 1}건 → ${phoneNumber}`);
                    sentCount++;

                } catch (err) {
                    console.error(`❌ 1차 발송 실패: ${phoneNumber} (${allBugoNumbers.join(', ')})`, err);
                    errors.push(...allBugoNumbers);
                }
            }
        } else {
            console.log('📭 오늘 발송할 1차 감사장 없음');
        }

        // 2) 2차 리마인드 알림톡 (발인 3일 후): 감사장 공유(thanks_shared_at)도 안 했고 답례품 결제/발송(gift_orders)도 안 한 상주에게만 발송
        const { data: remindCandidates, error: remindError } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password, thanks_shared_at, thanks_remind_sent, b2b_user_id, view_count')
            .eq('funeral_date', threeDaysAgoStr)
            .is('deleted_at', null)
            .or('thanks_remind_sent.is.null,thanks_remind_sent.eq.false')
            .order('view_count', { ascending: false });

        let remindSentCount = 0;
        let remindSkippedCount = 0;

        if (remindError) {
            console.error('2차 리마인드 DB 조회 에러:', JSON.stringify(remindError, null, 2));
        } else if (remindCandidates && remindCandidates.length > 0) {
            const remindByPhone = new Map<string, typeof remindCandidates>();
            for (const bugo of remindCandidates) {
                if (!bugo.phone_password) continue;
                const phone = bugo.phone_password.replace(/-/g, '');
                if (!remindByPhone.has(phone)) {
                    remindByPhone.set(phone, []);
                }
                remindByPhone.get(phone)!.push(bugo);
            }

            // 후보 부고 번호들의 답례품 주문(결제 완료 이상) 여부 일괄 조회
            const allCandidateBugoNumbers = remindCandidates.map(b => b.bugo_number);
            const { data: giftOrders } = await supabase
                .from('gift_orders')
                .select('bugo_number, buyer_phone, status')
                .in('bugo_number', allCandidateBugoNumbers)
                .in('status', ['paid', 'test_paid', 'sending', 'sent', 'partial']);

            const giftedBugoSet = new Set((giftOrders || []).map(o => o.bugo_number).filter(Boolean));
            const giftedPhoneSet = new Set(
                (giftOrders || [])
                    .map(o => (o.buyer_phone || '').replace(/-/g, ''))
                    .filter(Boolean)
            );

            for (const [phoneNumber, phoneBugos] of remindByPhone.entries()) {
                const primaryBugo = phoneBugos[0];
                const allBugoNumbers = phoneBugos.map(b => b.bugo_number);

                // 이 상주의 부고 중 하나라도 감사장을 공유했거나 답례품을 보낸 경우 → 리마인드 발송 제외 & 완료 처리
                const hasSharedThanks = phoneBugos.some(b => !!b.thanks_shared_at);
                const hasSentGift =
                    giftedPhoneSet.has(phoneNumber) ||
                    phoneBugos.some(b => giftedBugoSet.has(b.bugo_number));

                if (hasSharedThanks || hasSentGift) {
                    await supabase
                        .from('bugo')
                        .update({ thanks_remind_sent: true })
                        .in('bugo_number', allBugoNumbers);
                    remindSkippedCount++;
                    console.log(`⏭️ 2차 리마인드 제외 (감사장/답례품 이미 이용): ${phoneNumber} (${allBugoNumbers.join(', ')})`);
                    continue;
                }

                try {
                    const isB2B = !!primaryBugo.b2b_user_id;
                    const reminderTemplateId = await resolveThanksReminderTemplateId(isB2B);

                    if (!reminderTemplateId) {
                        console.log(`⏳ 2차 리마인드 템플릿 검수 대기 중으로 발송 보류: ${phoneNumber}`);
                        continue;
                    }

                    await sendAlimtalk(
                        phoneNumber,
                        reminderTemplateId,
                        {
                            '상주명': primaryBugo.mourner_name || '',
                            '고인명': primaryBugo.deceased_name || '',
                            '부고ID': primaryBugo.bugo_number,
                        },
                        undefined,
                        isB2B
                    );

                    await supabase
                        .from('bugo')
                        .update({ thanks_remind_sent: true })
                        .in('bugo_number', allBugoNumbers);

                    console.log(`✅ 2차 리마인드 알림톡 발송 완료: ${primaryBugo.bugo_number} 외 ${phoneBugos.length - 1}건 → ${phoneNumber}`);
                    remindSentCount++;
                } catch (err) {
                    console.error(`❌ 2차 리마인드 발송 실패: ${phoneNumber} (${allBugoNumbers.join(', ')})`, err);
                    errors.push(...allBugoNumbers);
                }
            }
        } else {
            console.log('📭 오늘 발송할 2차 리마인드 감사장 없음');
        }

        console.log(`📊 발송 완료: 1차 ${sentCount}명 / 2차 리마인드 ${remindSentCount}명 (제외 ${remindSkippedCount}명)`);

        return NextResponse.json({
            success: true,
            message: `Thanks notifications sent: day1=${sentCount}, day3Remind=${remindSentCount}, skipped=${remindSkippedCount}`,
            sentCount,
            remindSentCount,
            remindSkippedCount,
            totalCount: bugos?.length || 0,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron 실행 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
