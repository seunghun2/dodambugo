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

    useEffect(() => {
        if (bugoId) {
            fetchBugoInfo();
        }
    }, [bugoId]);

    const fetchBugoInfo = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('bugos')
                .select('deceased_name, mourner_name')
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>감사답례품 신청하기</h1>
            </header>

            {/* 상단 배너 */}
            <div className="gift-banner">
                <div className="banner-content">
                    <p className="banner-text">
                        조문해 주신 분들께<br />
                        감사의 마음을 전해보세요.
                    </p>
                </div>
                <div className="gift-icon">
                    <img src="/images/gift-banner-icon.png" alt="선물" />
                </div>
            </div>
            <div className="gift-products">
                {/* 상품 그리드 */}
                <div className="product-grid">
                    {SAMPLE_GIFTS.map((product) => (
                        <div
                            key={product.id}
                            className="product-card"
                            onClick={() => handleSelectProduct(product)}
                        >
                            <div className="product-image">
                                <div className="placeholder">
                                    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                                        <rect x="8" y="20" width="32" height="22" rx="2" fill="#E5E7EB" />
                                        <rect x="6" y="14" width="36" height="8" rx="2" fill="#D1D5DB" />
                                        <rect x="22" y="14" width="4" height="28" fill="#9CA3AF" />
                                        <path d="M24 14C24 14 20 9 17 9C14 9 12 11 12 13C12 15 14 16 17 16C20 16 24 14 24 14Z" fill="#9CA3AF" />
                                        <path d="M24 14C24 14 28 9 31 9C34 9 36 11 36 13C36 15 34 16 31 16C28 16 24 14 24 14Z" fill="#9CA3AF" />
                                    </svg>
                                </div>
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2" />
                        <path d="M12 16V12M12 8H12.01" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    안내사항
                </h3>
                <ul>
                    <li>답례품은 입력하신 주소로 배송됩니다</li>
                    <li>배송은 신청 후 2-3일 내 출고됩니다</li>
                    <li>배송 관련 문의는 고객센터로 연락해 주세요</li>
                </ul>
            </div>
        </div>
    );
}
