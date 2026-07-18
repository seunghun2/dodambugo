/**
 * GET /api/test-push
 * 8개 알림 타입 전수 테스트 — 직접 FCM REST API 방식 (임시)
 */
import { NextResponse } from 'next/server';

async function getAccessToken() {
    const jwt = require('jsonwebtoken');
    let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!;
    key = key.trim();
    if (!key.startsWith('{')) key = Buffer.from(key, 'base64').toString('utf8');
    let formatted = key.replace(/\\n/g, '\n');
    try { JSON.parse(formatted); } catch { formatted = key; }
    const sa = JSON.parse(formatted);

    const jwtClaim = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: sa.token_uri,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
    };
    const signedJwt = jwt.sign(jwtClaim, sa.private_key, { algorithm: 'RS256' });
    const res = await fetch(sa.token_uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedJwt }),
    });
    const { access_token } = await res.json();
    return { access_token, project_id: sa.project_id };
}

const FCM_TOKEN = 'dohXCm_Km0kjlUSJBXZYVT:APA91bFPd2s8YScITz_Z45dA_EdN33apGHbnkOkmwrW2IRbdAbUjTo1XpjFHpjHfFOLsWkFaO5EvbtLSH8Y90k_TUg3JndYjn_otEpSOMPSkJjWAsvwwsFk';

const notifications = [
    { title: '[부고온] 신규 공지사항', body: '부고온 v1.1 업데이트가 적용되었습니다.' },
    { title: '[부고온] 신규 부고 등록 알림', body: '故 홍길동님 부고가 삼성서울병원장례식장에 등록되었습니다.' },
    { title: '[부고온] 화환 배송 완료', body: '김철수님이 주문하신 근조3단화환이 삼성서울병원장례식장 특3호실에 배송 완료되었습니다.' },
    { title: '[부고온] 정산 완료 안내', body: '2026.07.01 ~ 07.15 기간 정산금 150,000원이 입금 처리되었습니다.' },
    { title: '[부고온] 조의금 수당 적립', body: '이영희님이 故 홍길동님께 100,000원 조의금을 보내셨습니다. 수당 5,000원 적립!' },
    { title: '[부고온] 발인 임박 안내', body: '故 홍길동님 발인이 3시간 뒤 삼성서울병원장례식장에서 예정되어 있습니다.' },
    { title: '[부고온] 파트너 가입 승인', body: '부고온 파트너 상조 가입이 승인되었습니다. 환영합니다!' },
    { title: '[부고온] 추천인 파트너 가입', body: '백승훈님이 추천한 서울장례상조 파트너가 가입했습니다.' },
];

export async function GET() {
    const { access_token, project_id } = await getAccessToken();
    const results: any[] = [];

    for (const n of notifications) {
        try {
            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
                body: JSON.stringify({
                    message: {
                        token: FCM_TOKEN,
                        notification: { title: n.title, body: n.body },
                        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                    },
                }),
            });
            const data = await res.json();
            results.push({ title: n.title, ok: res.ok, data });
            // 3초 딜레이
            await new Promise(r => setTimeout(r, 3000));
        } catch (err: any) {
            results.push({ title: n.title, error: err.message });
        }
    }

    return NextResponse.json({ total: results.length, results });
}
