/**
 * 서버 사이드 FCM 푸시 알림 유틸리티
 * Firebase Admin SDK v14 (모듈화 API)를 사용하여 푸시 알림을 발송합니다.
 */
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (서버 사이드 - service role key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Firebase Admin SDK 초기화
 * 이미 초기화되어 있으면 skip합니다.
 * 환경변수 FIREBASE_SERVICE_ACCOUNT_KEY에 JSON 문자열로 서비스 계정 키를 설정해야 합니다.
 */
function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.');
  }

  // ⚠️ Base64 인코딩 탐지 및 디코딩 처리
  // JSON은 항상 '{' 문자로 시작하므로, 그렇지 않다면 base64로 디코딩을 시도합니다.
  const trimmedKey = serviceAccountKey.trim();
  if (!trimmedKey.startsWith('{')) {
    try {
      console.log('[FCM Admin] Base64로 인코딩된 Firebase 키 탐지됨. 디코딩을 수행합니다.');
      serviceAccountKey = Buffer.from(trimmedKey, 'base64').toString('utf8');
    } catch (e: any) {
      console.error('[FCM Admin] Base64 디코딩 실패:', e.message);
    }
  }

  // Vercel 환경 변수 등록 시 생기는 줄바꿈 이스케이프 이중 변환 처리
  let formattedKey = serviceAccountKey.replace(/\\n/g, '\n');

  // JSON 내부에 진짜 개행(0x0A) 제어 문자가 있어서 JSON.parse가 터지는 현상 방지
  // private_key 내부의 진짜 LF 개행을 이스케이프된 \\n 텍스트로 치환합니다.
  try {
    JSON.parse(formattedKey);
  } catch (err) {
    formattedKey = formattedKey.replace(/"private_key"\s*:\s*"([^"]+)"/g, (match, p1) => {
      const escapedPrivateKey = p1.replace(/\n/g, '\\n');
      return `"private_key": "${escapedPrivateKey}"`;
    });
  }

  const serviceAccount: ServiceAccount = JSON.parse(formattedKey);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

/** 발송 결과 타입 */
interface SendResult {
  success: number;
  failed: number;
  errorDetails?: string[];
}

/**
 * 특정 파트너에게 푸시 알림 발송
 * Supabase에서 파트너의 FCM 토큰을 조회하고 각 토큰에 알림을 전송합니다.
 * 만료되거나 유효하지 않은 토큰은 자동으로 삭제합니다.
 */
