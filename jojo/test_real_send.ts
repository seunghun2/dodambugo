import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendPartnerNotification } from './lib/partner-notification';

async function testRealNotification() {
    const partnerId = '552650f0-3243-4e46-97ec-d2e7ff5de2e2'; // 백승훈 파트너 ID
    
    console.log('🚀 백승훈 파트너에게 실제 [조의금/화환 수당 적립] 자동 알림 발송 로직 실행...');
    
    // 실제 결제 완료 시 호출되는 알림 함수 그대로 실행
    // 템플릿: condolence_earned ('[부고온] 조의금 수당 적립')
    await sendPartnerNotification(
        partnerId,
        'condolence_earned',
        {
            '파트너명': '백승훈',
            '조문객명': '김철수',
            '고인명': '가상_백승훈고인',
            '수당금액': '10,000'
        },
        { url: '/b2b/wallet' } // 클릭 시 지갑/예치금 화면으로 이동
    );

    console.log('✅ 발송 로직 실행 완료.');
}

testRealNotification();
