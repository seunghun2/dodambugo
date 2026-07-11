import type { CapacitorConfig } from '@capacitor/cli';

const config: any = {
  appId: 'kr.co.maeumbugo.bugoon',
  appName: '부고온 파트너',
  webDir: 'out',
  server: {
    // 프로덕션: 서버 URL로 로드 (API routes 사용 가능)
    url: 'https://bugoon.maeumbugo.co.kr',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'MaeumbugoPartner',
    backButtonGestures: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
