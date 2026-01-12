'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import '@/app/view/[id]/order/[productId]/order.css';

// 임시 상품 데이터 (나중에 DB에서 가져오기)
const flowerProducts = [
    { id: 1, name: '프리미엄형 화환', price: 120000, image: '/images/flower-wreath.png' },
    { id: 2, name: '대통령 화환', price: 150000, image: '/images/flower-wreath.png' },
    { id: 3, name: '스탠다드 화환', price: 100000, image: '/images/flower-wreath.png' },
    { id: 4, name: '베이직 화환', price: 80000, image: '/images/flower-wreath.png' },
    { id: 5, name: '고급 근조 화환', price: 170000, image: '/images/flower-wreath.png' },
];

interface BugoData {
    id: string;
    bugo_number?: string;
    deceased_name: string;
}

export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;
    const productId = parseInt(params.productId as string);

    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);

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
        marketing: false,
    });

    const product = flowerProducts.find(p => p.id === productId);

    useEffect(() => {
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
    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const isUUID = bugoId.includes('-') && bugoId.length > 10;
                let data = null;

                if (isUUID) {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name').eq('id', bugoId).limit(1);
                    data = result.data?.[0] || null;
                } else {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name').eq('bugo_number', bugoId).order('created_at', { ascending: false }).limit(1);
                    data = result.data?.[0] || null;
                }

                setBugo(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (bugoId) fetchBugo();
    }, [bugoId]);

    const handleSubmit = () => {
        if (!paymentForm.senderName.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }
        if (!paymentForm.senderPhone.trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }
        // TODO: 결제 연동
        alert('결제 기능은 준비 중입니다.');
    };

    if (loading) {
        return (
            <div className="order-loading">
                <div className="loading-spinner" />
                <p>정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="order-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <button onClick={() => router.back()}>돌아가기</button>
            </div>
        );
    }

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
                            onChange={(e) => setPaymentForm({ ...paymentForm, senderPhone: e.target.value })}
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

            {/* 하단 결제 버튼 */}
            <div className="order-footer">
                <div className="privacy-notice-link" onClick={() => setPrivacyModalOpen(true)}>
                    약관 및 주문 내용을 확인하였으며, 정보 제공 등에 동의합니다. <span className="material-symbols-outlined">chevron_right</span>
                </div>
                <button className="btn-payment" onClick={handleSubmit}>
                    {product.price.toLocaleString()}원 결제하기
                </button>
            </div>

            {/* 개인정보 동의 모달 */}
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
                            {/* 전체 동의 */}
                            <label className="terms-checkbox agree-all">
                                <input
                                    type="checkbox"
                                    checked={termsAgreed.privacy && termsAgreed.electronic && termsAgreed.thirdParty && termsAgreed.marketing}
                                    onChange={(e) => setTermsAgreed({
                                        privacy: e.target.checked,
                                        electronic: e.target.checked,
                                        thirdParty: e.target.checked,
                                        marketing: e.target.checked,
                                    })}
                                />
                                <span className="checkmark"></span>
                                전체 동의하기
                            </label>
                            <ul className="terms-list">
                                <li>
                                    <label className="terms-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={termsAgreed.privacy}
                                            onChange={(e) => setTermsAgreed({ ...termsAgreed, privacy: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        개인정보 수집 및 이용안내(필수)
                                    </label>
                                    <a href="/privacy" target="_blank" className="terms-link">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </a>
                                </li>
                                <li>
                                    <label className="terms-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={termsAgreed.electronic}
                                            onChange={(e) => setTermsAgreed({ ...termsAgreed, electronic: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        전자금융거래 이용약관(필수)
                                    </label>
                                    <a href="/terms" target="_blank" className="terms-link">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </a>
                                </li>
                                <li>
                                    <label className="terms-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={termsAgreed.thirdParty}
                                            onChange={(e) => setTermsAgreed({ ...termsAgreed, thirdParty: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        개인정보 제3자 제공/위탁안내(필수)
                                    </label>
                                    <a href="/privacy" target="_blank" className="terms-link">
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
                                    <a href="/privacy" target="_blank" className="terms-link">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button
                                className={`btn-confirm ${!(termsAgreed.privacy && termsAgreed.electronic && termsAgreed.thirdParty) ? 'disabled' : ''}`}
                                onClick={() => setPrivacyModalOpen(false)}
                                disabled={!(termsAgreed.privacy && termsAgreed.electronic && termsAgreed.thirdParty)}
                            >
                                동의합니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
