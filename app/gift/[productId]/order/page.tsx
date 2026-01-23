'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import './order.css';

interface GiftProduct {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    image: string;
    description?: string;
}

interface Recipient {
    id: string;
    phone: string;
}

// 샘플 답례품 데이터
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

// 답례글 탭 종류
const MESSAGE_TABS = [
    { id: 'general', label: '일반' },
    { id: 'thanks', label: '감사' },
    { id: 'formal', label: '정중' },
];

// 예시 답례글
const SAMPLE_MESSAGES: Record<string, string> = {
    general: '바쁘신 중에도 조문해 주셔서 감사합니다.\n고인의 명복을 빌어주신 마음에 깊이 감사드립니다.',
    thanks: '먼 길 마다않고 찾아주셔서 진심으로 감사드립니다.\n따뜻한 위로의 말씀, 잊지 않겠습니다.',
    formal: '삼가 고인의 명복을 빌어주신 데 대하여\n유가족을 대표하여 깊은 감사의 말씀을 드립니다.',
};

export default function GiftOrderPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.productId as string;
    const product = SAMPLE_GIFTS[productId];

    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: '1', phone: '' }
    ]);
    const [selectedTab, setSelectedTab] = useState('general');
    const [message, setMessage] = useState(SAMPLE_MESSAGES['general']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    const addRecipient = () => {
        const newId = String(recipients.length + 1);
        setRecipients([...recipients, { id: newId, phone: '' }]);
    };

    const removeRecipient = (id: string) => {
        if (recipients.length > 1) {
            setRecipients(recipients.filter(r => r.id !== id));
        }
    };

    const updateRecipient = (id: string, phone: string) => {
        setRecipients(recipients.map(r =>
            r.id === id ? { ...r, phone } : r
        ));
    };

    const handleTabChange = (tabId: string) => {
        setSelectedTab(tabId);
        setMessage(SAMPLE_MESSAGES[tabId]);
    };

    const handleSubmit = async () => {
        const validRecipients = recipients.filter(r => r.phone.trim());
        if (validRecipients.length === 0) {
            alert('받는 분의 연락처를 입력해주세요.');
            return;
        }
        if (!message.trim()) {
            alert('답례글을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        // TODO: API 연동
        setTimeout(() => {
            alert('답례품 결제가 완료되었습니다.');
            router.push('/gift');
            setIsSubmitting(false);
        }, 1000);
    };

    if (!product) {
        return (
            <div className="gift-order-page">
                <div className="not-found">
                    <p>상품을 찾을 수 없습니다.</p>
                    <button onClick={() => router.push('/gift')}>목록으로</button>
                </div>
            </div>
        );
    }

    const finalPrice = product.discount_price || product.price;
    const totalPrice = finalPrice * recipients.length;

    return (
        <div className="gift-order-page">
            {/* 헤더 */}
            <header className="order-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>답례품 주문</h1>
                <div className="spacer"></div>
            </header>

            {/* 주문상품정보 */}
            <div className="section product-info-section">
                <h3 className="section-title">주문상품정보</h3>
                <div className="product-card">
                    <div className="product-image">
                        <img src={product.image} alt={product.name} />
                    </div>
                    <div className="product-details">
                        <p className="product-name">{product.name}</p>
                        <p className="product-price">{formatPrice(finalPrice)}원</p>
                    </div>
                </div>
            </div>

            {/* 답례품 받는분 */}
            <div className="section recipients-section">
                <h3 className="section-title">답례품 받는분</h3>

                {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="recipient-row">
                        <div className="recipient-input">
                            <span className="recipient-label">{index + 1}. 연락처</span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="010-0000-0000"
                                value={recipient.phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9-]/g, '');
                                    updateRecipient(recipient.id, value);
                                }}
                            />
                        </div>
                        <button
                            className="remove-btn"
                            onClick={() => removeRecipient(recipient.id)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                ))}

                <button className="add-recipient-btn gray" onClick={addRecipient}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="#666666" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    연락처 추가하기
                </button>
            </div>

            {/* 답례글 발송 안내 */}
            <div className="section notice-section">
                <div className="notice-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
                        <path d="M12 8V12M12 16H12.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <p>답례글 발송 안내: 결제 완료 후 입력하신 연락처로 답례글과 함께 답례품 수령 링크가 발송됩니다.</p>
                </div>
            </div>

            {/* 답례글 작성 */}
            <div className="section message-section">
                <h3 className="section-title">답례글 작성</h3>

                {/* 탭 */}
                <div className="message-tabs">
                    {MESSAGE_TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${selectedTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 텍스트 영역 */}
                <textarea
                    className="message-input"
                    placeholder="답례글을 입력해주세요"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                />
            </div>

            {/* 하단 고정 버튼 */}
            <div className="submit-section">
                <div className="price-summary">
                    <span className="label">총 결제 금액 ({recipients.length}건)</span>
                    <span className="amount">{formatPrice(totalPrice)}원</span>
                </div>
                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '결제 중...' : '답례품 결제하기'}
                </button>
            </div>
        </div>
    );
}
