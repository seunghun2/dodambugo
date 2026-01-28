// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { dodamTheme } from '@/lib/theme';
import MainLayout from '@/components/MainLayout';
import KakaoInit from '@/components/KakaoInit';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata = {
  title: '마음부고 - 무료 모바일 부고장, 모바일부고, 부고문자, 부고, 부고장, 카카오톡 공유',
  description: '3분 만에 만드는 품격있는 무료 모바일 부고장. 4가지 세련된 템플릿, 완전 무료, 광고 없음, 카카오톡 공유',
  keywords: '마음부고, 부고장, 모바일 부고장, 모바일부고, 부고문자, 부고, 무료 부고장, 온라인 부고, 카카오톡 공유, 장례식장, 조문, 화환, 근조화환',
  authors: [{ name: '마음부고' }],
  creator: '마음부고',
  publisher: '마음부고',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: '마음부고 - 품격있는 무료 모바일 부고장',
    description: '3분 만에 만드는 품격있는 무료 모바일 부고장. 완전 무료, 광고 없음.',
    type: 'website',
    url: 'https://maeumbugo.co.kr',
    siteName: '마음부고',
    locale: 'ko_KR',
    images: [
      {
        url: 'https://maeumbugo.co.kr/og-maeumbugo.png',
        width: 1200,
        height: 630,
        alt: '마음부고 - 품격있는 무료 모바일 부고장',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '마음부고 - 품격있는 무료 모바일 부고장',
    description: '3분 만에 만드는 품격있는 무료 모바일 부고장',
    images: ['https://maeumbugo.co.kr/og-maeumbugo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://maeumbugo.co.kr',
  },
  verification: {
    google: '19Py1zFue07o3TzDBzUlkuiJ_D7fwRBOqh44i21eK10',
    other: {
      'naver-site-verification': '4f09b03be58e139284a268de39527d36c7439898',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" {...mantineHtmlProps}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
        <ColorSchemeScript defaultColorScheme="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/materialsymbolsoutlined/v240/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1n-q_4MrImHCIJIZrDCvHOembd5zrTgt.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* 카카오 SDK */}
        <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js" integrity="sha384-l+xbElFSnPZ2rOaPrU//2FF5B4LB8FiX5q4fXYTlfcG4PGpMkE1vcL7kNXI6Cci0" crossOrigin="anonymous" async />
        {/* Material Symbols 폰트 로딩 감지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function checkFont() {
                  if (document.fonts && document.fonts.check('24px "Material Symbols Outlined"')) {
                    document.documentElement.classList.add('fonts-loaded');
                    return true;
                  }
                  return false;
                }
                
                if (checkFont()) return;
                
                if (document.fonts && document.fonts.ready) {
                  document.fonts.ready.then(function() {
                    document.documentElement.classList.add('fonts-loaded');
                  });
                }
                
                // Fallback: 최대 3초 후 강제 표시
                setTimeout(function() {
                  document.documentElement.classList.add('fonts-loaded');
                }, 3000);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <KakaoInit />
        <MantineProvider theme={dodamTheme} defaultColorScheme="light">
          <ModalsProvider>
            <Notifications position="top-right" />
            <MainLayout>
              {children}
            </MainLayout>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
