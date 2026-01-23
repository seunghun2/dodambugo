'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import './detail.css';

interface GiftProduct {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    image: string;
    description?: string;
}

// 샘플 답례품 데이터 (나중에 DB로 교체)
const SAMPLE_GIFTS: Record<string, GiftProduct> = {
    'gift-1': {
        id: 'gift-1',
        name: '프리미엄 한우 세트',
        price: 150000,
        discount_price: 129000,
        image: '/images/gift-hanwoo.jpg',
        description: '1++ 등급 한우 선물세트'
    },
    'gift-2': {
        id: 'gift-2',
        name: '고급 과일 선물세트',
        price: 80000,
        discount_price: 69000,
        image: '/images/gift-fruit.jpg',
        description: '제철 과일 프리미엄 세트'
    },
    'gift-3': {
        id: 'gift-3',
        name: '홍삼 선물세트',
        price: 100000,
        discount_price: 89000,
        image: '/images/gift-ginseng.jpg',
        description: '6년근 홍삼 정과 세트'
    },
    'gift-4': {
        id: 'gift-4',
        name: '명품 수건 세트',
        price: 50000,
        discount_price: 45000,
        image: '/images/gift-towel.jpg',
        description: '호텔식 명품 타월 세트'
    },
    'gift-5': {
        id: 'gift-5',
        name: '참기름 선물세트',
        price: 60000,
        image: '/images/gift-oil.jpg',
        description: '국산 100% 참기름·들기름 세트'
    },
    'gift-6': {
        id: 'gift-6',
        name: '꿀 선물세트',
        price: 70000,
        discount_price: 59000,
        image: '/images/gift-honey.jpg',
        description: '국산 천연 벌꿀 세트'
    },
};

export default function GiftDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.productId as string;
    const product = SAMPLE_GIFTS[productId];

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('성함을 입력해주세요.');
            return;
        }
        if (!phone.trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }
        if (!address.trim()) {
            alert('배송지를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        // TODO: API 연동
        setTimeout(() => {
            alert('답례품 신청이 완료되었습니다. 감사합니다.');
            router.push('/gift');
            setIsSubmitting(false);
        }, 1000);
    };

    if (!product) {
        return (
            <div className="gift-detail-page">
                <div className="not-found">
                    <p>상품을 찾을 수 없습니다.</p>
                    <button onClick={() => router.push('/gift')}>목록으로</button>
                </div>
            </div>
        );
    }

    const finalPrice = product.discount_price || product.price;
    const discountPercent = product.discount_price
        ? Math.round((1 - product.discount_price / product.price) * 100)
        : 0;

    return (
        <div className="gift-detail-page">
            {/* 헤더 */}
            <header className="detail-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>답례품 신청</h1>
            </header>

            {/* 상품 정보 */}
            <div className="product-section">
                <div className="product-image">
                    <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                    <h2 className="product-name">{product.name}</h2>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-price">
                        {discountPercent > 0 && (
                            <>
                                <span className="discount-percent">{discountPercent}%</span>
                                <span className="original-price">{formatPrice(product.price)}원</span>
                            </>
                        )}
                        <span className="final-price">{formatPrice(finalPrice)}원</span>
                    </div>
                </div>
            </div>

            {/* 배송지 입력 */}
            <div className="form-section">
                <h3 className="form-title">배송지 정보</h3>

                <div className="form-group">
                    <label>받으시는 분 <span className="required">*</span></label>
                    <input
                        type="text"
                        placeholder="성함을 입력해주세요"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>연락처 <span className="required">*</span></label>
                    <input
                        type="tel"
                        placeholder="010-0000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>배송지 주소 <span className="required">*</span></label>
                    <input
                        type="text"
                        placeholder="주소를 입력해주세요"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="상세 주소 (동/호수)"
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        className="mt-8"
                    />
                </div>
            </div>

            {/* 안내사항 */}
            <div className="notice-section">
                <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

            {/* 하단 고정 버튼 */}
            <div className="submit-section">
                <div className="price-summary">
                    <span className="label">결제 금액</span>
                    <span className="amount">{formatPrice(finalPrice)}원</span>
                </div>
                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '신청 중...' : '답례품 신청하기'}
                </button>
            </div>
        </div>
    );
}
