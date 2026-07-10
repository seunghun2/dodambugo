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

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.');
  }

  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

/** 발송 결과 타입 */
interface SendResult {
  success: number;
  failed: number;
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
  // Firebase Admin 초기화
  initFirebaseAdmin();

  // 파트너의 FCM 토큰 조회
  const { data: tokens, error } = await supabase
    .from('b2b_push_tokens')
    .select('id, fcm_token')
    .eq('partner_id', partnerId);

  if (error) {
    console.error('FCM 토큰 조회 실패:', error);
    return { success: 0, failed: 0 };
  }

  if (!tokens || tokens.length === 0) {
    console.warn(`파트너 ${partnerId}에 등록된 FCM 토큰이 없습니다.`);
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;
  const expiredTokenIds: string[] = [];

  // FCM 메시징 인스턴스
  const messaging = getMessaging();

  // 각 토큰에 알림 발송
  for (const tokenRecord of tokens) {
    try {
      await messaging.send({
        token: tokenRecord.fcm_token,
        notification: { title, body },
        data: data || {},
        // iOS에서 알림음 및 배지 설정
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        // Android 알림 채널 설정
        android: {
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
      });
      success++;
    } catch (err: any) {
      console.error(`FCM 발송 실패 (토큰 ID: ${tokenRecord.id}):`, err?.message);
      failed++;

      // 만료되거나 유효하지 않은 토큰은 삭제 대상에 추가
      const errorCode = err?.code || err?.errorInfo?.code || '';
      if (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/invalid-argument'
      ) {
        expiredTokenIds.push(tokenRecord.id);
      }
    }
  }

  // 만료된 토큰 삭제
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

  return { success, failed };
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
