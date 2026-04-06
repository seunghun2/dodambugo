'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-41LNKTBH4W';
const GOOGLE_ADS_ID = 'AW-17911391889';

export default function GoogleAnalytics() {
    // 프로덕션에서만 GA 활성화 (로컬 개발 환경 제외)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return null;
    }

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
// 네이밍 규칙: '카테고리_동작' 형태, 카테고리는 gaEvents 섹션별 통일
export const gaEvents = {
    // ========== 부고 생성 ==========
    startCreateBugo: () => trackEvent('부고_생성시작', '부고생성'),
    selectTemplate: (templateId: string) => trackEvent('부고_템플릿선택', '부고생성', templateId),
    completeBugo: (bugoNumber: string) => trackEvent('부고_생성완료', '부고생성', bugoNumber),

    // ========== 부고 조회 ==========
    viewBugo: (bugoNumber: string) => trackEvent('부고_조회', '부고조회', bugoNumber),

    // ========== 공유 ==========
    shareBugo: (method: 'kakao' | 'link' | 'sms' | 'band') => {
        const labels: Record<string, string> = {
            kakao: '카카오톡',
            sms: '문자메시지',
            link: '링크복사',
            band: '밴드'
        };
        trackEvent('공유_부고', '공유', labels[method] || method);
    },

    // ========== 상호작용 ==========
    clickMap: () => trackEvent('상호작용_지도클릭', '상호작용'),
    clickCall: () => trackEvent('상호작용_전화클릭', '상호작용'),
    copyAddress: () => trackEvent('상호작용_주소복사', '상호작용'),

    // ========== 부의금 ==========
    openAccountModal: () => trackEvent('부의금_모달열기', '부의금'),
    copyAccount: () => trackEvent('부의금_계좌복사', '부의금'),
    clickCardPayment: () => trackEvent('부의금_카드결제클릭', '부의금'),
    startCondolence: (amount: number) => trackEvent('부의금_결제시작', '부의금', `${amount}원`),
    completeCondolence: (amount: number) => trackEvent('부의금_결제완료', '부의금', `${amount}원`),

    // ========== 화환 ==========
    clickFlowerButton: () => trackEvent('화환_버튼클릭', '화환'),
    openFlowerModal: () => trackEvent('화환_모달열기', '화환'),
    selectFlower: (productId: string) => trackEvent('화환_상품선택', '화환', productId),
    viewFlowerDetail: (productId: string) => trackEvent('화환_상세조회', '화환', productId),
    startFlowerOrder: (productId: string) => trackEvent('화환_주문시작', '화환', productId),
    submitFlowerOrder: (productId: string, price: number) => trackEvent('화환_주문제출', '화환', `${productId}_${price}원`),
    viewPaymentPage: (productId: string) => trackEvent('화환_결제페이지', '화환', productId),
    startFlowerPayment: (productId: string, price: number) => trackEvent('화환_결제시작', '화환', `${productId}_${price}원`),
    completeFlowerOrder: (orderId: string, price: number) => trackEvent('화환_결제완료', '화환', `${orderId}_${price}원`),
    failFlowerPayment: (reason: string) => trackEvent('화환_결제실패', '화환', reason),

    // ========== 감사장 ==========
    viewThanks: (bugoNumber: string) => trackEvent('감사장_조회', '감사장', bugoNumber),
    shareThanks: (method: string) => trackEvent('감사장_공유', '감사장', method),

    // ========== 페이지 ==========
    clickFAQ: () => trackEvent('페이지_자주묻는질문', '페이지'),
    clickGuide: () => trackEvent('페이지_장례가이드', '페이지'),
    clickMainCTA: () => trackEvent('페이지_메인CTA', '전환', '부고장 만들기'),
    clickHeaderCTA: () => trackEvent('페이지_헤더CTA', '전환', '부고장 만들기'),

    // ========== 발인후 오버레이 CTA ==========
    viewMemorialOverlay: (bugoNumber: string, daysSince: number) => trackEvent('오버레이_노출', '발인후CTA', `${bugoNumber}_${daysSince}일차`),
    clickOverlayCondolence: (bugoNumber: string) => trackEvent('오버레이_부의금클릭', '발인후CTA', bugoNumber),
    clickOverlayGift: (bugoNumber: string) => trackEvent('오버레이_답례품클릭', '발인후CTA', bugoNumber),
    clickOverlayFacility: (bugoNumber: string) => trackEvent('오버레이_장지비교클릭', '발인후CTA', bugoNumber),
};

