'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-41LNKTBH4W';

export default function GoogleAnalytics() {
    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
            </Script>
        </>
    );
}

// Google Analytics 이벤트 추적 함수
export function trackEvent(
    action: string,
    category: string,
    label?: string,
    value?: number
) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
}

// 부고 관련 이벤트들
export const gaEvents = {
    // 부고 생성 시작
    startCreateBugo: () => trackEvent('start_create', 'bugo', 'creation_started'),

    // 템플릿 선택
    selectTemplate: (templateId: string) => trackEvent('select_template', 'bugo', templateId),

    // 부고 생성 완료
    completeBugo: (bugoNumber: string) => trackEvent('complete_create', 'bugo', bugoNumber),

    // 부고 공유
    shareBugo: (method: 'kakao' | 'link' | 'sms' | 'band') => trackEvent('share', 'bugo', method),

    // 부고 조회
    viewBugo: (bugoNumber: string) => trackEvent('view', 'bugo', bugoNumber),

    // 장례식장 지도 클릭
    clickMap: () => trackEvent('click_map', 'interaction'),

    // 장례식장 전화 클릭
    clickCall: () => trackEvent('click_call', 'interaction'),

    // 조의금 계좌 복사
    copyAccount: () => trackEvent('copy_account', 'interaction'),
};
