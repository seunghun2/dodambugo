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

    if (permission.receive !== 'granted') {
      console.warn('푸시 알림 권한이 거부되었습니다.');
      return;
    }

    // 푸시 알림 등록
    await PushNotifications.register();

    // FCM FCM 토큰 수신 리스너
    await PushNotifications.addListener('registration', async (token) => {
      console.log('FCM 토큰 수신:', token.value);

      try {
        const b2bToken = getB2BToken();
        const baseUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') && !Capacitor.isNativePlatform()
          ? '' 
          : 'https://maeumbugo.vercel.app';
        
        const res = await fetch(`${baseUrl}/api/b2b/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(b2bToken ? { Authorization: `Bearer ${b2bToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            partner_id: partnerId,
            fcm_token: token.value,
            platform: Capacitor.getPlatform(),
          }),
        });

        if (!res.ok) {
          console.error('FCM 토큰 서버 전송 실패:', res.status);
        }
      } catch (err) {
        console.error('FCM 토큰 서버 전송 중 오류:', err);
      }
    });

    // 등록 에러 리스너
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('푸시 알림 등록 에러:', error);
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
    const baseUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') && !Capacitor.isNativePlatform()
      ? '' 
      : 'https://maeumbugo.vercel.app';

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
