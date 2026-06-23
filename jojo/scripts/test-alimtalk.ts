/**
 * 알림톡 테스트 스크립트 (직접 호출)
 * 실행: npx tsx scripts/test-alimtalk.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import crypto from 'crypto';

const API_KEY = process.env.SOLAPI_API_KEY || '';
const API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_URL = 'https://api.solapi.com';

console.log('🔑 API_KEY:', API_KEY ? `${API_KEY.slice(0, 4)}...` : '(empty)');
console.log('🔑 API_SECRET:', API_SECRET ? `${API_SECRET.slice(0, 4)}...` : '(empty)');

const TEST_PHONE = '01064262393';

// 템플릿 ID
const TEMPLATES = {
    FLOWER_PAYMENT: 'KA01TP2601311316586435pxsJOWuWbz',   // 화환 결제완료 (주문내역확인 URL 변경)
    FLOWER_DELIVERY: 'KA01TP260127010157157MBMxvZX3qUI',  // 화환 배송완료
    CONDOLENCE_PAYMENT: 'KA01TP260127010745302rBxEDlOGd20', // 부의금 결제완료
};

function getAuthHeader() {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString('hex');
    const signature = crypto
        .createHmac('sha256', API_SECRET)
        .update(date + salt)
        .digest('hex');

    return {
        'Authorization': `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
    };
}

async function sendAlimtalk(
    to: string,
    templateId: string,
    variables: Record<string, string>
) {
    const wrappedVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
        const wrappedKey = key.startsWith('#{') ? key : `#{${key}}`;
        wrappedVariables[wrappedKey] = value;
    }

    const messageBody = {
        message: {
            to,
            from: '01048375076',
            kakaoOptions: {
                pfId: 'KA01PF260116055354175OcsXglgUTBt',
                templateId,
                variables: wrappedVariables,
            },
        },
    };

    const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(messageBody),
    });

    const data = await response.json();
    console.log('알림톡 발송 결과:', JSON.stringify(data, null, 2));
    return data;
}

async function testFlowerPayment() {
    console.log('\n📱 [1/3] 화환 결제완료 알림톡 발송...');
    try {
        await sendAlimtalk(TEST_PHONE, TEMPLATES.FLOWER_PAYMENT, {
            '상품명': '근조 3단 화환',
            '금액': '150,000',
            '주문번호': 'MG' + Date.now(),
            '받는분': '홍길동',
            '장례식장': '서울아산병원장례식장 1호실',
        });
        console.log('✅ 화환 결제완료 발송 완료!');
    } catch (err) {
        console.error('❌ 화환 결제완료 실패:', err);
    }
}

async function testFlowerDelivery() {
    console.log('\n📱 [2/3] 화환 배송완료 알림톡 발송...');
    try {
        await sendAlimtalk(TEST_PHONE, TEMPLATES.FLOWER_DELIVERY, {
            '상품명': '근조 3단 화환',
            '받는분': '홍길동',
            '장례식장': '서울아산병원장례식장 1호실',
            '주문번호': 'MG' + Date.now(),
            '고인명': '김철수',
        });
        console.log('✅ 화환 배송완료 발송 완료!');
    } catch (err) {
        console.error('❌ 화환 배송완료 실패:', err);
    }
}

async function testCondolencePayment() {
    console.log('\n📱 [3/3] 부의금 결제완료 알림톡 발송...');
    try {
        await sendAlimtalk(TEST_PHONE, TEMPLATES.CONDOLENCE_PAYMENT, {
            '고인명': '김철수',
            '받는분': '홍길동',
            '보내시는분': '이영희',
            '금액': '100,000',
        });
        console.log('✅ 부의금 결제완료 발송 완료!');
    } catch (err) {
        console.error('❌ 부의금 결제완료 실패:', err);
    }
}

async function main() {
    console.log('🚀 알림톡 테스트 시작');
    console.log(`📞 수신 번호: ${TEST_PHONE}`);
    console.log('='.repeat(50));

    await testFlowerPayment();
    await new Promise(r => setTimeout(r, 1000));

    await testFlowerDelivery();
    await new Promise(r => setTimeout(r, 1000));

    await testCondolencePayment();

    console.log('\n' + '='.repeat(50));
    console.log('✅ 모든 테스트 완료! 카카오톡 확인해주세요.');
}

main();
