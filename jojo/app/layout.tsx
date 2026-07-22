// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

import { MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { dodamTheme } from '@/lib/theme';
import MainLayout from '@/components/MainLayout';
import KakaoInit from '@/components/KakaoInit';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MicrosoftClarity from '@/components/MicrosoftClarity';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

export const metadata = {
  title: '마음부고 - 무료 모바일 부고장 만들기 | 3분 완성, 카카오톡 공유',
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
        <script
          data-mantine-color-scheme
          dangerouslySetInnerHTML={{
            __html: `try { var colorScheme = localStorage.getItem('mantine-color-scheme') || 'light'; document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme); } catch (e) {}`
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* Pretendard: preload로 렌더링 차단 최소화 */}
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="preload"
          as="style"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        {/* Material Symbols: preload hint로 빠른 로딩 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="preload"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* 카카오 SDK */}
        <Script 
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js" 
          integrity="sha384-l+xbElFSnPZ2rOaPrU//2FF5B4LB8FiX5q4fXYTlfcG4PGpMkE1vcL7kNXI6Cci0" 
          crossOrigin="anonymous" 
          strategy="afterInteractive"
        />
        {/* Material Symbols 폰트 로딩 감지 */}
        <Script
          id="material-symbols-font-loader"
          strategy="afterInteractive"
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
        <MicrosoftClarity />
        <KakaoInit />
        {/* 🔒 개발자 도구 방지 및 F12 차단 (about:blank 강제 리다이렉트) */}
        <Script
          id="devtools-blocker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

                function preventAccess() {
                  window.location.replace('about:blank');
                }

                // 1. 단축키 방지 (F12, Ctrl+Shift+I 등)
                window.addEventListener('keydown', function(e) {
                  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                  const isControl = isMac ? e.metaKey : e.ctrlKey;
                  const isShift = e.shiftKey;
                  const isAlt = e.altKey;

                  let isBlocked = false;

                  if (e.keyCode === 123) { // F12
                    isBlocked = true;
                  } else if (isControl && isShift && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { // Ctrl+Shift+I/J/C
                    isBlocked = true;
                  } else if (isControl && isAlt && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { // Cmd+Alt+I/J/C
                    isBlocked = true;
                  } else if (isControl && e.keyCode === 85) { // Ctrl+U (소스보기)
                    isBlocked = true;
                  }

                  if (isBlocked) {
                    e.preventDefault();
                    preventAccess();
                  }
                });

                // 3. 개발자 도구 창 활성화 감지 (창 크기 차이 비교)
                const threshold = 160;
                setInterval(function() {
                  const widthDev = window.outerWidth - window.innerWidth > threshold;
                  const heightDev = window.outerHeight - window.innerHeight > threshold;
                  if (widthDev || heightDev) {
                    preventAccess();
                  }
                }, 1000);
              })();
            `,
          }}
        />
        <MantineProvider theme={dodamTheme} defaultColorScheme="light">
          <ModalsProvider>
            <Notifications position="top-center" zIndex={10000} />
            <MainLayout>
              {children}
            </MainLayout>
          </ModalsProvider>
        </MantineProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
