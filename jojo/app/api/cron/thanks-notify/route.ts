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

        // 어제 발인한 부고(1차) + 3일 전 발인한 부고(2차 리마인드) 조회 (한국시간 기준)
        const now = new Date();
        // 한국시간으로 변환 (UTC+9)
        const koreaYesterday = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        koreaYesterday.setDate(koreaYesterday.getDate() - 1);
        const yesterdayStr = koreaYesterday.toISOString().split('T')[0];

        const koreaThreeDaysAgo = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        koreaThreeDaysAgo.setDate(koreaThreeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = koreaThreeDaysAgo.toISOString().split('T')[0];

        console.log('🔍 어제 발인(1차):', yesterdayStr, '/ 3일 전 발인(2차 리마인드):', threeDaysAgoStr);

        // 1) funeral_date가 어제인 부고 + 아직 감사장 알림톡 안 보낸 것
        const { data: bugos, error } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password, thanks_sent, b2b_user_id')
            .eq('funeral_date', yesterdayStr)
            .is('deleted_at', null)
            .or('thanks_sent.is.null,thanks_sent.eq.false');

        if (error) {
            console.error('DB 조회 에러:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: 'DB error',
                detail: error.message,
                code: error.code
            }, { status: 500 });
        }

        const bugosByPhone = new Map<string, NonNullable<typeof bugos>>();
        for (const bugo of bugos || []) {
            if (!bugo.phone_password) continue;
            const phone = bugo.phone_password.replace(/-/g, '');
            if (!bugosByPhone.has(phone)) {
                bugosByPhone.set(phone, []);
            }
            bugosByPhone.get(phone)!.push(bugo);
        }

        console.log(`📬 1차 감사장 알림톡 고유 발송 대상: ${bugosByPhone.size}명 (총 부고 ${(bugos || []).length}건)`);

        let sentCount = 0;
        const errors: string[] = [];

        for (const [phoneNumber, phoneBugos] of bugosByPhone.entries()) {
            const primaryBugo = phoneBugos[0];
            const allBugoNumbers = phoneBugos.map(b => b.bugo_number);

            try {
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

        // 2) 발인 3일 후(threeDaysAgoStr) 부고 중 감사장 공유도 안 했고 답례품도 안 보낸 상주에게 2차 리마인드 발송
        const { data: remindCandidates } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password, thanks_shared_at, thanks_remind_sent, b2b_user_id')
            .eq('funeral_date', threeDaysAgoStr)
            .is('deleted_at', null)
            .or('thanks_remind_sent.is.null,thanks_remind_sent.eq.false');

        const remindByPhone = new Map<string, NonNullable<typeof remindCandidates>>();
        for (const bugo of remindCandidates || []) {
            if (!bugo.phone_password) continue;
            const phone = bugo.phone_password.replace(/-/g, '');
            if (!remindByPhone.has(phone)) {
                remindByPhone.set(phone, []);
            }
            remindByPhone.get(phone)!.push(bugo);
        }

        // 모든 후보 부고번호에 대한 답례품 주문 존재 여부 일괄 조회
        const allCandidateBugoNumbers = (remindCandidates || []).map(b => String(b.bugo_number));
        const paidGiftBugoNumbers = new Set<string>();
        const paidGiftBuyerPhones = new Set<string>();

        if (allCandidateBugoNumbers.length > 0) {
            const { data: giftOrders } = await supabase
                .from('gift_orders')
                .select('bugo_number, buyer_phone, status')
                .in('bugo_number', allCandidateBugoNumbers)
                .in('status', ['paid', 'test_paid', 'sending', 'sent', 'partial']);

            for (const go of giftOrders || []) {
                if (go.bugo_number) paidGiftBugoNumbers.add(String(go.bugo_number));
                if (go.buyer_phone) paidGiftBuyerPhones.add(String(go.buyer_phone).replace(/\D/g, ''));
            }
        }

        let remindSentCount = 0;
        let remindSkippedUsed = 0;

        for (const [phoneNumber, phoneBugos] of remindByPhone.entries()) {
            const allBugoNumbers = phoneBugos.map(b => String(b.bugo_number));
            const alreadySharedThanks = phoneBugos.some(b => !!b.thanks_shared_at);
            const alreadyOrderedGift =
                paidGiftBuyerPhones.has(phoneNumber) ||
                allBugoNumbers.some(num => paidGiftBugoNumbers.has(num));

            // 이미 감사장을 공유했거나 답례품을 보낸 상주는 리마인드 제외 및 완료 처리
            if (alreadySharedThanks || alreadyOrderedGift) {
                remindSkippedUsed++;
                await supabase
                    .from('bugo')
                    .update({ thanks_remind_sent: true })
                    .in('bugo_number', allBugoNumbers);
                continue;
            }

            const primaryBugo = phoneBugos[0];
            const isB2B = !!primaryBugo.b2b_user_id;
            const remindTemplateId = await resolveThanksReminderTemplateId(isB2B);

            // 카카오 검수 중(INSPECTING)이면 아직 발송하지 않고 다음 날 승인 후 발송될 수 있도록 보류
            if (!remindTemplateId) {
                console.log(`⏳ 2차 리마인드 템플릿 검수 대기 중 (발송 보류): ${primaryBugo.bugo_number}`);
                continue;
            }

            try {
                await sendAlimtalk(
                    phoneNumber,
                    remindTemplateId,
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

                console.log(`✅ 2차(발인 3일 후) 감사장 리마인드 발송 완료: ${primaryBugo.bugo_number} → ${phoneNumber}`);
                remindSentCount++;
            } catch (err) {
                console.error(`❌ 2차 리마인드 발송 실패: ${phoneNumber} (${allBugoNumbers.join(', ')})`, err);
                errors.push(...allBugoNumbers);
            }
        }

        console.log(`📊 발송 완료 — 1차: ${sentCount}/${bugosByPhone.size}명, 2차 리마인드: ${remindSentCount}명 (기이용 제외: ${remindSkippedUsed}명)`);

        return NextResponse.json({
            success: true,
            message: `Thanks notifications sent: day1=${sentCount}/${(bugos || []).length}, day3Remind=${remindSentCount} (skippedUsed=${remindSkippedUsed})`,
            sentCount,
            remindSentCount,
            remindSkippedUsed,
            totalCount: (bugos || []).length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron 실행 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
