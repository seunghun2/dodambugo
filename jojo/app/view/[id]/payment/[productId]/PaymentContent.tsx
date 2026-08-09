'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { gaEvents } from '@/components/GoogleAnalytics';
import { useIsB2b } from '@/lib/b2b';
import '@/app/view/[id]/order/[productId]/order.css';

// INNOPAY 타입 선언
declare global {
    interface Window {
        innopay: {
            goPay: (params: {
                payMethod: string;
                mid: string;
                moid: string;
                goodsName: string;
                goodsCnt: string;
                amt: string;
                taxFreeAmt?: string;
                buyerName: string;
                buyerTel: string;
                buyerEmail: string;
                returnUrl: string;
                currency?: string;
                mallReserved?: string;
                offeringPeriod?: string;
                mallIp?: string;
                mallUserId?: string;
                userIp?: string;
                userId?: string;
                vBankExpDate?: string;
                appScheme?: string;
                logoUrl?: string;
            }) => void;
        };
    }
}

interface FlowerProduct {
    id: string;
    name: string;
    price: number;
    discount_price: number | null;
    images: string[];
}

interface BugoData {
    id: string;
    bugo_number?: string;
    deceased_name: string;
}

interface PaymentContentProps {
    initialBugo: BugoData | null;
    initialProduct: FlowerProduct;
    bugoId: string;
    productId: string;
}

