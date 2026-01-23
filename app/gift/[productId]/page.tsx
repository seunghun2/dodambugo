'use client';

import { useParams, useRouter } from 'next/navigation';
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
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

            {/* 상품 정보 테이블 */}
            <div className="info-table-section">
                <table className="info-table">
                    <tbody>
                        <tr>
                            <th>유효기간</th>
                            <td>구매일로부터 30일</td>
                        </tr>
                        <tr>
                            <th>이용안내</th>
                            <td>
                                본 모바일 쿠폰은 유효기간 만료 후 연장 및 환불 대상이 아닙니다.<br />
                                쿠폰은 답례글과 함께 문자로 발송됩니다.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 이용방법 */}
            <div className="usage-section">
                <h3 className="section-title">□ 이용방법</h3>
                <ul className="usage-list">
                    <li>본 상품은 모바일 상품권에 추가해 편리하게 사용하실 수 있습니다.</li>
                    <li>상기 이미지는 연출된 것으로 실제와 다를 수 있습니다.</li>
                    <li>해당 상품은 받으시는 분이 직접 배송지를 입력하여 배송되는 상품입니다. (배송비 무료)</li>
                    <li>동일 상품 교환이 불가한 경우 다른 상품으로 교환이 가능합니다. (차액 발생 시 차액 지불)</li>
                    <li>해당 쿠폰을 무단으로 가공하는 등의 행위는 관계 법령에 위반될 수 있습니다.</li>
                    <li>본 쿠폰은 무상 제공된 상품으로 유효기간 연장 및 환불 대상이 아닙니다.</li>
                </ul>
            </div>

            {/* 하단 고정 버튼 */}
            <div className="submit-section">
                <button
                    className="submit-btn full"
                    onClick={() => router.push(`/gift/${productId}/order`)}
                >
                    구매하기
                </button>
            </div>
        </div>
    );
}
