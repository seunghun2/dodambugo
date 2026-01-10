'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import './order.css';

// 임시 상품 데이터 (나중에 DB에서 가져오기)
const flowerProducts = [
    { id: 1, name: '프리미엄형 화환', desc: '복도에 비치되는 고급근조 3단 특대 형태로 제작됩니다', originalPrice: 150000, price: 120000, image: '/images/flower-wreath.png' },
    { id: 2, name: '대통령 화환', desc: '복도에 비치되는 고급근조 3단 특대 형태로 제작됩니다', originalPrice: 180000, price: 150000, image: '/images/flower-wreath.png' },
    { id: 3, name: '스탠다드 화환', desc: '복도에 비치되는 표준형 3단 화환입니다', originalPrice: 120000, price: 100000, image: '/images/flower-wreath.png' },
    { id: 4, name: '베이직 화환', desc: '간결하면서도 정성이 담긴 기본형 화환입니다', originalPrice: 100000, price: 80000, image: '/images/flower-wreath.png' },
    { id: 5, name: '고급 근조 화환', desc: '최고급 생화로 제작되는 프리미엄 화환입니다', originalPrice: 200000, price: 170000, image: '/images/flower-wreath.png' },
];

interface BugoData {
    id: string;
    bugo_number?: string;
    deceased_name: string;
    funeral_home?: string;
    room_number?: string;
    address?: string;
}

export default function OrderPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;
    const productId = parseInt(params.productId as string);

    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);

    // 주문 폼
    const [orderForm, setOrderForm] = useState({
        senderName: '',
        senderPhone: '',
        ribbonText1: '삼가 고인의 명복을 빕니다',
        ribbonText2: '',
    });

    const product = flowerProducts.find(p => p.id === productId);

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const isUUID = bugoId.includes('-') && bugoId.length > 10;
                let data = null;

                if (isUUID) {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name, funeral_home, room_number, address').eq('id', bugoId).limit(1);
                    data = result.data?.[0] || null;
                } else {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name, funeral_home, room_number, address').eq('bugo_number', bugoId).order('created_at', { ascending: false }).limit(1);
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
        // TODO: 결제 연동
        alert('결제 기능은 준비 중입니다.');
    };

    if (loading) {
        return (
            <div className="order-loading">
                <div className="loading-spinner" />
                <p>주문 정보를 불러오고 있습니다...</p>
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
                <h1>주문하기</h1>
                <div style={{ width: 40 }} />
            </header>

            <div className="order-content">
                {/* 선택한 상품 */}
                <section className="order-section">
                    <h2 className="section-title">선택한 상품</h2>
                    <div className="selected-product">
                        <div className="product-image">
                            <img src={product.image} alt={product.name} />
                        </div>
                        <div className="product-info">
                            <h3>{product.name}</h3>
                            <p className="price">{product.price.toLocaleString()}원</p>
                        </div>
                    </div>
                </section>

                {/* 배송지 */}
                <section className="order-section">
                    <h2 className="section-title">배송지</h2>
                    <div className="delivery-info">
                        <p className="funeral-home">{bugo?.funeral_home || '장례식장'} {bugo?.room_number || ''}</p>
                        <p className="address">{bugo?.address || ''}</p>
                        <p className="deceased">故 {bugo?.deceased_name}님</p>
                    </div>
                </section>

                {/* 주문자 정보 */}
                <section className="order-section">
                    <h2 className="section-title">주문자 정보</h2>
                    <div className="form-group">
                        <label>이름</label>
                        <input
                            type="text"
                            placeholder="이름을 입력해주세요"
                            value={orderForm.senderName}
                            onChange={(e) => setOrderForm({ ...orderForm, senderName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>연락처</label>
                        <input
                            type="tel"
                            placeholder="연락처를 입력해주세요"
                            value={orderForm.senderPhone}
                            onChange={(e) => setOrderForm({ ...orderForm, senderPhone: e.target.value })}
                        />
                    </div>
                </section>

                {/* 리본 문구 */}
                <section className="order-section">
                    <h2 className="section-title">리본 문구</h2>
                    <div className="form-group">
                        <label>상단 문구</label>
                        <input
                            type="text"
                            placeholder="삼가 고인의 명복을 빕니다"
                            value={orderForm.ribbonText1}
                            onChange={(e) => setOrderForm({ ...orderForm, ribbonText1: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>하단 문구 (보내는 분)</label>
                        <input
                            type="text"
                            placeholder="홍길동 드림"
                            value={orderForm.ribbonText2}
                            onChange={(e) => setOrderForm({ ...orderForm, ribbonText2: e.target.value })}
                        />
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
