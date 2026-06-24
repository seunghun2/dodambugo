/**
 * 부고장 표시 로직 E2E 시뮬레이션 테스트
 * 
 * 실제 BugoData 시나리오별로 B2C/B2B 화면에 무엇이 보이는지 검증합니다.
 */
import {
  shouldShowFuneralHomeBox,
  shouldShowEncoffin,
  shouldShowIlpo,
  shouldShowFuneral,
  shouldShowBurialPlace,
  shouldShowMap,
  shouldShowFlowerSection,
  getCeremonyLabel,
} from '../lib/funeral-display';

// ── 시나리오별 BugoData 정의 ─────────────────────────────────

const SCENARIOS = [
  {
    name: '무빈소장례 (8395번 부고 시나리오)',
    data: {
      funeral_type: '무빈소장례',
      funeral_home: '서울병원장례식장',
      room_number: '3호실',
      encoffin_date: '2026-06-20',
      funeral_date: '2026-06-22',
      burial_place: '서울추모공원',
      hide_funeral: false,
      hide_flower_order: false,
      ilpo_date: null,
    },
    b2c_expected: {
      빈소박스: false,
      입관: false,
      일포: false,
      발인: false,
      장지: false,
      빈소라벨: '무빈소',
      지도: false,
      화환: false,
    },
    b2b_expected: {
      빈소박스: false,
      입관: true,  // B2B는 encoffin_date 있으면 표시
      일포: false,
      발인: false,
      장지: false,
      빈소라벨: '무빈소',
      지도: false,
      화환: false,
    },
  },
  {
    name: '일반 장례 (B2C 생성, 공백 있음)',
    data: {
      funeral_type: '일반 장례',
      funeral_home: '서울아산병원장례식장',
      room_number: '특2호실',
      encoffin_date: '2026-06-19',
      funeral_date: '2026-06-21',
      burial_place: '용인공원묘원',
      hide_funeral: false,
      hide_flower_order: false,
      ilpo_date: '2026-06-20',
    },
    b2c_expected: {
      빈소박스: true,
      입관: false,  // B2C는 절대 안 보임
      일포: true,
      발인: true,
      장지: true,
      빈소라벨: null,
      지도: true,
      화환: true,
    },
    b2b_expected: {
      빈소박스: true,
      입관: true,
      일포: true,
      발인: true,
      장지: true,
      빈소라벨: null,
      지도: true,
      화환: true,
    },
  },
  {
    name: '일반장례 (B2B 생성, 공백 없음 — 이전 크리티컬 버그)',
    data: {
      funeral_type: '일반장례',  // ← B2B에서 저장한 값 (공백 없음)
      funeral_home: '강남성모병원장례식장',
      room_number: '1호실',
      encoffin_date: null,
      funeral_date: '2026-06-21',
      burial_place: '벽제승화원',
      hide_funeral: false,
      hide_flower_order: false,
      ilpo_date: null,
    },
    b2c_expected: {
      빈소박스: true,   // ← 이전에는 false (버그!)
      입관: false,
      일포: false,
      발인: true,
      장지: true,
      빈소라벨: null,
      지도: true,       // ← 이전에는 false (버그!)
      화환: true,       // ← 이전에는 false (버그!)
    },
    b2b_expected: {
      빈소박스: true,   // ← 이전에는 false (버그!)
      입관: false,      // encoffin_date가 null이므로
      일포: false,
      발인: true,
      장지: true,
      빈소라벨: null,
      지도: true,       // ← 이전에는 false (버그!)
      화환: true,       // ← 이전에는 false (버그!)
    },
  },
  {
    name: '가족장',
    data: {
      funeral_type: '가족장',
      funeral_home: '서울병원장례식장',
      room_number: '2호실',
      encoffin_date: null,
      funeral_date: '2026-06-22',
      burial_place: '서울추모공원',
      hide_funeral: false,
      hide_flower_order: false,
      ilpo_date: null,
    },
    b2c_expected: {
      빈소박스: false,
      입관: false,
      일포: false,
      발인: true,
      장지: true,
      빈소라벨: '가족장',
      지도: false,
      화환: false,
    },
    b2b_expected: {
      빈소박스: false,
      입관: false,
      일포: false,
      발인: true,
      장지: true,
      빈소라벨: '가족장',
      지도: false,
      화환: false,
    },
  },
];

// ── 검증 실행 ──────────────────────────────────────────────────

function verify(scenario: typeof SCENARIOS[0], context: 'b2c' | 'b2b') {
  const d = scenario.data;
  const expected = context === 'b2c' ? scenario.b2c_expected : scenario.b2b_expected;

  const actual = {
    빈소박스: shouldShowFuneralHomeBox({ funeralType: d.funeral_type, funeralHome: d.funeral_home }),
    입관: shouldShowEncoffin(d.encoffin_date, context),
    일포: shouldShowIlpo({ funeralType: d.funeral_type, ilpoDate: d.ilpo_date }),
    발인: shouldShowFuneral({ funeralType: d.funeral_type, funeralDate: d.funeral_date, hideFuneral: d.hide_funeral }),
    장지: shouldShowBurialPlace({ funeralType: d.funeral_type, burialPlace: d.burial_place }),
    빈소라벨: getCeremonyLabel(d.funeral_type),
    지도: shouldShowMap(d.funeral_type),
    화환: shouldShowFlowerSection({ funeralType: d.funeral_type, hideFlowerOrder: d.hide_flower_order }),
  };

  let allPassed = true;
  const results: string[] = [];
  
  for (const [key, expectedVal] of Object.entries(expected)) {
    const actualVal = actual[key as keyof typeof actual];
    const passed = actualVal === expectedVal;
    if (!passed) allPassed = false;
    results.push(`  ${passed ? '✅' : '❌'} ${key}: ${passed ? String(actualVal) : `기대=${String(expectedVal)}, 실제=${String(actualVal)}`}`);
  }

  return { allPassed, results };
}

// ── 메인 ──────────────────────────────────────────────────────

let totalPassed = 0;
let totalFailed = 0;

for (const scenario of SCENARIOS) {
  console.log(`\n📋 ${scenario.name}`);
  
  for (const ctx of ['b2c', 'b2b'] as const) {
    const { allPassed, results } = verify(scenario, ctx);
    console.log(`  [${ctx.toUpperCase()}] ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    results.forEach(r => console.log(r));
    if (allPassed) totalPassed++; else totalFailed++;
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`총 ${totalPassed + totalFailed}건 검증: ✅ ${totalPassed} PASS / ❌ ${totalFailed} FAIL`);
if (totalFailed === 0) {
  console.log('🎉 모든 시나리오 통과!');
} else {
  console.log('⚠️ 실패한 시나리오가 있습니다!');
  process.exit(1);
}
