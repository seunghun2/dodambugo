const fs = require('fs');
const axios = require('axios');

async function sendSlackNotification() {
    console.log('🚀 Sending Slack notification...');
    
    // .env.local 에서 웹훅 로드
    let webhookUrl = '';
    if (fs.existsSync('.env.local')) {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const match = envContent.match(/SLACK_WEBHOOK_REVIEW\s*=\s*(.*)/);
        if (match) {
            webhookUrl = match[1].trim().replace(/^"|"$/g, '');
        }
    }
    
    if (!webhookUrl) {
        console.error('❌ SLACK_WEBHOOK_REVIEW not found in .env.local');
        return;
    }

    const payload = {
        text: `📢 *[B2B 위패/지방 스킨 개선 완료]*\n\n*1. 물결(Scallop) 무늬 보정 완료*:\n- 모서리 경계까지 빈틈없이 반원 연결\n- 모든 물결이 테두리 안쪽(내향)으로 둥글게 볼록하도록 sweep-flag 보정\n- 위패 여백(padding) 조정으로 글자 겹침 방지\n\n*2. 모서리(Corner) 무늬 틈새 결합 완료*:\n- 사각형 테두리와 만나는 수평/수직 접점을 1px overlap 처리하여 흰색 공백 틈새 제거\n\n*3. Next.js 3001 포트 구동 상태*:\n- http://localhost:3001 B2B 서버 켜짐 완료`
    };

    try {
        await axios.post(webhookUrl, payload);
        console.log('✓ Slack notification sent successfully!');
    } catch (err) {
        console.error('❌ Failed to send Slack notification:', err.message);
    }
}

sendSlackNotification();
