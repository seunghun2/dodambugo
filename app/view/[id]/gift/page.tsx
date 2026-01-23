'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './gift.css';

interface GiftProduct {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    image: string;
    description?: string;
}

interface BugoInfo {
    deceased_name: string;
    mourner_name: string;
    mourner_phone?: string;
    address?: string;
}

// 샘플 답례품 데이터 (나중에 DB로 교체)
const SAMPLE_GIFTS: GiftProduct[] = [
    {
        id: 'gift-1',
        name: '프리미엄 한우 세트',
        price: 150000,
        discount_price: 129000,
        image: '/images/gift-hanwoo.jpg',
        description: '1++ 등급 한우 선물세트'
    },
    {
        id: 'gift-2',
        name: '고급 과일 선물세트',
        price: 80000,
        discount_price: 69000,
        image: '/images/gift-fruit.jpg',
        description: '제철 과일 프리미엄 세트'
    },
    {
        id: 'gift-3',
        name: '홍삼 선물세트',
        price: 100000,
        discount_price: 89000,
        image: '/images/gift-ginseng.jpg',
        description: '6년근 홍삼 정과 세트'
    },
    {
        id: 'gift-4',
        name: '명품 수건 세트',
        price: 50000,
        discount_price: 45000,
        image: '/images/gift-towel.jpg',
        description: '호텔식 명품 타월 세트'
    },
    {
        id: 'gift-5',
        name: '참기름 선물세트',
        price: 60000,
        image: '/images/gift-oil.jpg',
        description: '국산 100% 참기름·들기름 세트'
    },
    {
        id: 'gift-6',
        name: '꿀 선물세트',
        price: 70000,
        discount_price: 59000,
        image: '/images/gift-honey.jpg',
        description: '국산 천연 벌꿀 세트'
    },
];

export default function GiftPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params?.id as string;

    const [bugoInfo, setBugoInfo] = useState<BugoInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<GiftProduct | null>(null);

    useEffect(() => {
        if (bugoId) {
            fetchBugoInfo();
        }
    }, [bugoId]);

    const fetchBugoInfo = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bugos')
                .select('deceased_name, mourner_name, mourner_phone, address')
                .eq('bugo_number', bugoId)
                .single();

            if (data) {
                setBugoInfo(data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSelectProduct = (product: GiftProduct) => {
        setSelectedProduct(product);
        // TODO: 주문 페이지로 이동
        router.push(`/view/${bugoId}/gift/${product.id}`);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    if (loading) {
        return (
            <div className="gift-page loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="gift-page">
            {/* 헤더 */}
            <header className="gift-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1>답례품 선물하기</h1>
            </header>

            {/* 상주 정보 */}
            <div className="recipient-info">
                <p className="label">받으시는 분</p>
                <p className="name">
                    故 {bugoInfo?.deceased_name || '고인'}님의 상주
                    <strong> {bugoInfo?.mourner_name || '상주'}님</strong>
                </p>
                <p className="desc">
                    상주님께 감사의 마음을 담은 선물을 보내드립니다
                </p>
            </div>

            {/* 상품 목록 */}
            <div className="gift-products">
                <h2 className="section-title">답례품 선택</h2>
                <div className="product-grid">
                    {SAMPLE_GIFTS.map((product) => (
                        <div
                            key={product.id}
                            className="product-card"
                            onClick={() => handleSelectProduct(product)}
                        >
                            <div className="product-image">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} />
                                ) : (
                                    <div className="placeholder">
                                        <span className="material-symbols-outlined">redeem</span>
                                    </div>
                                )}
                                {product.discount_price && (
                                    <span className="discount-badge">
                                        {Math.round((1 - product.discount_price / product.price) * 100)}%
                                    </span>
                                )}
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-desc">{product.description}</p>
                                <div className="product-price">
                                    {product.discount_price ? (
                                        <>
                                            <span className="original">{formatPrice(product.price)}원</span>
                                            <span className="sale">{formatPrice(product.discount_price)}원</span>
                                        </>
                                    ) : (
                                        <span className="sale">{formatPrice(product.price)}원</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 안내 */}
            <div className="gift-notice">
                <h3>
                    <span className="material-symbols-outlined">info</span>
                    안내사항
                </h3>
                <ul>
                    <li>답례품은 상주님께 직접 배송됩니다</li>
                    <li>배송지는 장례식장 또는 자택으로 선택 가능합니다</li>
                    <li>결제 완료 후 취소/환불이 불가합니다</li>
                    <li>배송은 결제 후 2-3일 이내 출고됩니다</li>
                </ul>
            </div>
        </div>
    );
}
