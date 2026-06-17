import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const TARGET_ID = process.argv[2] || 'park-0001';

async function reviewOne(id: string) {
    const { data, error } = await sb.from('Facility').select('*').eq('id', id).single();
    if (error || !data) { console.log(`❌ ${id}: ${error?.message || 'not found'}`); return; }

    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📍 ${data.name} (${id}) | ${data.category} | ${data.address}`);
    console.log(`${'='.repeat(70)}`);

    // 1. V2 데이터 확인
    const sp = pi?.standardizedPrices || [];
    if (sp.length === 0) {
        console.log(`⏭️ V2 데이터 없음`);
        // 레거시 확인
        const pt = pi?.priceTable || {};
        const tabs = Object.keys(pt);
        if (tabs.length > 0) {
            console.log(`📋 레거시 데이터 있음 (${tabs.join(', ')})`);
            tabs.forEach((tab: string) => {
                const rows = pt[tab]?.rows || [];
                console.log(`  [${tab}] ${rows.length}건`);
                rows.forEach((r: any) => {
                    console.log(`    ${r.name || '(없음)'} | ${r.grade || '-'} | ${(r.price ?? 0).toLocaleString()}원`);
                });
            });
        } else {
            console.log(`⏭️ 레거시도 없음 → 패스`);
        }
        return;
    }

    // V2 상세 출력
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

        console.log(`\n  📦 ${group.serviceType} / ${group.subType} (${group.rows?.length || 0}개)`);

        tabNames.forEach(gt => {
            if (hasTabs) console.log(`    📁 ${gt} (${byGroup[gt].length}개)`);
            byGroup[gt].forEach(row => {
                const flags: string[] = [];
                const nm = row.name || '';

                // === 자동 수정 ===
                // 1. 공백
                if (row.name && row.name !== row.name.trim()) {
                    changes.push(`[${group.subType}] name 공백: "${row.name}" → "${row.name.trim()}"`);
                    group.rows[row._idx].name = row.name.trim();
                }
                if (row.grade && row.grade !== row.grade.trim()) {
                    changes.push(`[${group.subType}] grade 공백: "${row.grade}" → "${row.grade.trim()}"`);
                    group.rows[row._idx].grade = row.grade.trim();
                }

                // 2. 관리비 feeType
                if (row.feeType === 'USAGE' && /관리비|관리료/.test(nm)) {
                    changes.push(`[${group.subType}] "${nm}" feeType → MAINTENANCE`);
                    group.rows[row._idx].feeType = 'MAINTENANCE';
                    row.feeType = 'MAINTENANCE';
                }

                // 3. capacity
                if (!row.capacity && !/관리/.test(nm)) {
                    if (/부부|합장/.test(nm)) { group.rows[row._idx].capacity = '부부'; changes.push(`[${group.subType}] "${nm}" → 부부`); }
                    else if (/가족/.test(nm)) { group.rows[row._idx].capacity = '가족'; changes.push(`[${group.subType}] "${nm}" → 가족`); }
                    else if (/개인|1인|단장/.test(nm)) { group.rows[row._idx].capacity = '개인'; changes.push(`[${group.subType}] "${nm}" → 개인`); }
                }

                // 4. residency
                const txt = `${row.name || ''} ${row.grade || ''} ${row.groupType || ''}`;
                if (!row.residency || row.residency === 'ALL') {
                    if (/관내|시민|군민|구민|주민등록|거주자/.test(txt) && !/관외|이외/.test(txt)) {
                        group.rows[row._idx].residency = 'LOCAL'; row.residency = 'LOCAL';
                        changes.push(`[${group.subType}] "${nm}" (${row.groupType || '-'}) → LOCAL`);
                    } else if (/관외|이외|타지역|비거주/.test(txt) && !/관내|주민등록/.test(txt)) {
                        group.rows[row._idx].residency = 'NON_LOCAL'; row.residency = 'NON_LOCAL';
                        changes.push(`[${group.subType}] "${nm}" (${row.groupType || '-'}) → NON_LOCAL`);
                    }
                }

                // 5. duration
                if (!row.duration && row.grade) {
                    const m = row.grade.match(/(\d+)\s*년/);
                    if (m && !/(안치|위|이후|이전|설치|준공)/.test(row.grade)) {
                        const d = parseInt(m[1]);
                        if (d > 0 && d <= 100) {
                            group.rows[row._idx].duration = d; group.rows[row._idx].durationType = 'YEAR';
                            changes.push(`[${group.subType}] "${nm}" duration → ${d}년`);
                        }
                    }
                    if (/영구/.test(row.grade) && !row.durationType) {
                        group.rows[row._idx].durationType = 'PERMANENT';
                        changes.push(`[${group.subType}] "${nm}" → PERMANENT`);
                    }
                }

                // 6. 관리비 groupType
                if (/관리비|관리료/.test(nm) && row.groupType && !/관리/.test(row.groupType)) {
                    changes.push(`[${group.subType}] "${nm}" groupType: "${row.groupType}" → "관리비"`);
                    group.rows[row._idx].groupType = '관리비';
                }

                // 7. capacity 비표준 값 수정
                if (row.capacity === 'COUPLE') {
                    changes.push(`[${group.subType}] "${nm}" capacity: COUPLE → 부부`);
                    group.rows[row._idx].capacity = '부부';
                    row.capacity = '부부';
                }
                if (row.capacity === 'INDIVIDUAL') {
                    changes.push(`[${group.subType}] "${nm}" capacity: INDIVIDUAL → 개인`);
                    group.rows[row._idx].capacity = '개인';
                    row.capacity = '개인';
                }
                if (row.capacity === 'FAMILY') {
                    changes.push(`[${group.subType}] "${nm}" capacity: FAMILY → 가족`);
                    group.rows[row._idx].capacity = '가족';
                    row.capacity = '가족';
                }

                // 8. residency 비표준 값 수정
                if (row.residency === 'RESIDENT') {
                    changes.push(`[${group.subType}] "${nm}" residency: RESIDENT → LOCAL`);
                    group.rows[row._idx].residency = 'LOCAL';
                    row.residency = 'LOCAL';
                }
                if (row.residency === 'NON_RESIDENT') {
                    changes.push(`[${group.subType}] "${nm}" residency: NON_RESIDENT → NON_LOCAL`);
                    group.rows[row._idx].residency = 'NON_LOCAL';
                    row.residency = 'NON_LOCAL';
                }

                // === 이슈 체크 ===
                if (row.price === 0) { flags.push('🔴 0원'); issues.push(`${group.subType}/${nm}: 0원`); }
                if (!row.feeType) flags.push('🟡 feeType없음');

                // 설명 품질 체크
                if (row.grade && row.grade.length > 40) {
                    flags.push('🟠 grade길다');
                    issues.push(`${group.subType}/${nm}: grade가 너무 김 "${row.grade.slice(0, 30)}..."`);
                }
                // name+grade 중복은 그룹 단위에서 체크 (아래에서)

                const prefix = hasTabs ? '      ' : '    ';
                const priceStr = (row.price ?? 0).toLocaleString();
                const flagStr = flags.length ? ` ${flags.join(' ')}` : '';
                console.log(`${prefix}${nm || '(없음)'} | ${row.grade || '-'} | ${priceStr}원 | ${row.feeType || '-'} | 거주:${row.residency || '-'} | 인원:${row.capacity || '-'}${flagStr}`);
            });
        });
    });

    // 면적 단위 통일 체크 (전체 시설 기준)
    let hasM2 = false, hasPyeong = false;
    sp.forEach((group: any) => {
        (group.rows || []).forEach((r: any) => {
            const all = `${r.name || ''} ${r.grade || ''} ${r.groupType || ''}`;
            if (/m2|㎡|m²/.test(all)) hasM2 = true;
            if (/평/.test(all) && !/평장/.test(all)) hasPyeong = true;
        });
    });
    if (hasM2 && hasPyeong) {
        issues.push('면적단위 혼용: m2와 평이 함께 사용됨');
    } else if (hasM2) {
        issues.push('면적단위: m2 사용 (평으로 통일 검토)');
    }

    // 레거시 비교 (이슈 있으면)
    if (issues.length > 0) {
        console.log(`\n  ⚠️ 이슈 ${issues.length}건:`);
        issues.forEach(i => console.log(`    ${i}`));

        const pt = pi?.priceTable || {};
        const tabs = Object.keys(pt);
        if (tabs.length > 0) {
            console.log(`\n  📋 레거시 데이터 비교:`);
            tabs.forEach((tab: string) => {
                const rows = pt[tab]?.rows || [];
                if (rows.length === 0) return;
                console.log(`    [${tab}]`);
                rows.forEach((r: any) => {
                    const priceStr = (r.price ?? 0).toLocaleString();
                    console.log(`      ${r.name || '(없음)'} | ${r.grade || '-'} | ${priceStr}원 | gt:${r.groupType || '-'}`);
                });
            });
        }
    }

    // 저장
    if (changes.length > 0) {
        console.log(`\n  ✏️ ${changes.length}건 자동 수정:`);
        changes.forEach(c => console.log(`    ${c}`));

        pi.standardizedPrices = sp;
        const { error: ue } = await sb.from('Facility').update({ pricing: pi }).eq('id', id);
        console.log(ue ? `  ❌ 저장 실패: ${ue.message}` : `  ✅ 저장 완료`);
    } else {
        console.log(`\n  ✅ 수정사항 없음`);
    }

    // 최종 요약
    console.log(`\n📊 요약: V2 그룹 ${sp.length}개, 이슈 ${issues.length}건, 수정 ${changes.length}건`);
    if (issues.length === 0) console.log(`✅ ${id} 완료 - 문제 없음`);
    else console.log(`⚠️ ${id} 완료 - 이슈 ${issues.length}건 확인 필요`);
}

reviewOne(TARGET_ID);
