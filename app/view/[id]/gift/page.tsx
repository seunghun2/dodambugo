'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './gift.css';

interface GiftProduct {
    id: string;
    brand: string;
    name: string;
    price: number;
    discount_price?: number;
    discount_percent?: number;
    image: string;
    badge?: string;
}

interface BugoInfo {
    deceased_name: string;
    mourner_name: string;
}

// 샘플 답례품 데이터 (나중에 DB로 교체)
const SAMPLE_GIFTS: GiftProduct[] = [
    {
        id: 'gift-1',
        brand: '광동',
        name: '비타500 데일리스틱(70포)',
        price: 20000,
        discount_price: 18900,
        discount_percent: 5.5,
        image: '/images/gift-vita.jpg',
        badge: '특가상품'
    },
    {
        id: 'gift-2',
        brand: '천호엔케어',
        name: '껍질째 통째로 담은 양파프리미엄 80ml*30팩',
        price: 42000,
        discount_price: 39900,
        discount_percent: 5.0,
        image: '/images/gift-onion.jpg',
        badge: '사은품증정'
    },
    {
        id: 'gift-3',
        brand: '천호엔케어',
        name: '아름다운 여성을 위한 석류프리미엄 100ml*30팩',
        price: 47000,
        discount_price: 44900,
        discount_percent: 4.5,
        image: '/images/gift-pomegranate.jpg',
        badge: '특가상품'
    },
    {
        id: 'gift-4',
        brand: '천호엔케어',
        name: '우먼솔루션 75ml*30팩(석류농축액)',
        price: 53000,
        discount_price: 49900,
        discount_percent: 5.8,
        image: '/images/gift-woman.jpg',
        badge: '1+1증정'
    },
    {
        id: 'gift-5',
        brand: '천호엔케어',
        name: '환하고 밝은 에너지 블루베리프리미엄 80ml*30팩',
        price: 68000,
        discount_price: 64900,
        discount_percent: 4.6,
        image: '/images/gift-blueberry.jpg',
        badge: '특가상품'
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
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1>감사답례품 신청하기</h1>
            </header>

            {/* 상단 배너 */}
            <div className="gift-banner">
                <div className="banner-content">
                    <p className="banner-text">
                        답례메세지와 함께<br />
                        조문객분들께 마음을 전달해보세요.
                    </p>
                </div>
                <div className="gift-icon">
                    <span className="material-symbols-outlined">redeem</span>
                </div>
            </div>

            {/* 상품 리스트 섹션 */}
            <div className="gift-products">
                <h2 className="section-title">
                    조문객분들께 감사의 마음을 전하세요
                </h2>

                {/* 카테고리 아이콘 */}
                <div className="category-icons">
                    <div className="category-icon">
                        <div className="icon-circle">
                            <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                        <span>배송상품</span>
                    </div>
                </div>

                {/* 필터 바 */}
                <div className="filter-bar">
                    <span className="product-count">총 {SAMPLE_GIFTS.length}개</span>
                    <select className="sort-select">
                        <option>추천순</option>
                        <option>낮은가격순</option>
                        <option>높은가격순</option>
                    </select>
                </div>

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
                                    <span className="material-symbols-outlined">redeem</span>
                                </div>
                            </div>
                            <div className="product-info">
                                <p className="product-brand">{product.brand}</p>
                                <h3 className="product-name">
                                    {product.name}
                                    {product.badge && <span className="badge">{product.badge}</span>}
                                </h3>
                                <div className="product-price">
                                    {product.discount_price && (
                                        <span className="original">{formatPrice(product.price)}원</span>
                                    )}
                                    <div className="sale-row">
                                        {product.discount_percent && (
                                            <span className="discount-percent">{product.discount_percent}%</span>
                                        )}
                                        <span className="sale">
                                            {formatPrice(product.discount_price || product.price)}원
                                        </span>
                                    </div>
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
                    <li>답례품은 입력하신 주소로 배송됩니다</li>
                    <li>배송은 신청 후 2-3일 내 출고됩니다</li>
                    <li>배송 관련 문의는 고객센터로 연락해 주세요</li>
                </ul>
            </div>
        </div>
    );
}
