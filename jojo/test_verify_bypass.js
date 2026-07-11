const axios = require('axios');

async function testVerifyBypass() {
    console.log('=== [1] 심사원 제출용 기본 번호 (01012345678) 우회 테스트 ===');
    try {
        const sendRes = await axios.post('http://localhost:3001/api/phone-verify/send', {
            phone: '01012345678'
        });
        console.log('  - 발송 요청 성공 여부:', sendRes.data.success);

        const confirmRes = await axios.post('http://localhost:3001/api/phone-verify/confirm', {
            phone: '01012345678',
            code: '123456'
        });
        console.log('  - 인증 번호 검증(123456) 성공 여부:', confirmRes.data.success);
    } catch (err) {
        console.error('  ❌ 01012345678 번호 검증 에러:', err.response ? err.response.data : err.message);
    }

    console.log('\n=== [2] 해외 심사관 번호 (+1 555-0199) 우회 테스트 ===');
    try {
        const sendRes2 = await axios.post('http://localhost:3001/api/phone-verify/send', {
            phone: '15550199'
        });
        console.log('  - 발송 요청 성공 여부:', sendRes2.data.success);

        const confirmRes2 = await axios.post('http://localhost:3001/api/phone-verify/confirm', {
            phone: '15550199',
            code: '123456'
        });
        console.log('  - 인증 번호 검증(123456) 성공 여부:', confirmRes2.data.success);
    } catch (err) {
        console.error('  ❌ 해외 번호 검증 에러:', err.response ? err.response.data : err.message);
    }
}

testVerifyBypass();
