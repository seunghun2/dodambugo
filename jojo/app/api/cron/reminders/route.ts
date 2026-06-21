import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSMS, sendAlimtalk } from '@/lib/solapi';

// Cron Job: 매시간 실행
// 1. 임시저장 리마인더: 미완성 draft에 SMS 발송
// 2. 공유 리마인더: 부고 생성 후 공유 0회 상주에게 알림톡 발송

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

// 공유 리마인더 알림톡 템플릿 ID (2/9 검수완료)
const SHARE_REMINDER_TEMPLATE_ID = 'KA01TP260207020322069HCW4FIURXNp';

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const results = { draft: { sent: 0, total: 0 }, share: { sent: 0, total: 0 } };

    // 한국시간 기준 09~21시 사이만 발송
    const koreaHour = new Date().getUTCHours() + 9;
    const adjustedHour = koreaHour >= 24 ? koreaHour - 24 : koreaHour;
    if (adjustedHour < 9 || adjustedHour >= 21) {
        return NextResponse.json({
            success: true,
            message: `Skip: outside business hours (${adjustedHour}시)`,
            results
        });
    }

    // ========================================
    // 1. 임시저장 리마인더
    // ========================================
    try {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        // 1~24시간 전 저장 + 리마인더 미발송 + 연락처 있음
        const { data: drafts } = await supabase
            .from('drafts')
            .select('*')
            .lt('updated_at', oneHourAgo.toISOString())
            .gt('updated_at', oneDayAgo.toISOString())
            .or('reminder_sent.is.null,reminder_sent.eq.false')
            .not('applicant_phone', 'is', null)
            .not('applicant_phone', 'eq', '');

        if (drafts && drafts.length > 0) {
            results.draft.total = drafts.length;
            console.log(`📝 임시저장 리마인더 대상: ${drafts.length}건`);

            for (const draft of drafts) {
                // 이미 부고 완성했는지 확인
                const { data: existingBugo } = await supabase
                    .from('bugo')
                    .select('bugo_number')
                    .eq('applicant_phone', draft.applicant_phone)
                    .gte('created_at', oneDayAgo.toISOString())
                    .limit(1);

                if (existingBugo && existingBugo.length > 0) {
                    console.log(`⏭️ 이미 부고 완성: ${draft.applicant_phone}`);
                    await supabase.from('drafts').update({ reminder_sent: true }).eq('id', draft.id);
                    continue;
                }

                const phone = draft.applicant_phone.replace(/-/g, '');
                try {
                    const isB2B = !!draft.b2b_user_id;
                    const brand = isB2B ? '부고온' : '마음부고';
                    const domain = isB2B ? 'bugoon.maeumbugo.co.kr' : 'maeumbugo.co.kr';
                    const continueUrl = `https://${domain}/create/${templateId}?draft=${draft.id}`;

                    await sendSMS(phone, `[${brand}] 작성 중인 부고장이 있습니다.

故 ${draft.deceased_name || ''} 님의 부고장이 임시저장되어 있습니다.

아래 링크에서 이어서 작성하실 수 있습니다.
${continueUrl}

문의: ${brand}`);
                    await supabase.from('drafts').update({ reminder_sent: true }).eq('id', draft.id);
                    console.log(`✅ 임시저장 리마인더: ${draft.id} → ${phone}`);
                    results.draft.sent++;
                } catch (err) {
                    console.error(`❌ 임시저장 발송 실패: ${draft.id}`, err);
                }
            }
        } else {
            console.log('📭 임시저장 리마인더 대상 없음');
        }
    } catch (err) {
        console.error('임시저장 리마인더 에러:', err);
    }

    // ========================================
    // 2. 공유 리마인더
    // ========================================
    try {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        // 1~24시간 전 생성 + 공유 4회 미만 + 리마인더 미발송
        const { data: bugos } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, phone_password, owner_token, share_count, share_reminder_sent')
            .lt('created_at', oneHourAgo.toISOString())
            .gt('created_at', oneDayAgo.toISOString())
            .or('share_count.is.null,share_count.lt.4')
            .or('share_reminder_sent.is.null,share_reminder_sent.eq.false')
            .not('phone_password', 'is', null);

        if (bugos && bugos.length > 0) {
            // 같은 전화번호로 여러 부고 → 마지막(최신 bugo_number) 하나만 발송
            const phoneMap: Record<string, typeof bugos[0]> = {};
            for (const bugo of bugos) {
                const phone = bugo.phone_password.replace(/-/g, '');
                if (!phoneMap[phone] || Number(bugo.bugo_number) > Number(phoneMap[phone].bugo_number)) {
                    phoneMap[phone] = bugo;
                }
            }

            const targets = Object.entries(phoneMap);
            results.share.total = targets.length;
            console.log(`📬 공유 리마인더 대상: ${targets.length}건 (전체 ${bugos.length}건 중 중복번호 제거)`);

            // 중복 번호의 나머지 부고는 리마인더 발송 완료 처리
            for (const bugo of bugos) {
                const phone = bugo.phone_password.replace(/-/g, '');
                if (phoneMap[phone] && phoneMap[phone].bugo_number !== bugo.bugo_number) {
                    await supabase
                        .from('bugo')
                        .update({ share_reminder_sent: true })
                        .eq('bugo_number', bugo.bugo_number);
                }
            }

            for (const [phone, bugo] of targets) {
                try {
                    await sendAlimtalk(
                        phone,
                        SHARE_REMINDER_TEMPLATE_ID,
                        {
                            '고인명': bugo.deceased_name ? `故 ${bugo.deceased_name}` : '',
                            '부고번호': bugo.bugo_number,
                            'owner_token': bugo.owner_token || '',
                        }
                    );
                    await supabase
                        .from('bugo')
                        .update({ share_reminder_sent: true })
                        .eq('bugo_number', bugo.bugo_number);
                    console.log(`✅ 공유 리마인더: ${bugo.bugo_number} → ${phone}`);
                    results.share.sent++;
                } catch (err) {
                    console.error(`❌ 공유 발송 실패: ${bugo.bugo_number}`, err);
                }
            }
        } else {
            console.log('📭 공유 리마인더 대상 없음');
        }
    } catch (err) {
        console.error('공유 리마인더 에러:', err);
    }

    console.log(`📊 리마인더 결과 — 임시저장: ${results.draft.sent}/${results.draft.total}, 공유: ${results.share.sent}/${results.share.total}`);

    return NextResponse.json({
        success: true,
        results,
        message: `Draft: ${results.draft.sent}/${results.draft.total}, Share: ${results.share.sent}/${results.share.total}`
    });
}
