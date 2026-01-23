'use client';

import { useRouter } from 'next/navigation';
import styles from './gift.module.css';

interface GiftProduct {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    image: string;
    description?: string;
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
    const router = useRouter();

    const handleSelectProduct = (product: GiftProduct) => {
        router.push(`/gift/${product.id}`);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    return (
        <div className={styles.giftPage}>
            {/* 상단 배너 */}
            <div className={styles.giftBanner}>
                <div className={styles.bannerContent}>
                    <p className={styles.bannerText}>
                        조문해 주신 분들께<br />
                        감사의 마음을 전해보세요.
                    </p>
                </div>
                <div className={styles.giftIcon}>
                    <img src="/images/gift-banner-icon.png" alt="선물" />
                </div>
            </div>
            <div className={styles.giftProducts}>
                {/* 상품 그리드 */}
                <div className={styles.productGrid}>
                    {SAMPLE_GIFTS.map((product) => (
                        <div
                            key={product.id}
                            className={styles.productCard}
                            onClick={() => handleSelectProduct(product)}
                        >
                            <div className={styles.productImage}>
                                <img src={product.image} alt={product.name} />
                                {product.discount_price && (
                                    <span className={styles.discountBadge}>
                                        {Math.round((1 - product.discount_price / product.price) * 100)}%
                                    </span>
                                )}
                            </div>
                            <div className={styles.productInfo}>
                                <h3 className={styles.productName}>{product.name}</h3>
                                <p className={styles.productDesc}>{product.description}</p>
                                <div className={styles.productPrice}>
                                    {product.discount_price ? (
                                        <>
                                            <span className={styles.original}>{formatPrice(product.price)}원</span>
                                            <span className={styles.sale}>{formatPrice(product.discount_price)}원</span>
                                        </>
                                    ) : (
                                        <span className={styles.sale}>{formatPrice(product.price)}원</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 안내 */}
            <div className={styles.giftNotice}>
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