export default function PaymentContent({ initialBugo, initialProduct, bugoId, productId }: PaymentContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const testPriceParam = searchParams ? searchParams.get('testPrice') : null;
    const isB2b = useIsB2b();
    const pathPrefix = isB2b ? '/b2b' : '';
    const bugo = initialBugo;
    const product = initialProduct;
    const effectivePrice = testPriceParam ? parseInt(testPriceParam) : product.price;

    // sessionStorage에서 주문 정보 가져오기
    const [orderData, setOrderData] = useState({
        ribbonText1: '삼가 故人의 冥福을 빕니다',
        ribbonText2: '',
        recipientName: '',
    });

    // 결제 폼
    const [paymentForm, setPaymentForm] = useState({
        senderName: '',
        senderPhone: '',
    });
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'easy' | 'virtual'>('card'); // 결제방식
    const [privacyModalOpen, setPrivacyModalOpen] = useState(false); // 개인정보 동의 모달
    const [termsAgreed, setTermsAgreed] = useState({
        privacy: false,
        electronic: false,
        thirdParty: false,
        marketing: true,
    });

    // 전화번호 자동 포맷팅
    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPaymentForm({ ...paymentForm, senderPhone: formatted });
    };

    useEffect(() => {
        // GA: 결제 페이지 조회 이벤트
        gaEvents.viewPaymentPage(productId);
        // sessionStorage에서 주문 데이터 가져오기
        const storedData = sessionStorage.getItem(`order_${bugoId}_${productId}`);
        if (storedData) {
            try {
                setOrderData(JSON.parse(storedData));
            } catch (e) {
                console.error('주문 데이터 파싱 오류:', e);
            }
        }
    }, [bugoId, productId]);

    const handleSubmit = async () => {

        if (!paymentForm.senderName.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }
        if (!paymentForm.senderPhone.trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }
        const phoneDigits = paymentForm.senderPhone.replace(/[^\d]/g, '');
        if (!phoneDigits.startsWith('010') || (phoneDigits.length !== 10 && phoneDigits.length !== 11)) {
            alert('연락처를 올바르게 입력해주세요. (010-0000-0000)');
            return;
        }

        // INNOPAY SDK 로드 확인
        if (typeof window === 'undefined' || !window.innopay) {
            alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 주문 데이터 가져오기
        const storedOrder = sessionStorage.getItem(`order_${bugoId}_${productId}`);
        if (!storedOrder) {
            alert('주문 정보를 찾을 수 없습니다. 다시 시도해주세요.');
            return;
        }
        const orderData = JSON.parse(storedOrder);

        // 고유 주문번호 생성
        const moid = `MAEUM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // GA: 화환 결제 시작 이벤트
        gaEvents.startFlowerPayment(productId, product.price);

        try {
            // DB에 주문 저장 (결제 대기 상태)
            const response = await fetch('/api/flower-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bugo_id: bugo?.id,
                    bugo_number: bugo?.bugo_number || bugoId,
                    product_id: parseInt(productId),
                    product_name: orderData.productName,
                    product_price: orderData.productPrice,
                    sender_name: paymentForm.senderName,
                    sender_phone: paymentForm.senderPhone,
                    recipient_name: orderData.recipientName,
                    funeral_home: orderData.funeralHome,
                    room: orderData.room,
                    address: orderData.address,
                    ribbon_text1: orderData.ribbonText1,
                    ribbon_text2: orderData.ribbonText2,
                    payment_method: paymentMethod,
                    payment_status: 'pending', // 결제 대기 상태
                    moid: moid, // 주문번호 저장
                    partner_data: orderData.partner_data || null,
                    ...(typeof window !== 'undefined' && window.location.pathname.startsWith('/b2b') ? { source: 'b2b' } : {}),
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || '주문 저장 실패');
            }

            // 결제 정보 저장 (콜백 페이지에서 사용)
            sessionStorage.setItem(`payment_${bugoId}`, JSON.stringify({
                senderName: paymentForm.senderName,
                senderPhone: paymentForm.senderPhone,
                paymentMethod: paymentMethod,
                marketingAgreed: termsAgreed.marketing,
                orderNumber: result.order_number,
                moid: moid,
                orderId: result.id,
            }));

            // payMethod 매핑
            const payMethodMap: { [key: string]: string } = {
                'card': 'CARD',
                'easy': 'EPAY',
                'virtual': 'VBANK'
            };

            // 가상계좌 입금 기한 계산 (7일 후)
            const getVBankExpDate = () => {
                const date = new Date();
                date.setDate(date.getDate() + 7);
                return date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD 형식
            };

            // returnUrl에 사용할 B2B prefix 동적 감지 (포트 3001 = B2B)
            const dynamicPrefix = (() => {
                const h = window.location.hostname;
                const p = window.location.port;
                if (p === '3001' || h.includes('partner') || h.includes('b2b') || h.includes('bugoon') || window.location.pathname.startsWith('/b2b')) {
                    return '/b2b';
                }
                return '';
            })();

            // INNOPAY 결제창 호출
            window.innopay.goPay({
                payMethod: payMethodMap[paymentMethod] || 'CARD',
                mid: process.env.NEXT_PUBLIC_INNOPAY_MID || 'pgmaeum01m',
                moid: moid,
                goodsName: product.name,
                goodsCnt: '1',
                amt: '0',  // 과세금액 없음 (화환 = 전액 면세)
                taxFreeAmt: String(effectivePrice),  // 면세금액 = 상품가격 (총 결제금액 = amt + taxFreeAmt)
                buyerName: paymentForm.senderName,
                buyerTel: paymentForm.senderPhone.replace(/-/g, ''),
                buyerEmail: 'order@maeumbugo.co.kr',
                returnUrl: `${window.location.origin}${dynamicPrefix}/view/${bugoId}/payment/callback`,
                currency: 'KRW',
                mallReserved: JSON.stringify({ bugoId, productId, orderId: result.id, originalTaxFreeAmt: String(effectivePrice) }),
                vBankExpDate: paymentMethod === 'virtual' ? getVBankExpDate() : '', // 가상계좌 입금기한
            });

        } catch (err: any) {
            alert(err.message || '주문 처리 중 오류가 발생했습니다.');
        }
    };

    // SDK 로드 상태
    const [sdkLoaded, setSdkLoaded] = useState(typeof window !== 'undefined' && !!window.innopay);

    // 뒤로가기 후 재진입 시 이미 로드된 SDK 감지
    useEffect(() => {
        if (window.innopay) {
            setSdkLoaded(true);
            return;
        }
        const interval = setInterval(() => {
            if (window.innopay) {
                setSdkLoaded(true);
                clearInterval(interval);
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    // 로딩/에러 처리는 서버 컴포넌트에서 담당

    return (
        <>
            {/* INNOPAY SDK */}
            <Script
                src="https://pg.innopay.co.kr/tpay/js/v1/innopay.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('INNOPAY SDK loaded');
                    // SDK가 const로 선언되어 window에 자동 부착 안 되므로 명시적 할당
                    if (typeof (window as any).innopay === 'undefined') {
                        try {
                            // globalThis에서 innopay 가져와서 window에 할당
                            const script = document.createElement('script');
                            script.textContent = 'window.innopay = innopay;';
                            document.body.appendChild(script);
                            document.body.removeChild(script);
                            console.log('INNOPAY attached to window');
                        } catch (e) {
                            console.error('Failed to attach innopay to window:', e);
                        }
                    }
                    setSdkLoaded(true);
                }}
            />
            <div className={`order-page payment-page ${isB2b ? 'b2b-theme' : ''}`}>
                {/* 헤더 */}
                <header className="order-header">
                    <button className="back-btn" onClick={() => router.back()}>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1>보내시는 분</h1>
                    <div style={{ width: 40 }} />
                </header>

                <div className="order-content">
                    {/* 보내시는 분 */}
                    <section className="order-section">
                        <h2 className="section-title">이름 및 연락처</h2>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="이름을 입력해주세요"
                                value={paymentForm.senderName}
                                onChange={(e) => setPaymentForm({ ...paymentForm, senderName: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="tel"
                                placeholder="연락처를 입력해주세요"
                                value={paymentForm.senderPhone}
                                onChange={handlePhoneChange}
                                maxLength={13}
                            />
                        </div>
                    </section>

                    {/* 결제방식 */}
                    <section className="order-section">
                        <h2 className="section-title">결제방식</h2>
                        <div className="payment-methods">
                            <button
                                type="button"
                                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                카드
                            </button>
                            <button
                                type="button"
                                className={`payment-method-btn ${paymentMethod === 'easy' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('easy')}
                            >
                                간편결제
                            </button>
                            {/* 가상계좌 - INNOPAY 설정 완료 후 활성화
                            <button
                                type="button"
                                className={`payment-method-btn ${paymentMethod === 'virtual' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('virtual')}
                            >
                                가상계좌
                            </button>
                            */}
                        </div>
                    </section>

                    {/* 배송가능시간 안내 */}
                    <section className="order-section delivery-notice">
                        <h2 className="section-title">
                            <span className="material-symbols-outlined">info</span>
                            배송 안내
                        </h2>
                        <p>평일/주말 오전 9시부터 오후 6시 사이 결제 완료 시, 약 4시간 내 배송해드립니다.</p>
                        <p>오후 6시 이후 주문은 다음날 정오까지 도착합니다.</p>

                        <p className="notice-warning">※ 기상 및 도로 상황에 따라 배송 시간이 변동될 수 있습니다.</p>

                        <p className="notice-warning">※ 주말·공휴일 배송</p>
                        <p>당일 배송은 오후 4시까지 주문 가능하며, 이후 주문은 다음날 정오까지 배송됩니다.</p>

                        <p className="notice-warning">※ 상품 안내</p>
                        <p>화환은 전국 제휴 화원에서 정성껏 제작됩니다. 지역 및 수급 상황에 따라 이미지와 구성이 일부 다를 수 있으나, 품질에는 차이가 없도록 최선을 다하겠습니다.</p>
                    </section>

                </div>

                {/* 개인정보 동의 모달 (바텀시트) */}
                {privacyModalOpen && (
                    <div className="modal-overlay" onClick={() => setPrivacyModalOpen(false)}>
                        <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>개인정보 수집/제공 동의</h3>
                                <button className="modal-close" onClick={() => setPrivacyModalOpen(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-content">
                                <ul className="terms-list">
                                    <li className="required-term">
                                        <span className="term-bullet">•</span>
                                        <span className="term-text">개인정보 수집 및 이용안내(필수)</span>
                                        <a href="/privacy" target="_blank" className="terms-link">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </a>
                                    </li>
                                    <li className="required-term">
                                        <span className="term-bullet">•</span>
                                        <span className="term-text">전자금융거래 이용약관(필수)</span>
                                        <a href="/terms" target="_blank" className="terms-link">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </a>
                                    </li>
                                    <li className="required-term">
                                        <span className="term-bullet">•</span>
                                        <span className="term-text">개인정보 제3자 제공/위탁안내(필수)</span>
                                        <a href="/privacy-third-party" target="_blank" className="terms-link">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </a>
                                    </li>
                                    <li>
                                        <label className="terms-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={termsAgreed.marketing}
                                                onChange={(e) => setTermsAgreed({ ...termsAgreed, marketing: e.target.checked })}
                                            />
                                            <span className="checkmark"></span>
                                            마케팅 수신 동의 약관(선택)
                                        </label>
                                        <a href="/marketing" target="_blank" className="terms-link">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 하단 결제 버튼 - 항상 최상단에 고정 */}
                <div className="order-footer">
                    {!privacyModalOpen && (
                        <div className="privacy-notice-link" onClick={() => setPrivacyModalOpen(true)}>
                            약관 및 주문 내용을 확인하였으며, 정보 제공 등에 동의합니다. <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                    )}
                    <button
                        className="btn-payment"
                        onClick={handleSubmit}
                        disabled={!sdkLoaded}
                        style={{ opacity: sdkLoaded ? 1 : 0.6 }}
                    >
                        {sdkLoaded
                            ? `${product.price.toLocaleString()}원 결제하기`
                            : '결제 모듈 로딩중...'
                        }
                    </button>
                </div>
            </div>
        </>
    );
}
