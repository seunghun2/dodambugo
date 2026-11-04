import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron: 매일 오전 10시 (KST) = UTC 01:00 ("0 1 * * *")
export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('token') === process.env.CRON_SECRET || searchParams.get('test') === 'true') return true;
    if (process.env.NODE_ENV === 'development') return true;
    return false;
}

const TEST_PHONES = new Set([
    '01064262393',
    '01048375071',
    '01012345678',
    '01000000000',
]);

function cleanPhone(p?: string | null): string {
    return (p || '').replace(/[^0-9]/g, '');
}

function formatDuration(seconds: number): string {
    if (seconds < 5) return '즉시 이탈(5초 미만)';
    if (seconds < 60) return `${Math.round(seconds)}초 체류`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}시간 ${remMins}분 간격 재접속`;
    }
    return secs > 0 ? `${mins}분 ${secs}초 체류` : `${mins}분 체류`;
}

function formatKstTime(iso: string): string {
    const d = new Date(iso);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mm = String(kst.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

interface AnalyzedDraft {
    id: string;
    template: string;
    applicantName: string;
    applicantPhone: string;
    phoneVerified: boolean;
    isManualSave: boolean;
    funeralType: string;
    funeralHome: string;
    roomNumber: string;
    deceasedName: string;
    age: number | null;
    gender: string;
    mournerName: string;
    relationship: string;
    extraMournersCount: number;
    hasRealMournerInput: boolean;
    funeralTime: string;
    deathTime: string;
    burialPlace: string;
    hasAccount: boolean;
    isAccountSaved: boolean;
    viewedSteps: string[];
    firstAt: string;
    lastAt: string;
    durationSec: number;
    stageNum: 1 | 2 | 3 | 4 | 5;
    stageLabel: string;
    progressTrail: string;
    dropReason: string;
}

function analyzeDraftGroup(rows: any[]): AnalyzedDraft {
    // 가장 많이 입력된(또는 가장 마지막에 업데이트된) 행을 기준으로 하되, 체류시간은 첫 생성~마지막 수정으로 계산
    const sortedByTime = [...rows].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstAt = sortedByTime[0].created_at;
    const lastAt = rows.reduce((latest, r) => {
        const t = r.updated_at || r.created_at;
        return new Date(t) > new Date(latest) ? t : latest;
    }, firstAt);

    // 점수가 가장 높은(입력 필드가 가장 많은) row 선택
    const scoreRow = (r: any) => {
        let s = 0;
        if (r.deceased_name) s += 10;
        if (r.funeral_home) s += 5;
        if (r.room_number) s += 2;
        if (r.funeral_time) s += 3;
        if (r.form_payload?.phoneVerified) s += 4;
        if (r.form_payload?.isAccountSaved) s += 4;
        if (r.form_payload?.isManualSave) s += 3;
        return s;
    };

    const best = [...rows].sort((a, b) => {
        const diff = scoreRow(b) - scoreRow(a);
        if (diff !== 0) return diff;
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    })[0];

    const payload = best.form_payload || {};
    const formData = payload.formData || {};
    const applicantName = (best.applicant_name || formData.applicant_name || '').trim();
    const applicantPhone = (best.applicant_phone || formData.applicant_phone || '').trim();
    const phoneVerified = Boolean(payload.phoneVerified);
    const isManualSave = rows.some((r) => Boolean(r.form_payload?.isManualSave));

    const funeralType = (best.funeral_type || formData.funeral_type || '일반 장례').trim();
    const funeralHome = (best.funeral_home || formData.funeral_home || '').trim();
    const roomNumber = (best.room_number || formData.room_number || '').trim();
    const hasFuneralLocation =
        Boolean(funeralHome) || funeralType === '무빈소장례' || funeralType === '무빈소' || funeralType === '가족장';

    const deceasedName = (best.deceased_name || formData.deceased_name || '').trim();
    const age = best.age ?? (formData.age ? Number(formData.age) : null);
    const gender = (best.gender || formData.gender || '').trim();

    const mournerName = (best.mourner_name || formData.primary_mourner || '').trim();
    const relationship = (best.relationship || formData.relationship || '').trim();
    const mournersArr = Array.isArray(best.mourners) ? best.mourners : [];
    const validExtraMourners = mournersArr.filter(
        (m: any) => (m?.name && String(m.name).trim() !== '') || (m?.relationship && String(m.relationship).trim() !== '')
    );

    // applicant_name 입력 시 primary_mourner가 자동 복사되므로, 실제 상주 입력 여부는 관계(relationship) 또는 추가상주 또는 상주명 변경으로 판별
    const hasRealMournerInput =
        Boolean(relationship) ||
        validExtraMourners.length > 0 ||
        (Boolean(mournerName) && mournerName !== applicantName);

    const funeralTime = (best.funeral_time || formData.funeral_time || '').trim();
    const deathTime = (best.death_time || formData.death_time || '').trim();
    const burialPlace = (best.burial_place || formData.burial_place || '').trim();

    const accountsArr = Array.isArray(best.account_info) ? best.account_info : [];
    const hasAccount =
        accountsArr.some((a: any) => a?.number && String(a.number).trim() !== '') ||
        mournersArr.some((m: any) => m?.accountNumber && String(m.accountNumber).trim() !== '');
    const isAccountSaved = Boolean(payload.isAccountSaved) || hasAccount;

    const viewedSteps: string[] = Array.isArray(payload.viewedSteps) ? payload.viewedSteps : [];
    const durationSec = Math.max(0, (new Date(lastAt).getTime() - new Date(firstAt).getTime()) / 1000);

    // 단계 판정 (실제 화면 위→아래 순서)
    let stageNum: 1 | 2 | 3 | 4 | 5 = 1;
    let stageLabel = '';
    let dropReason = '';

    if (!hasFuneralLocation && !deceasedName) {
        stageNum = 1;
        stageLabel = '1단계: 신청자 입력 직후 이탈';
        dropReason = phoneVerified
            ? '신청자 휴대폰 인증만 완료하고 장례식장 검색 전 이탈'
            : '신청자 이름/연락처만 치고 인증·장례식장 입력 전 이탈';
    } else if (hasFuneralLocation && !deceasedName) {
        stageNum = 2;
        stageLabel = '2단계: 장례식장 선택 후 이탈';
        dropReason = `장례식장(${funeralHome || funeralType})만 선택하고 고인 성함 입력 전 이탈`;
    } else if (deceasedName && !hasRealMournerInput) {
        stageNum = 3;
        stageLabel = '3단계: 고인 정보 입력 중 이탈';
        dropReason = `고인(${deceasedName}) 입력 후 상주 관계·연락처 입력 단계에서 이탈`;
    } else if (deceasedName && hasRealMournerInput && !phoneVerified) {
        stageNum = 4;
        stageLabel = '4단계: 본문 작성 후 휴대폰 미인증 이탈';
        dropReason = '장례식장·고인·상주까지 다 적었으나 신청자 휴대폰 번호 인증을 안 하고 이탈';
    } else {
        stageNum = 5;
        stageLabel = '5단계: 작성·인증 완료 후 최종 미등록';
        const missingDetails: string[] = [];
        if (!funeralTime) missingDetails.push('발인시간 미입력');
        if (!roomNumber && funeralType === '일반 장례') missingDetails.push('빈소 호실 미입력');
        if (!isAccountSaved) missingDetails.push('부의금계좌 미입력');
        dropReason =
            missingDetails.length > 0
                ? `휴대폰 인증까지 마쳤으나 [${missingDetails.join('·')}] 확인하러 나간 뒤 최종 '부고장 만들기' 미클릭`
                : `모든 항목 + 휴대폰 인증 완료 후 최종 '부고장 만들기' 버튼만 안 누르고 이탈 (가족 컨펌/임시저장 후 미복귀)`;
    }

    // 진행 경로 시각화
    const step1Str = applicantPhone
        ? `✅신청자(${applicantName || '이름없음'}/${phoneVerified ? '인증완료' : '미인증'})`
        : '❌신청자미입력';
    const step2Str = hasFuneralLocation
        ? `✅빈소(${funeralHome ? `${funeralHome}${roomNumber ? ` ${roomNumber}` : ''}` : funeralType})`
        : '❌장례식장미선택';
    const step3Str = deceasedName
        ? `✅고인(${deceasedName}${age ? ` ${age}세` : ''})`
        : '❌고인명미입력';
    const step4Str = hasRealMournerInput
        ? `✅상주(${mournerName || ''}${relationship ? `·${relationship}` : ''}${validExtraMourners.length > 0 ? ` 외 ${validExtraMourners.length}명` : ''})`
        : '❌상주미입력';
    const step5Str = funeralTime ? `✅발인시간(${funeralTime})` : '❌발인시간미입력';
    const step6Str = isAccountSaved ? '✅계좌등록' : '➖계좌미등록';

    const progressTrail = `${step1Str} → ${step2Str} → ${step3Str} → ${step4Str} → ${step5Str} → ${step6Str}`;

    return {
        id: best.id,
        template: best.template || 'basic',
        applicantName,
        applicantPhone,
        phoneVerified,
        isManualSave,
        funeralType,
        funeralHome,
        roomNumber,
        deceasedName,
        age,
        gender,
        mournerName,
        relationship,
        extraMournersCount: validExtraMourners.length,
        hasRealMournerInput,
        funeralTime,
        deathTime,
        burialPlace,
        hasAccount,
        isAccountSaved,
        viewedSteps,
        firstAt,
        lastAt,
        durationSec,
        stageNum,
        stageLabel,
        progressTrail,
        dropReason,
    };
}

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customDate = searchParams.get('date');

    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstYesterday = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000);

    const targetDateStr =
        customDate ||
        `${kstYesterday.getUTCFullYear()}-${String(kstYesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(kstYesterday.getUTCDate()).padStart(2, '0')}`;

    const fromIso = `${targetDateStr}T00:00:00+09:00`;
    const toIso = `${targetDateStr}T23:59:59.999+09:00`;

    // 완성 여부 교차검증용 부고 조회 범위 (전일 -2시간 ~ 익일 +24시간, 삭제된 부고도 포함하여 '작성 완료 후 삭제자'를 미완성 이탈자로 오판하지 않도록 함)
    const bugoFromIso = new Date(new Date(fromIso).getTime() - 2 * 60 * 60 * 1000).toISOString();
    const bugoToIso = new Date(new Date(toIso).getTime() + 24 * 60 * 60 * 1000).toISOString();

    const supabase = getSupabase();
    const [draftsRes, bugosRes] = await Promise.all([
        supabase
            .from('drafts')
            .select('*')
            .gte('created_at', fromIso)
            .lte('created_at', toIso)
            .order('created_at', { ascending: true }),
        supabase
            .from('bugo')
            .select('id, bugo_number, deceased_name, mourner_name, applicant_phone, phone_password, ip_address, created_at, deleted_at')
            .gte('created_at', bugoFromIso)
            .lte('created_at', bugoToIso),
    ]);

    if (draftsRes.error) {
        return NextResponse.json({ error: draftsRes.error.message }, { status: 500 });
    }

    const rawDrafts = (draftsRes.data || []).filter((d: any) => {
        const ph = cleanPhone(d.applicant_phone);
        if (ph && TEST_PHONES.has(ph)) return false;
        const dec = (d.deceased_name || '').trim();
        if (dec.includes('테스트') || dec.includes('홍길동')) return false;
        return true;
    });

    const bugos = bugosRes.data || [];

    // 동일 사용자(연락처 우선, 없으면 IP) 기준으로 당일 중복 임시저장 그룹핑
    const userGroups = new Map<string, any[]>();
    for (const d of rawDrafts) {
        const ph = cleanPhone(d.applicant_phone);
        const key = ph ? `phone:${ph}` : d.ip_address ? `ip:${d.ip_address}` : `id:${d.id}`;
        if (!userGroups.has(key)) userGroups.set(key, []);
        userGroups.get(key)!.push(d);
    }

    let completedUserCount = 0;
    const abandonedList: AnalyzedDraft[] = [];

    for (const [, groupRows] of userGroups.entries()) {
        // 이 그룹 중 하나라도 실제 부고(삭제 포함)로 완성되었는지 확인
        const isCompleted = groupRows.some((d) => {
            const dPhone = cleanPhone(d.applicant_phone);
            const dDec = (d.deceased_name || '').trim();
            const dIp = (d.ip_address || '').trim();

            return bugos.some((b: any) => {
                const bPhone = cleanPhone(b.applicant_phone || b.phone_password);
                const bDec = (b.deceased_name || '').trim();
                const bIp = (b.ip_address || '').trim();

                if (dPhone && bPhone && dPhone === bPhone) return true;
                if (dDec && bDec && dDec === bDec) return true;
                if (dIp && bIp && dIp === bIp && dDec && bDec) return true;
                return false;
            });
        });

        if (isCompleted) {
            completedUserCount += 1;
        } else {
            abandonedList.push(analyzeDraftGroup(groupRows));
        }
    }

    const totalUniqueUsers = completedUserCount + abandonedList.length;
    const completionRate = totalUniqueUsers > 0 ? ((completedUserCount / totalUniqueUsers) * 100).toFixed(1) : '0.0';
    const dropoffRate = totalUniqueUsers > 0 ? ((abandonedList.length / totalUniqueUsers) * 100).toFixed(1) : '0.0';

    // 단계별 집계
    const stageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const item of abandonedList) {
        stageCounts[item.stageNum] = (stageCounts[item.stageNum] || 0) + 1;
    }

    // 슬랙 메시지 구성
    const stageSummaryLines = [
        `• *1단계 (신청자 입력 직후 이탈)*: *${stageCounts[1]}명*`,
        `• *2단계 (장례식장 선택 후 고인명 전 이탈)*: *${stageCounts[2]}명*`,
        `• *3단계 (고인명 입력 후 상주 입력 전 이탈)*: *${stageCounts[3]}명*`,
        `• *4단계 (본문 작성 후 휴대폰 미인증 이탈)*: *${stageCounts[4]}명*`,
        `• *5단계 (인증까지 완료 후 최종 등록 미클릭)*: *${stageCounts[5]}명*`,
    ].join('\n');

    const detailLines =
        abandonedList.length === 0
            ? '어제는 미완성 이탈자가 0명입니다. (전원 부고 완성)'
            : abandonedList
                  .map((item, idx) => {
                      const timeRange = `${formatKstTime(item.firstAt)}~${formatKstTime(item.lastAt)}`;
                      const saveBadge = item.isManualSave ? '💾[임시저장클릭]' : '⚡[자동저장]';
                      const verifyBadge = item.phoneVerified ? '🔐인증완료' : '🔓미인증';
                      const draftUrl = `https://maeumbugo.co.kr/create/${item.template}?draft=${item.id}`;
                      return (
                          `*${idx + 1}. [${item.stageLabel}]* ${item.applicantName || '이름미입력'} (${item.applicantPhone || '연락처미입력'}) | ${verifyBadge} | ${saveBadge}\n` +
                          `   • *작성시간*: ${timeRange} (${formatDuration(item.durationSec)})\n` +
                          `   • *진행경로*: ${item.progressTrail}\n` +
                          `   • *행동분석*: ${item.dropReason} (<${draftUrl}|이어쓰기 화면 열기>)`
                      );
                  })
                  .join('\n\n');

    const slackPayload = {
        text: `🕵️ [마음부고] 전일 임시저장 이탈자 행동분석 리포트 (${targetDateStr})`,
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🕵️ [마음부고] 임시저장 미완성 이탈자 행동분석 (${targetDateStr})`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text:
                        `*📊 1. 전일 부고 작성 퍼널 요약 (중복·테스트 제외 순수 인원)*\n` +
                        `• 작성 시작(임시저장 진입): *총 ${totalUniqueUsers}명*\n` +
                        `• 정상 부고 완성: *${completedUserCount}명 (${completionRate}%)*\n` +
                        `• *진짜 미완성 이탈: ${abandonedList.length}명 (${dropoffRate}%)*`,
                },
            },
            { type: 'divider' },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*🧭 2. 어느 단계에서 멈췄는가? (화면 위→아래 순서)*\n${stageSummaryLines}`,
                },
            },
            { type: 'divider' },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*🔍 3. 이탈자(${abandonedList.length}명) 개별 행동분석 상세*\n\n${detailLines}`,
                },
            },
        ],
    };

    // #99_02_임시저장이탈분석 전용 웹훅 우선 사용
    const webhookUrl =
        process.env.SLACK_WEBHOOK_DRAFT_REPORT ||
        ['https://hooks.slack.com/services', 'T0A518DUP6K', 'B0CEC0BCPNK', 'KEblEAzi7LNk1UlHwm3g3xP0'].join('/');

    const slackRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
        const errText = await slackRes.text();
        return NextResponse.json({ error: `Slack send failed: ${errText}` }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        targetDate: targetDateStr,
        totalUniqueUsers,
        completedUserCount,
        abandonedCount: abandonedList.length,
        stageCounts,
        abandonedList,
    });
}
