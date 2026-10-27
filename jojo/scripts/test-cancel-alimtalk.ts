/**
 * 취소 알림톡 테스트 스크립트
 * 실행: npx tsx scripts/test-cancel-alimtalk.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import crypto from 'crypto';

const API_KEY = process.env.SOLAPI_API_KEY || '';
const API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_URL = 'https://api.solapi.com';

const TEST_PHONE = '01064262393';

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

async function main() {
    console.log('📱 취소 알림톡 테스트 발송...');
    console.log(`📞 수신 번호: ${TEST_PHONE}`);
    console.log('='.repeat(50));

    await sendAlimtalk(TEST_PHONE, 'KA01TP260128002330965AMneEQhHRIM', {
        '부고장번호': 'TEST-001',
        '주문번호': 'MG' + Date.now(),
        '상품명': '근조3단 특대',
        '배송지': '제주특별자치도 제주시 연북로 378 (도남동)',
        '주문자': '이재황(01057179493)',
        '결제수단': '신용카드',
    });

    console.log('✅ 완료! 카카오톡 확인해주세요.');
}

main();
