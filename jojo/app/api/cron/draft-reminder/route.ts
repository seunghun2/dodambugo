import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

// Cron Job: 매시간 실행
// 임시저장 후 1시간 경과 + 연락처 있는 사용자에게 리마인더 알림톡 발송

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
const DRAFT_REMINDER_TEMPLATE_ID = 'PENDING_REVIEW'; // TODO: 검수 완료 후 교체

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabase();

        // 1시간 전 시간 계산
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // 조건: 연락처 있고, 1시간 이상 경과, 리마인더 미발송, 고인명 있는 것
        const { data: drafts, error } = await supabase
            .from('drafts')
            .select('id, template, deceased_name, applicant_name, applicant_phone, b2b_user_id')
            .not('applicant_phone', 'is', null)
            .not('applicant_phone', 'eq', '')
            .not('deceased_name', 'is', null)
            .not('deceased_name', 'eq', '')
            .lt('updated_at', oneHourAgo.toISOString())
            .or('reminder_sent.is.null,reminder_sent.eq.false');

        if (error) {
            console.error('DB 조회 에러:', JSON.stringify(error, null, 2));
            return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 });
        }

        if (!drafts || drafts.length === 0) {
            console.log('📭 리마인더 발송 대상 없음');
            return NextResponse.json({
                success: true,
                message: 'No draft reminders to send',
                count: 0
            });
        }

        console.log(`📬 임시저장 리마인더 발송 대상: ${drafts.length}건`);

        // 이미 부고 완성된 연락처 조회 (중복 방지)
        const phones = drafts.map(d => d.applicant_phone!.replace(/-/g, ''));
        const { data: existingBugos } = await supabase
            .from('bugo')
            .select('phone_password')
            .in('phone_password', phones);

        const completedPhones = new Set(
            (existingBugos || []).map(b => b.phone_password?.replace(/-/g, ''))
        );

        let sentCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const draft of drafts) {
            const phone = draft.applicant_phone!.replace(/-/g, '');

            // 이미 부고 완성한 사람은 스킵
            if (completedPhones.has(phone)) {
                console.log(`⏭️ 이미 부고 완성: ${phone}`);
                skippedCount++;
                // reminder_sent 마킹 (다시 보내지 않도록)
                await supabase
                    .from('drafts')
                    .update({ reminder_sent: true })
                    .eq('id', draft.id);
                continue;
            }

            try {
                // 한국시간 기준 09:00~21:00 사이만 발송
                const koreaHour = new Date().getUTCHours() + 9;
                const adjustedHour = koreaHour >= 24 ? koreaHour - 24 : koreaHour;
                if (adjustedHour < 9 || adjustedHour >= 21) {
                    console.log(`⏭️ 발송 시간 외: ${adjustedHour}시`);
                    continue; // 다음 시간에 다시 시도
                }

                const templateId = draft.template || 'basic';
                const continueUrl = `https://maeumbugo.co.kr/create/${templateId}?draft=${draft.id}`;
                const isB2B = !!draft.b2b_user_id;

                await sendAlimtalk(
                    phone,
                    DRAFT_REMINDER_TEMPLATE_ID,
                    {
                        '고인명': draft.deceased_name || '',
                        '신청자명': draft.applicant_name || '',
                        '드래프트ID': draft.id,
                        '템플릿': templateId,
                    },
                    undefined,
                    isB2B
                );

                // reminder_sent 플래그 업데이트
                await supabase
                    .from('drafts')
                    .update({ reminder_sent: true })
                    .eq('id', draft.id);

                console.log(`✅ 리마인더 발송 완료: ${draft.id} → ${phone}`);
                sentCount++;

            } catch (err) {
                console.error(`❌ 발송 실패: ${draft.id}`, err);
                errors.push(draft.id);
            }
        }

        console.log(`📊 리마인더 발송 완료: sent=${sentCount}, skipped=${skippedCount}, errors=${errors.length}`);

        return NextResponse.json({
            success: true,
            message: `Draft reminders sent: ${sentCount}/${drafts.length}`,
            sentCount,
            skippedCount,
            totalCount: drafts.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron 실행 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
