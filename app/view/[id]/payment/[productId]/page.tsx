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

                {/* 결제 금액 */}
                <section className="order-section payment-section">
                    <div className="payment-row">
                        <span>상품 금액</span>
                        <span>{product.price.toLocaleString()}원</span>
                    </div>
                    <div className="payment-row">
                        <span>배송비</span>
                        <span>무료</span>
                    </div>
                    <div className="payment-row total">
                        <span>총 결제 금액</span>
                        <span>{product.price.toLocaleString()}원</span>
                    </div>
                </section>
            </div>

            {/* 하단 결제 버튼 */}
            <div className="order-footer">
                <button className="btn-payment" onClick={handleSubmit}>
                    {product.price.toLocaleString()}원 결제하기
                </button>
            </div>
        </div>
    );
}
