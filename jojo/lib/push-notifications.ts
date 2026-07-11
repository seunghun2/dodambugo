/**
 * 클라이언트 사이드 푸시 알림 유틸리티
 * Capacitor PushNotifications 플러그인을 사용하여
 * FCM 토큰 등록, 알림 수신, 알림 탭 처리를 담당합니다.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * 쿠키와 로컬스토리지 양쪽에서 B2B 인증 토큰을 정석적으로 추출하는 헬퍼 함수
 * iOS WKWebView의 localStorage 초기화/유실 버그를 완벽히 우회 대응합니다.
 */
function getB2BToken(): string | null {
  // 1. 로컬스토리지 우선 확인
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('b2b_token');
    if (local) return local;
  }
  // 2. 쿠키 확인 및 파싱 (iOS 웹뷰 인증 유지 표준)
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^| )b2b_token=([^;]+)/);
    if (match) return match[2];
  }
  return null;
}

/**
 * 푸시 알림 등록
 * 권한 요청 → 등록 → FCM 토큰을 서버에 전송
 * 웹 환경에서는 자동 skip됩니다.
 */
export async function registerPushNotifications(partnerId: string): Promise<void> {
  // 네이티브 플랫폼(iOS/Android)에서만 실행
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 푸시 알림 권한 요청
    const permission = await PushNotifications.requestPermissions();
    console.log('[Push] 알림 권한 상태:', permission.receive);

    if (permission.receive !== 'granted') {
      console.warn('푸시 알림 권한이 거부되었습니다.');
      return;
    }

    // ⚠️ 중요: 리스너를 register() 보다 먼저 등록해야 함!
    // register() 호출 즉시 APNs 토큰이 반환되므로, 리스너가 없으면 이벤트를 놓침

    // FCM 토큰 수신 리스너 (가장 먼저 등록)
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Capacitor 토큰 수신 (APNs):', token.value.substring(0, 15) + '...');

      // Capacitor 플러그인은 APNs 토큰을 반환하지만, 서버는 FCM 토큰이 필요함
      // 네이티브에서 window.__fcmToken에 FCM 토큰을 주입해줄 때까지 잠시 대기
      let fcmToken = (window as any).__fcmToken;
      if (!fcmToken) {
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 100));
          fcmToken = (window as any).__fcmToken;
          if (fcmToken) break;
        }
      }

      const finalToken = fcmToken || token.value;
      console.log('[Push] 서버 전송 토큰:', fcmToken ? 'FCM' : 'APNs', finalToken.substring(0, 15) + '...');

      try {
        const b2bToken = getB2BToken();
        
        const res = await fetch('/api/b2b/push-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(b2bToken ? { Authorization: `Bearer ${b2bToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            partner_id: partnerId,
            fcm_token: finalToken,
            platform: Capacitor.getPlatform(),
          }),
        });

        if (res.ok) {
          console.log('[Push] FCM 토큰 서버 전송 완료');
        } else {
          console.error('[Push] 서버 전송 실패 - 응답코드:', res.status);
        }
      } catch (err: any) {
        console.error('[Push] 서버 전송 중 에러:', err.message);
      }
    });

    // 등록 에러 리스너
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] 푸시 알림 등록 에러:', error);
    });

    // 포그라운드에서 알림 수신 리스너
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('포그라운드 푸시 알림 수신:', notification);
    });

    // 알림 탭(클릭) 시 액션 리스너
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('푸시 알림 탭:', action);

      // data.url이 있으면 해당 URL로 이동
      const url = action.notification?.data?.url;
      if (url && typeof url === 'string') {
        window.location.href = url;
      }
    });

    // 리스너 등록 완료 후 register() 호출
    console.log('[Push] Capacitor Push API 등록 시작...');
    await PushNotifications.register();
  } catch (err) {
    console.error('푸시 알림 등록 과정 중 오류:', err);
  }
}

/**
 * 푸시 알림 등록 해제
 * 로그아웃 시 서버에서 토큰을 삭제하고 리스너를 정리합니다.
 */
export async function unregisterPushNotifications(partnerId: string): Promise<void> {
  // 네이티브 플랫폼에서만 실행
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 서버에서 토큰 삭제
    const b2bToken = getB2BToken();
    const baseUrl = '';  // 상대경로: 앱의 서버 URL과 동일한 도메인으로 요청

    await fetch(`${baseUrl}/api/b2b/push-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(b2bToken ? { Authorization: `Bearer ${b2bToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        partner_id: partnerId,
        platform: Capacitor.getPlatform(),
      }),
    });

    // 모든 리스너 해제
    await PushNotifications.removeAllListeners();
    console.log('푸시 알림 등록 해제 완료');
  } catch (err) {
    console.error('푸시 알림 등록 해제 중 오류:', err);
  }
}
