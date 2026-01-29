'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-41LNKTBH4W';
const GOOGLE_ADS_ID = 'AW-17911391889';

export default function GoogleAnalytics() {
    return (
        <>
            {/* Google Analytics */}
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
          gtag('config', '${GOOGLE_ADS_ID}');
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

// 부고 관련 이벤트들 (한글 라벨로 GA에서 쉽게 확인)
export const gaEvents = {
    // ========== 부고 생성 플로우 ==========
    startCreateBugo: () => trackEvent('부고_생성시작', '부고생성'),
    selectTemplate: (templateId: string) => trackEvent('템플릿_선택', '부고생성', templateId),
    completeBugo: (bugoNumber: string) => trackEvent('부고_생성완료', '부고생성', bugoNumber),

    // ========== 부고 조회 ==========
    viewBugo: (bugoNumber: string) => trackEvent('부고_조회', '부고뷰', bugoNumber),

    // ========== 공유 ==========
    shareBugo: (method: 'kakao' | 'link' | 'sms' | 'band') => {
        const labels: Record<string, string> = {
            kakao: '카카오톡',
            sms: '문자메시지',
            link: '링크복사',
            band: '밴드'
        };
        trackEvent('부고_공유', '공유', labels[method] || method);
    },

    // ========== 지도/연락 ==========
    clickMap: () => trackEvent('지도_클릭', '상호작용'),
    clickCall: () => trackEvent('장례식장_전화', '상호작용'),
    copyAddress: () => trackEvent('주소_복사', '상호작용'),

    // ========== 부의금 플로우 ==========
    openAccountModal: () => trackEvent('부의금모달_열기', '부의금'),
    copyAccount: () => trackEvent('계좌번호_복사', '부의금'),
    clickCardPayment: () => trackEvent('카드결제_클릭', '부의금'),
    startCondolence: (amount: number) => trackEvent('부의금_결제시작', '부의금', `${amount}원`),
    completeCondolence: (amount: number) => trackEvent('부의금_결제완료', '부의금', `${amount}원`),

    // ========== 화환 플로우 ==========
    clickFlowerButton: () => trackEvent('화환버튼_클릭', '화환'),
    openFlowerModal: () => trackEvent('화환모달_열기', '화환'),
    selectFlower: (productId: string) => trackEvent('화환상품_선택', '화환', productId),
    viewFlowerDetail: (productId: string) => trackEvent('화환상세_조회', '화환', productId),
    startFlowerOrder: (productId: string) => trackEvent('화환주문_시작', '화환', productId),
    submitFlowerOrder: (productId: string, price: number) => trackEvent('화환주문_제출', '화환', `${productId}_${price}원`),
    completeFlowerOrder: (orderId: string, price: number) => trackEvent('화환결제_완료', '화환', `${orderId}_${price}원`),
    failFlowerPayment: (reason: string) => trackEvent('화환결제_실패', '화환', reason),

    // ========== 감사장 ==========
    viewThanks: (bugoNumber: string) => trackEvent('감사장_조회', '감사장', bugoNumber),
    shareThanks: (method: string) => trackEvent('감사장_공유', '감사장', method),

    // ========== 기타 ==========
    clickFAQ: () => trackEvent('FAQ_클릭', '기타'),
    clickGuide: () => trackEvent('장례가이드_클릭', '기타'),
};

