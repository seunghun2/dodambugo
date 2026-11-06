import type { CapacitorConfig } from '@capacitor/cli';

const config: any = {
  appId: 'kr.co.maeumbugo.bugoon',
  appName: '부고온플러스',
  webDir: 'out',
  server: {
    // 프로덕션: 서버 URL로 로드 (API routes 사용 가능) 및 오프라인 폴백 연결
    url: 'https://bugoon.maeumbugo.co.kr',
    errorPath: 'index.html',
    cleartext: false,
    allowNavigation: [
      'bugoon.maeumbugo.co.kr',
      '*.maeumbugo.co.kr',
      '*.innopay.co.kr',
      '*.kakao.com',
    ],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'MaeumbugoPartner',
    allowsBackForwardNavigationGestures: true,
    backgroundColor: '#ffffff',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
