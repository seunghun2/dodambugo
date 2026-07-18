/**
 * GET /api/test-push
 * 테스트용 푸시 발송 API (임시 — 테스트 후 삭제)
 * RLS 우회하여 직접 FCM 토큰으로 발송
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    const partnerId = '552650f0-3243-4e46-97ec-d2e7ff5de2e2';
    const fcmToken = 'dohXCm_Km0kjlUSJBXZYVT:APA91bFPd2s8YScITz_Z45dA_EdN33apGHbnkOkmwrW2IRbdAbUjTo1XpjFHpjHfFOLsWkFaO5EvbtLSH8Y90k_TUg3JndYjn_otEpSOMPSkJjWAsvwwsFk';
    
    try {
        // 서비스 계정 키 파싱
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!key) return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY 없음' }, { status: 500 });
        key = key.trim();
        if (!key.startsWith('{')) key = Buffer.from(key, 'base64').toString('utf8');
        let formatted = key.replace(/\\n/g, '\n');
        try { JSON.parse(formatted); } catch { formatted = key; }
        const sa = JSON.parse(formatted);

        // Google OAuth 토큰 발급
        const jwt = require('jsonwebtoken');
        const jwtClaim = {
            iss: sa.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: sa.token_uri,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
        };
        const signedJwt = jwt.sign(jwtClaim, sa.private_key, { algorithm: 'RS256' });

        const oauthRes = await fetch(sa.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: signedJwt,
            }),
        });
        if (!oauthRes.ok) {
            const errText = await oauthRes.text();
            return NextResponse.json({ error: 'OAuth 실패', detail: errText }, { status: 500 });
        }
        const { access_token } = await oauthRes.json();

        // FCM 직접 발송
        const fcmRes = await fetch(
            `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    message: {
                        token: fcmToken,
                        notification: {
                            title: '🎉 부고온 푸시 테스트',
                            body: '백승훈 사장님, 실시간 푸시 알림이 정상 작동합니다!',
                        },
                        data: { url: '/b2b/dashboard', type: 'notice' },
                        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                    },
                }),
            }
        );

        const fcmResult = await fcmRes.json();
        return NextResponse.json({
            success: fcmRes.ok,
            status: fcmRes.status,
            fcm_result: fcmResult,
            project_id: sa.project_id,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
