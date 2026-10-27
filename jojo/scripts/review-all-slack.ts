import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_CONDOLENCE!;

const SKIP_IDS = ['park-0002']; // 이미 보낸 것들

async function sendSlack(text: string) {
    const res = await fetch(SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) console.error('슬랙 전송 실패:', res.statusText);
    return res.ok;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function reviewAndSend(data: any) {
    const id = data.id;
    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;

    const lines: string[] = [];
    lines.push(`📍 ${id} | ${data.name}`);
    lines.push(data.address || '주소 없음');

    const sp = pi?.standardizedPrices || [];

    if (sp.length === 0) {
        const pt = pi?.priceTable || {};
        const tabs = Object.keys(pt);
        if (tabs.length > 0) {
            lines.push('');
            lines.push('⏭️ V2 없음 / 레거시만 있음');
            tabs.forEach((tab: string) => {
                const rows = pt[tab]?.rows || [];
                lines.push(`[${tab}] ${rows.length}개`);
                rows.forEach((r: any) => {
                    lines.push(`• ${r.name || '(없음)'} | ${r.grade || '-'} | ${(r.price ?? 0).toLocaleString()}원`);
                });
            });
            lines.push(`\n⚠️ V2 변환 필요`);
        } else {
            lines.push('\n⏭️ 가격 데이터 없음');
        }
        await sendSlack(lines.join('\n'));
        return { issues: 0, changes: 0, noData: true };
    }

    // V2 데이터 있음
    const issues: string[] = [];
    const changes: string[] = [];

    sp.forEach((group: any) => {
        const byGroup: Record<string, any[]> = {};
        (group.rows || []).forEach((r: any, ri: number) => {
            const gt = r.groupType || '기본';
            if (!byGroup[gt]) byGroup[gt] = [];
            byGroup[gt].push({ ...r, _idx: ri });
        });

        const tabNames = Object.keys(byGroup);
        const hasTabs = tabNames.length > 1 || (tabNames.length === 1 && tabNames[0] !== '기본');

        lines.push('');
        lines.push(`[${group.serviceType}/${group.subType}] ${group.rows?.length || 0}개`);

        tabNames.forEach(gt => {
            if (hasTabs) lines.push(`  📁 ${gt}`);
            byGroup[gt].forEach(row => {
                const nm = row.name || '';
                const flags: string[] = [];

                // 자동 수정
                if (row.name && row.name !== row.name.trim()) {
                    changes.push(`name 공백: "${row.name}"`);
                    group.rows[row._idx].name = row.name.trim();
                }
                if (row.grade && row.grade !== row.grade.trim()) {
                    changes.push(`grade 공백: "${row.grade}"`);
                    group.rows[row._idx].grade = row.grade.trim();
                }
                if (row.feeType === 'USAGE' && /관리비|관리료/.test(nm)) {
                    changes.push(`"${nm}" feeType → MAINTENANCE`);
                    group.rows[row._idx].feeType = 'MAINTENANCE';
                    row.feeType = 'MAINTENANCE';
                }
                if (!row.capacity && !/관리/.test(nm)) {
                    if (/부부|합장/.test(nm)) { group.rows[row._idx].capacity = '부부'; changes.push(`"${nm}" → 부부`); }
                    else if (/가족/.test(nm)) { group.rows[row._idx].capacity = '가족'; changes.push(`"${nm}" → 가족`); }
                    else if (/개인|1인|단장/.test(nm)) { group.rows[row._idx].capacity = '개인'; changes.push(`"${nm}" → 개인`); }
                }
                const txt = `${row.name || ''} ${row.grade || ''} ${row.groupType || ''}`;
                if (!row.residency || row.residency === 'ALL') {
                    if (/관내|시민|군민|구민|주민등록|거주자/.test(txt) && !/관외|이외/.test(txt)) {
                        group.rows[row._idx].residency = 'LOCAL'; row.residency = 'LOCAL';
                        changes.push(`"${nm}" → LOCAL`);
                    } else if (/관외|이외|타지역|비거주/.test(txt) && !/관내|주민등록/.test(txt)) {
                        group.rows[row._idx].residency = 'NON_LOCAL'; row.residency = 'NON_LOCAL';
                        changes.push(`"${nm}" → NON_LOCAL`);
                    }
                }
                if (!row.duration && row.grade) {
                    const m = row.grade.match(/(\d+)\s*년/);
                    if (m && !/(안치|위|이후|이전|설치|준공)/.test(row.grade)) {
                        const d = parseInt(m[1]);
                        if (d > 0 && d <= 100) {
                            group.rows[row._idx].duration = d; group.rows[row._idx].durationType = 'YEAR';
                            changes.push(`"${nm}" duration → ${d}년`);
                        }
                    }
                    if (/영구/.test(row.grade) && !row.durationType) {
                        group.rows[row._idx].durationType = 'PERMANENT';
                        changes.push(`"${nm}" → PERMANENT`);
                    }
                }
                if (/관리비|관리료/.test(nm) && row.groupType && !/관리/.test(row.groupType)) {
                    changes.push(`"${nm}" groupType → 관리비`);
                    group.rows[row._idx].groupType = '관리비';
                }

                // 이슈
                if (row.price === 0) { flags.push('🔴0원'); issues.push(`${group.subType}/${nm}: 0원`); }
                if (!row.feeType) flags.push('🟡feeType없음');

                const prefix = hasTabs ? '    ' : '  ';
                const priceStr = (row.price ?? 0).toLocaleString();
                const flagStr = flags.length ? ` ${flags.join(' ')}` : '';
                lines.push(`${prefix}• ${nm || '(없음)'} | ${row.grade || '-'} | ${priceStr}원${flagStr}`);
            });
        });
    });

    // 이슈 요약
    if (issues.length > 0) {
        lines.push('');
        lines.push(`⚠️ 이슈 ${issues.length}건: ${issues.slice(0, 5).join(', ')}${issues.length > 5 ? '...' : ''}`);
    }

    // 수정 사항
    if (changes.length > 0) {
        lines.push(`✏️ 자동수정 ${changes.length}건: ${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''}`);
        // 실제 저장
        pi.standardizedPrices = sp;
        await sb.from('Facility').update({ pricing: pi }).eq('id', id);
    }

    const status = issues.length === 0 ? '✅' : '⚠️';
    lines.push(`\n${status} V2 ${sp.length}그룹, 이슈 ${issues.length}건, 수정 ${changes.length}건`);

    await sendSlack(lines.join('\n'));
    return { issues: issues.length, changes: changes.length, noData: false };
}

async function main() {
    // 전체 시설 가져오기
    const { data: allFacilities, error } = await sb.from('Facility').select('id, name, address, category, pricing').order('id');
    if (error || !allFacilities) {
        console.error('시설 조회 실패:', error?.message);
        return;
    }

    console.log(`총 ${allFacilities.length}개 시설 처리 시작`);

    let processed = 0;
    let issueCount = 0;
    let changeCount = 0;
    let noDataCount = 0;

    for (const facility of allFacilities) {
        if (SKIP_IDS.includes(facility.id)) {
            console.log(`⏭️ ${facility.id} (이미 전송됨)`);
            processed++;
            continue;
        }

        try {
            const result = await reviewAndSend(facility);
            issueCount += result.issues;
            changeCount += result.changes;
            if (result.noData) noDataCount++;
            processed++;
            console.log(`[${processed}/${allFacilities.length}] ${facility.id} ${facility.name} ✅`);
        } catch (e: any) {
            console.error(`[${processed}/${allFacilities.length}] ${facility.id} ❌ ${e.message}`);
            processed++;
        }

        // 슬랙 rate limit 방지 (1초 딜레이)
        await sleep(1200);
    }

    // 최종 요약도 슬랙에
    const summary = `📊 전체 리뷰 완료\n• 총 시설: ${allFacilities.length}개\n• 이슈 있음: ${issueCount}건\n• 자동수정: ${changeCount}건\n• 가격데이터 없음: ${noDataCount}개`;
    await sendSlack(summary);
    console.log(summary);
}

main();
