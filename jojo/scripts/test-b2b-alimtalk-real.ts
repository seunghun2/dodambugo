/**
 * 실제 부고 7799(백승훈)로 알림톡 링크 테스트
 * 실행: npx tsx scripts/test-b2b-alimtalk-real.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const TEST_PHONE = '01064262393';

async function main() {
    const { sendAlimtalk } = await import('../lib/solapi');
    
    console.log('🚀 실제 부고 7799로 B2B 알림톡 링크 테스트\n');

    // 1. 부고장 생성 완료 (상주용) - 버튼에 부고번호 7799가 들어감
    console.log('--- 1. 부고장 생성 완료 ---');
    try {
        const res = await sendAlimtalk(
            TEST_PHONE,
            'KA01TP2602070138097871zexjvolnSU',
            {
                '고인명': '백순자',
                '장례식장': '삼성서울병원장례식장',
                '발인일시': '2026-07-20 10:00',
                '부고번호': '7799',
            },
            undefined,
            true // isB2B
        );
        console.log('✅ 발송:', res.statusCode, res.statusMessage);
    } catch (err: any) {
        console.error('❌', err.message);
    }

    // 5. 부의금 결제 완료 (조문객용)
    console.log('\n--- 5. 부의금 결제 완료 ---');
    try {
        const res = await sendAlimtalk(
            TEST_PHONE,
            'KA01TP260213055510356BnS8IHlKvWB',
            {
                '부의금액': '50,000',
                '결제금액': '54,300',
                '상주명': '백승훈',
                '주문번호': 'CO_TEST_7799',
            },
            undefined,
            true
        );
        console.log('✅ 발송:', res.statusCode, res.statusMessage);
    } catch (err: any) {
        console.error('❌', err.message);
    }

    console.log('\n📱 카카오톡에서 버튼 URL 확인!');
}

main();
