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

    // 차단된 번호 조회 (전체 cron 공통)
    const { data: blockedList } = await supabase
        .from('blocked_phones')
        .select('phone')
        .eq('is_active', true);
    const blockedSet = new Set((blockedList || []).map(b => b.phone.replace(/-/g, '')));

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
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 최근 24시간 내 이미 리마인더가 발송된 전화번호 조회 (중복 문자 원천 차단)
        const { data: recentlyReminded } = await supabase
            .from('drafts')
            .select('applicant_phone')
            .eq('reminder_sent', true)
            .gt('updated_at', oneDayAgo.toISOString())
            .not('applicant_phone', 'is', null);

        const alreadyRemindedPhones = new Set(
            (recentlyReminded || [])
                .map(d => (d.applicant_phone || '').replace(/\D/g, ''))
                .filter(Boolean)
        );

        // 15분~24시간 전 저장 + 리마인더 미발송 + 연락처 있음 (고인명 미입력자도 포함)
        const { data: drafts } = await supabase
            .from('drafts')
            .select('*')
            .lt('updated_at', fifteenMinutesAgo.toISOString())
            .gt('updated_at', oneDayAgo.toISOString())
            .or('reminder_sent.is.null,reminder_sent.eq.false')
            .not('applicant_phone', 'is', null)
            .not('applicant_phone', 'eq', '')
            .order('updated_at', { ascending: false });

        if (drafts && drafts.length > 0) {
            // 동일 전화번호 중복 제거: 번호별 가장 완성도 높은/최신 draft 1건만 선택
            const phoneDraftMap = new Map<string, typeof drafts[0]>();
            const phoneAllIdsMap = new Map<string, string[]>();

            for (const draft of drafts) {
                const phone = (draft.applicant_phone || '').replace(/\D/g, '');
                if (!phone.startsWith('010') || phone.length < 10) {
                    // 유효하지 않은 번호는 발송 대상에서 제외 처리
                    await supabase.from('drafts').update({ reminder_sent: true }).eq('id', draft.id);
                    continue;
                }

                const ids = phoneAllIdsMap.get(phone) || [];
                ids.push(draft.id);
                phoneAllIdsMap.set(phone, ids);

                const existing = phoneDraftMap.get(phone);
                if (!existing) {
                    phoneDraftMap.set(phone, draft);
                } else {
                    // 고인명이나 장례식장이 있는 쪽을 우선 선택
                    const existingScore = (existing.deceased_name ? 2 : 0) + (existing.funeral_home ? 1 : 0);
                    const currentScore = (draft.deceased_name ? 2 : 0) + (draft.funeral_home ? 1 : 0);
                    if (currentScore > existingScore) {
                        phoneDraftMap.set(phone, draft);
                    }
                }
            }

            results.draft.total = phoneDraftMap.size;
            console.log(`📝 임시저장 리마인더 대상: ${phoneDraftMap.size}명 (원본 ${drafts.length}건)`);

            for (const [phone, draft] of phoneDraftMap.entries()) {
                const allIdsForPhone = phoneAllIdsMap.get(phone) || [draft.id];
                const formattedPhone = phone.length === 11
                    ? `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
                    : phone;

                // 차단 번호 또는 최근 24시간 내 이미 발송된 번호 제외
                if (blockedSet.has(phone) || alreadyRemindedPhones.has(phone)) {
                    console.log(`⛔ 차단 또는 기발송 번호 건너뜀: ${phone}`);
                    await supabase.from('drafts').update({ reminder_sent: true }).in('id', allIdsForPhone);
                    continue;
                }

                // 이미 부고 완성했는지 확인 (하이픈 유무 및 phone_password 모두 대조)
                const { data: existingBugo } = await supabase
                    .from('bugo')
                    .select('bugo_number')
                    .is('deleted_at', null)
                    .or(`applicant_phone.eq.${phone},applicant_phone.eq.${formattedPhone},phone_password.eq.${phone},phone_password.eq.${formattedPhone}`)
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .limit(1);

                if (existingBugo && existingBugo.length > 0) {
                    console.log(`⏭️ 이미 부고 완성: ${phone}`);
                    await supabase.from('drafts').update({ reminder_sent: true }).in('id', allIdsForPhone);
                    continue;
                }

                try {
                    const isB2B = !!draft.b2b_user_id;
                    const brand = isB2B ? '부고온' : '마음부고';
                    const domain = isB2B ? 'bugoon.maeumbugo.co.kr' : 'maeumbugo.co.kr';
                    const templateId = draft.template || draft.template_id || 'basic';
                    const continueUrl = `https://${domain}/create/${templateId}?draft=${draft.id}`;
                    const statusLine = draft.deceased_name
                        ? `故 ${draft.deceased_name} 님의 부고장이 임시저장되어 있습니다.`
                        : `${draft.applicant_name ? `${draft.applicant_name} 님, ` : ''}작성 중이시던 부고장이 임시저장되어 있습니다.`;

                    // 동일 번호의 모든 draft를 먼저 reminder_sent = true 처리하여 중복 발송 방지
                    await supabase.from('drafts').update({ reminder_sent: true }).in('id', allIdsForPhone);
                    alreadyRemindedPhones.add(phone);

                    await sendSMS(phone, `[${brand}] 작성 중인 부고장이 있습니다.

${statusLine}

아래 링크에서 이어서 작성하실 수 있습니다.
${continueUrl}

문의: ${brand}`);
                    console.log(`✅ 임시저장 리마인더: ${draft.id} (${templateId}) → ${phone}`);
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

        // 1~24시간 전 생성 + 공유 4회 미만 + 리마인더 미발송 + 삭제되지 않은 B2C 일반 부고만
        const { data: bugos } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, phone_password, owner_token, share_count, share_reminder_sent, b2b_user_id, funeral_home, room_number, funeral_date, funeral_time, funeral_type')
            .is('deleted_at', null)
            .lt('created_at', oneHourAgo.toISOString())
            .gt('created_at', oneDayAgo.toISOString())
            .is('b2b_user_id', null)
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
                // 차단 번호 제외
                if (blockedSet.has(phone)) {
                    console.log(`⛔ 차단된 번호 공유 리마인더 건너뜀: ${phone}`);
                    await supabase.from('bugo').update({ share_reminder_sent: true }).eq('bugo_number', bugo.bugo_number);
                    continue;
                }
                try {
                    const isB2B = !!bugo.b2b_user_id;
                    const funeralLocation = (bugo.funeral_type === '가족장' || bugo.funeral_type === '무빈소장례')
                        ? bugo.funeral_type
                        : `${bugo.funeral_home || ''} ${bugo.room_number || ''}`.trim();
                    const funeralDateTime = `${bugo.funeral_date || ''} ${bugo.funeral_time || ''}`.trim();

                    if (isB2B) {
                        await sendAlimtalk(
                            phone,
                            'KA01TP2602070138097871zexjvolnSU',
                            {
                                '고인명': bugo.deceased_name ? `故 ${bugo.deceased_name}` : '',
                                '장례식장': funeralLocation || '장례식장',
                                '발인일시': funeralDateTime || '미정',
                                '부고번호': bugo.bugo_number,
                                'owner_token': bugo.owner_token || '',
                            },
                            undefined,
                            true
                        );
                    } else {
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
