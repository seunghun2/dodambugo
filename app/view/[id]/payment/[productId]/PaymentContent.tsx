'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import '@/app/view/[id]/order/[productId]/order.css';

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
    const bugo = initialBugo;
    const product = initialProduct;

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
    const [sdkLoaded, setSdkLoaded] = useState(false); // SDK 로드 상태
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
        // 이노페이 SDK 스크립트 로드 (tpay v2)
        const existingScript = document.querySelector('script[src="https://pg.innopay.co.kr/tpay/js/innopay.js"]');

        if (existingScript) {
            // 이미 로드됨
            setSdkLoaded(true);
        } else {
            const script = document.createElement('script');
            script.src = 'https://pg.innopay.co.kr/tpay/js/innopay.js';
            script.async = true;
            script.onload = () => {
                console.log('이노페이 SDK 로드 완료');
                setSdkLoaded(true);
            };
            script.onerror = () => {
                console.error('이노페이 SDK 로드 실패');
            };
            document.head.appendChild(script);
        }

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

    // 주문번호 생성
    const generateOrderId = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.getTime().toString().slice(-6);
        return `MBG${dateStr}${timeStr}`;
    };

    // 이노페이 결제 호출
    const callInnopay = (orderId: string) => {
        if (!sdkLoaded) {
            alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const innopay = (window as any).innopay;
        if (!innopay) {
            alert('결제 모듈 초기화 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 결제 수단 매핑
        const payMethodMap: Record<string, string> = {
            card: 'CARD',
            easy: 'EPAY',      // 간편결제
            virtual: 'VBANK',  // 가상계좌
        };

        innopay.goPay({
            // 테스트 MID (실제 운영 시 변경 필요)
            mid: 'testpay01m',
            // 결제 정보
            payMethod: payMethodMap[paymentMethod] || 'CARD',
            goodsName: product.name,
            amt: product.discount_price || product.price,
            moid: orderId,
            buyerName: paymentForm.senderName,
            buyerTel: paymentForm.senderPhone.replace(/-/g, ''),
            buyerEmail: '',
            // 결제 결과 URL (서버에서 처리)
            returnUrl: `${window.location.origin}/api/payment/innopay/callback`,
            // 결과 처리
            onSuccess: async (result: any) => {
                console.log('결제 성공:', result);
                // DB 저장 후 완료 페이지로 이동
                await saveOrder(orderId, result);
            },
            onFail: (result: any) => {
                console.log('결제 실패:', result);
                alert(`결제 실패: ${result.resultMsg || '알 수 없는 오류'}`);
            },
        });
    };

    // 주문 저장 함수 (결제 성공 후 호출)
    const saveOrder = async (orderId: string, paymentResult: any) => {
        const storedOrder = sessionStorage.getItem(`order_${bugoId}_${productId}`);
        if (!storedOrder) return;

        const orderData = JSON.parse(storedOrder);

        try {
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
                    payment_status: 'paid',
                    payment_tid: paymentResult?.tid || orderId,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || '주문 저장 실패');
            }

            // 결제 정보 저장 (완료 페이지용)
            sessionStorage.setItem(`payment_${bugoId}`, JSON.stringify({
                senderName: paymentForm.senderName,
                senderPhone: paymentForm.senderPhone,
                paymentMethod: paymentMethod,
                marketingAgreed: termsAgreed.marketing,
                orderNumber: result.order_number,
            }));

            // 완료 페이지로 이동
            router.push(`/view/${bugoId}/order/complete`);
        } catch (err: any) {
            alert(err.message || '주문 저장 중 오류가 발생했습니다.');
        }
    };

    const handleSubmit = () => {
        if (!paymentForm.senderName.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }
        if (!paymentForm.senderPhone.trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }

        // 주문 데이터 확인
        const storedOrder = sessionStorage.getItem(`order_${bugoId}_${productId}`);
        if (!storedOrder) {
            alert('주문 정보를 찾을 수 없습니다. 다시 시도해주세요.');
            return;
        }

        // 주문번호 생성 후 이노페이 결제 호출
        const orderId = generateOrderId();
        callInnopay(orderId);
    };

    // 로딩/에러 처리는 서버 컴포넌트에서 담당

    return (
        <div className="order-page">
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
                        <button
                            type="button"
                            className={`payment-method-btn ${paymentMethod === 'virtual' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('virtual')}
                        >
                            가상계좌
                        </button>
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
                                <span className="material-symbols-outlined">close</span>
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
                <button className="btn-payment" onClick={handleSubmit}>
                    {product.price.toLocaleString()}원 결제하기
                </button>
            </div>
        </div>
    );
}