// Google OAuth 토큰 및 FCM REST API를 이용해 직접 발송하는 헬퍼 함수
async function getFcmAccessToken(serviceAccount: any): Promise<string> {
  const jwt = require('jsonwebtoken');
  const jwtClaim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  const signedJwt = jwt.sign(jwtClaim, serviceAccount.private_key, { algorithm: 'RS256' });

  const res = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth token exchange failed: ${res.status} - ${errText}`);
  }

  const oauthData = await res.json();
  return oauthData.access_token;
}

/**
 * 특정 파트너에게 푸시 알림 발송
 * Supabase에서 파트너의 FCM 토큰을 조회하고 각 토큰에 알림을 전송합니다.
 * 만료되거나 유효하지 않은 토큰은 자동으로 삭제합니다.
 */
export async function sendPushToPartner(
  partnerId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<SendResult> {
  // 1. 서비스 계정 키 환경변수 파싱
  let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.');
    return { success: 0, failed: 0, errorDetails: ['FIREBASE_SERVICE_ACCOUNT_KEY missing'] };
  }

  // Base64 디코딩
  const trimmedKey = serviceAccountKey.trim();
  if (!trimmedKey.startsWith('{')) {
    try {
      serviceAccountKey = Buffer.from(trimmedKey, 'base64').toString('utf8');
    } catch (e: any) {
      console.error('Base64 디코딩 실패:', e.message);
      return { success: 0, failed: 0, errorDetails: [`Base64 decode failed: ${e.message}`] };
    }
  }

  // 줄바꿈 이스케이프 이중 변환 처리
  let formattedKey = serviceAccountKey.replace(/\\n/g, '\n');
  try {
    JSON.parse(formattedKey);
  } catch (err) {
    formattedKey = formattedKey.replace(/"private_key"\s*:\s*"([^"]+)"/g, (match, p1) => {
      const escapedPrivateKey = p1.replace(/\n/g, '\\n');
      return `"private_key": "${escapedPrivateKey}"`;
    });
  }

  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(formattedKey);
  } catch (err: any) {
    console.error('서비스 계정 키 JSON 파싱 실패:', err.message);
    return { success: 0, failed: 0, errorDetails: [`JSON parse failed: ${err.message}`] };
  }

  // 2. 파트너의 FCM 토큰 조회
  const { data: tokens, error } = await supabase
    .from('b2b_push_tokens')
    .select('id, fcm_token')
    .eq('partner_id', partnerId);

  if (error) {
    console.error('FCM 토큰 조회 실패:', error);
    return { success: 0, failed: 0, errorDetails: [`Supabase select failed: ${error.message}`] };
  }

  if (!tokens || tokens.length === 0) {
    console.warn(`파트너 ${partnerId}에 등록된 FCM 토큰이 없습니다.`);
    return { success: 0, failed: 0 };
  }

  // 3. 구글 OAuth Access Token 획득
  let accessToken: string;
  try {
    accessToken = await getFcmAccessToken(serviceAccount);
  } catch (err: any) {
    console.error('FCM Access Token 획득 실패:', err.message);
    return { success: 0, failed: tokens.length, errorDetails: [`OAuth failed: ${err.message}`] };
  }

  let success = 0;
  let failed = 0;
  const expiredTokenIds: string[] = [];
  const errorDetails: string[] = [];

  // 4. 각 토큰에 REST API 호출로 알림 발송
  await Promise.all(
    tokens.map(async (tokenRecord) => {
      try {
        const payload = {
          message: {
            token: tokenRecord.fcm_token,
            notification: { title, body },
            data: data || {},
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
            android: {
              notification: {
                sound: 'default',
                channelId: 'default',
              },
            },
          }
        };

        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resText = await res.text();
        if (res.ok) {
          success++;
        } else {
          console.error(`FCM 발송 실패 (토큰 ID: ${tokenRecord.id}): Status ${res.status} - ${resText}`);
          let parsedErr: any;
          try {
            parsedErr = JSON.parse(resText);
          } catch {}
          
          const status = parsedErr?.error?.status || '';
          const message = parsedErr?.error?.message || resText;
          errorDetails.push(`[${status}] ${message}`);
          failed++;

          // 만료되었거나 유효하지 않은 토큰 감지
          if (
            status === 'UNREGISTERED' ||
            status === 'INVALID_ARGUMENT' ||
            message.includes('registration-token-not-registered') ||
            message.includes('invalid-registration-token')
          ) {
            expiredTokenIds.push(tokenRecord.id);
          }
        }
      } catch (err: any) {
        const errorMsg = err?.message || JSON.stringify(err);
        console.error(`FCM 발송 예외 발생 (토큰 ID: ${tokenRecord.id}): ${errorMsg}`);
        errorDetails.push(`[Exception] ${errorMsg}`);
        failed++;
      }
    })
  );

  // 5. 만료된 토큰 삭제
  if (expiredTokenIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('b2b_push_tokens')
      .delete()
      .in('id', expiredTokenIds);

    if (deleteError) {
      console.error('만료된 토큰 삭제 실패:', deleteError);
    } else {
      console.log(`만료된 토큰 ${expiredTokenIds.length}개 삭제 완료`);
    }
  }

  return { success, failed, ...(errorDetails.length > 0 ? { errorDetails } : {}) };
}

/**
 * 복수 파트너에게 푸시 알림 발송
 * Promise.allSettled를 사용하여 일부 실패해도 나머지는 정상 발송됩니다.
 */
export async function sendPushToMultiple(
  partnerIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<SendResult> {
  const results = await Promise.allSettled(
    partnerIds.map((id) => sendPushToPartner(id, title, body, data))
  );

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalSuccess += result.value.success;
      totalFailed += result.value.failed;
    } else {
      // Promise 자체가 reject된 경우
      console.error('파트너 푸시 발송 실패:', result.reason);
      totalFailed++;
    }
  }

  return { success: totalSuccess, failed: totalFailed };
}
