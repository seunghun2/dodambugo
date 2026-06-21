import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.co.bugoapp.partner',
  appName: '부고온 파트너',
  webDir: 'out',
  server: {
    // 프로덕션: 서버 URL로 로드 (API routes 사용 가능)
    url: 'https://maeumbugo.co.kr/b2b',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'MaeumbugoPartner',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
