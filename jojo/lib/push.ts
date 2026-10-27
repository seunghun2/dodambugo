import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * FCM 푸시 알림 초기화
 * - 권한 요청 → 토큰 발급 → 서버 등록
 * - 알림 수신/탭 핸들링
 */
export async function initPushNotifications(partnerId?: string) {
    // 네이티브 앱에서만 동작
    if (!Capacitor.isNativePlatform()) {
        console.log('[Push] 웹 환경 — 푸시 비활성');
        return;
    }

    try {
        // 1. 권한 요청
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
            console.log('[Push] 권한 거부됨');
            return;
        }

        // 2. 푸시 등록
        await PushNotifications.register();

        // 3. 토큰 수신 → 서버에 저장
        PushNotifications.addListener('registration', async (token) => {
            console.log('[Push] FCM 토큰:', token.value);

            // 서버에 토큰 저장
            if (partnerId) {
                try {
                    await fetch('/api/b2b/push-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            partner_id: partnerId,
                            fcm_token: token.value,
                            platform: Capacitor.getPlatform(), // 'ios' | 'android'
                        }),
                    });
                    console.log('[Push] 토큰 서버 저장 완료');
                } catch (err) {
                    console.error('[Push] 토큰 저장 실패:', err);
                }
            }
        });

        // 4. 등록 에러
        PushNotifications.addListener('registrationError', (error) => {
            console.error('[Push] 등록 에러:', error);
        });

        // 5. 포그라운드 알림 수신
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[Push] 알림 수신:', notification);
            // 포그라운드에서는 인앱 알림 표시 가능
        });

        // 6. 알림 탭 (백그라운드 → 앱 열기)
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('[Push] 알림 탭:', action);
            const data = action.notification.data;

            // 딥링크 처리
            if (data?.url) {
                window.location.href = data.url;
            } else if (data?.type === 'order') {
                window.location.href = '/b2b/wallet';
            } else if (data?.type === 'settlement') {
                window.location.href = '/b2b/wallet';
            }
        });

        console.log('[Push] 초기화 완료');
    } catch (err) {
        console.error('[Push] 초기화 실패:', err);
    }
}

/**
 * 푸시 토큰 제거 (로그아웃 시)
 */
export async function removePushToken(partnerId: string) {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await fetch('/api/b2b/push-token', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partner_id: partnerId }),
        });
        await PushNotifications.removeAllListeners();
        console.log('[Push] 토큰 제거 완료');
    } catch (err) {
        console.error('[Push] 토큰 제거 실패:', err);
    }
}
