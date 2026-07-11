const axios = require('axios');

async function testAPIs() {
    console.log('=== [1] 어드민 알림 템플릿 API 검증 ===');
    try {
        const adminRes = await axios.get('http://localhost:3001/api/b2b/admin/notification-templates', {
            headers: {
                Cookie: 'admin_ip=true'
            }
        });
        console.log('성공 여부:', adminRes.data.success);
        console.log('가져온 템플릿 개수:', adminRes.data.templates ? adminRes.data.templates.length : 0, '개');
        if (adminRes.data.templates) {
            adminRes.data.templates.forEach((t, i) => {
                console.log(`  [${i+1}] Event: ${t.event_type} | Title: ${t.title}`);
            });
        }
    } catch (err) {
        console.error('어드민 API 호출 실패:', err.response ? err.response.data : err.message);
    }

    console.log('\n=== [2] 파트너 알림함 API 검증 ===');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTI2NTBmMC0zMjQzLTRlNDYtOTdlYy1kMmU3ZmY1ZGUyZTIiLCJpYXQiOjE3ODM3NzIyMjh9.7xiMyLV4ZJKVPbOW5cR3y073-otVb0JUl3Ih2OOlL-s';
    try {
        const partnerRes = await axios.get('http://localhost:3001/api/b2b/notifications', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('성공 여부:', partnerRes.data.success);
        console.log('가져온 알림 개수:', partnerRes.data.notifications ? partnerRes.data.notifications.length : 0, '개');
        if (partnerRes.data.notifications) {
            partnerRes.data.notifications.forEach((n, i) => {
                console.log(`  [${i+1}] Title: ${n.title} | Body: ${n.body} | Type: ${n.type}`);
            });
        }
    } catch (err) {
        console.error('파트너 알림 API 호출 실패:', err.response ? err.response.data : err.message);
    }
}

testAPIs();
