import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '@/lib/solapi';

// Cron Job: 매시간 실행
// 1. 임시저장 리마인더: 미완성 draft에 SMS 발송 (알림톡 검수 전까지)
// 2. 공유 리마인더: 부고 생성 후 조회수 5회 이하 상주에게 SMS 발송

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

// TODO: 알림톡 검수 완료 후 sendSMS → sendAlimtalk 로 교체

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
                    const templateId = draft.template_id || 'basic';
                    const continueUrl = `https://maeumbugo.co.kr/create/${templateId}?draft=${draft.id}`;

                    await sendSMS(phone, `[마음부고] 작성 중인 부고장이 있습니다.

故 ${draft.deceased_name || ''} 님의 부고장이 임시저장되어 있습니다.

아래 링크에서 이어서 작성하실 수 있습니다.
${continueUrl}

문의: 마음부고`);
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

        // 1~24시간 전 생성 + 조회수 5회 이하 + 리마인더 미발송
        const { data: bugos } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, phone_password, applicant_name, funeral_home, room_number, funeral_date, funeral_time, death_date, death_time, mourners, view_count, share_reminder_sent')
            .lt('created_at', oneHourAgo.toISOString())
            .gt('created_at', oneDayAgo.toISOString())
            .or('view_count.is.null,view_count.lte.5')
            .or('share_reminder_sent.is.null,share_reminder_sent.eq.false')
            .not('phone_password', 'is', null);

        if (bugos && bugos.length > 0) {
            results.share.total = bugos.length;
            console.log(`📬 공유 리마인더 대상: ${bugos.length}건`);

            for (const bugo of bugos) {
                const phone = bugo.phone_password.replace(/-/g, '');
                try {
                    const viewUrl = `https://maeumbugo.co.kr/view/${bugo.bugo_number}`;

                    // 날짜/시간 포맷 (완성 페이지와 동일)
                    const formatDateTime = (dateStr?: string, timeStr?: string) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;
                        const day = date.getDate();
                        if (timeStr) {
                            const [h, m] = timeStr.split(':');
                            const ampm = parseInt(h) < 12 ? '오전' : '오후';
                            const hour = parseInt(h) % 12 || 12;
                            return `${year}년 ${month}월 ${day}일 ${ampm} ${hour}시 ${m}분`;
                        }
                        return `${year}년 ${month}월 ${day}일`;
                    };

                    // 상주 이름 추출
                    let mournerName = '';
                    try {
                        const mourners = typeof bugo.mourners === 'string' ? JSON.parse(bugo.mourners) : bugo.mourners;
                        if (Array.isArray(mourners) && mourners.length > 0) {
                            mournerName = mourners[0].name || '';
                        }
                    } catch { }
                    if (!mournerName) mournerName = bugo.applicant_name || '';

                    const deathDateTime = formatDateTime(bugo.death_date, bugo.death_time);
                    const funeralDateTime = formatDateTime(bugo.funeral_date, bugo.funeral_time);
                    const venue = [bugo.funeral_home, bugo.room_number].filter(Boolean).join(' ');

                    await sendSMS(phone, `(마음부고) 부고장을 가족·지인에게 공유해 보세요.

[訃告]
故 ${bugo.deceased_name || ''} 님께서${mournerName ? ` (상주 ${mournerName})` : ''}
${deathDateTime}에
별세하셨기에 아래와 같이 부고를 전해드립니다.

[부고장 확인하기]
${viewUrl}

발인일: ${funeralDateTime || '추후 공지'}
빈소: ${venue || '-'}

갑작스러운 비보에 직접 연락드리지 못하고
모바일 부고장으로 알려드리는 점
너그러이 헤아려 주시기 바랍니다.`);
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
