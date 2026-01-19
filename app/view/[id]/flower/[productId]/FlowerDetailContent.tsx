'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import './flower-detail.css';

interface FlowerProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    discount_price: number | null;
    images: string[];
}

interface FlowerDetailContentProps {
    initialProduct: FlowerProduct;
    bugoId: string;
}

export default function FlowerDetailContent({ initialProduct, bugoId }: FlowerDetailContentProps) {
    const router = useRouter();
    const product = initialProduct;
    const productId = product.id;
    const [selectedImage, setSelectedImage] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

    // 상품 상세 정보 (기본값 사용)
    const origin = '• 국산: 장미, 국화, 카네이션, 백합, 튤립, 글라디올러스 등\n• 수입산: 중국, 대만, 베트남, 일본, 콜롬비아, 네덜란드 등\n• 리본 및 부자재: 국산';
    const usage = '장례식장, 영결식, 추모식 등 고인의 명복을 기원하는 자리에 보내드리는 조화입니다.';
    const features = product.description || '정성을 담아 제작되는 화환입니다.';

    // 터치 스와이프 로직

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;
        const imageCount = product.images?.length || 1;

        if (isLeftSwipe) {
            // 다음 사진 (무한 루프)
            setSlideDirection('left');
            setSelectedImage(prev => (prev + 1) % imageCount);
        } else if (isRightSwipe) {
            // 이전 사진 (무한 루프)
            setSlideDirection('right');
            setSelectedImage(prev => (prev - 1 + imageCount) % imageCount);
        }

        // 초기화
        setTouchStart(0);
        setTouchEnd(0);

        // 애니메이션 후 방향 초기화
        setTimeout(() => setSlideDirection(null), 300);
    };

    return (
        <div className="flower-detail-page">
            {/* 헤더 */}
            <header className="flower-detail-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1>상세보기</h1>
                <div style={{ width: 40 }} />
            </header>

            {/* 상품명 */}
            <div className="product-title-section">
                <h2 className="product-name">{product.name}</h2>
                <p className="product-subtitle">{product.description}</p>
            </div>

            {/* 이미지 */}
            <div className="product-image-section">
                <div
                    className="main-image"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <Image
                        src={product.images?.[selectedImage] || '/images/flower-wreath.png'}
                        alt={product.name}
                        width={400}
                        height={500}
                        className={slideDirection ? `slide-${slideDirection}` : ''}
                        priority
                        style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                    />
                </div>
                {product.images && product.images.length > 1 && (
                    <div className="image-thumbnails">
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                                onClick={() => setSelectedImage(idx)}
                            >
                                <img src={img} alt="" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 상품설명 */}
            <div className="product-info-section">
                <h3 className="section-title">상품설명</h3>

                <div className="info-item">
                    <span className="info-label">[ 원산지 ]</span>
                    <p className="info-content">{origin}</p>
                </div>

                <div className="info-item">
                    <span className="info-label">[ 상품용도 ]</span>
                    <p className="info-content">{usage}</p>
                </div>

                <div className="info-item">
                    <span className="info-label">[ 상품특징 ]</span>
                    <p className="info-content">{features}</p>
                </div>
            </div>

            {/* 배송안내 */}
            <div className="delivery-section">
                <h3 className="section-title">배송안내</h3>
                <p className="delivery-notice">* 계절, 지역 상황에 따라 배송 상품이 이미지와 다소 다를 수 있습니다.</p>

                <div className="delivery-item">
                    <span className="delivery-label">1) 배송비</span>
                    <p>전국 무료배송</p>
                    <p>(도서산간 지역은 추가 비용이 발생할 수 있습니다)</p>
                </div>

                <div className="delivery-item">
                    <span className="delivery-label">2) 배송 소요시간</span>
                    <p>주문 후 전국 어디든 4시간 내 도착</p>
                    <p>교통 및 기상 상황에 따라 다소 지연될 수 있습니다.</p>
                </div>

                <div className="delivery-item">
                    <span className="delivery-label">3) 당일배송 안내</span>
                    <p>오전 8시 ~ 오후 6시 주문 시 당일 배송됩니다.</p>
                    <p>이후 주문 건은 익일 오후 1시 전 배송됩니다.</p>
                </div>

                <div className="delivery-item">
                    <span className="delivery-label">4) 고객센터</span>
                    <p>운영시간: 오전 8시 ~ 오후 8시</p>
                    <p>온라인 주문은 24시간 가능합니다.</p>
                </div>
            </div>

            {/* 교환/환불 안내 */}
            <div className="refund-section">
                <h3 className="section-title">교환/환불 안내</h3>
                <p className="refund-notice">* 온라인에서는 교환/환불 접수가 불가하며, 고객센터로 문의해주세요. *</p>

                <p className="refund-desc">아래의 경우 교환 및 환불이 가능합니다.</p>

                <div className="refund-item">
                    <span className="refund-label">1) 교환 가능</span>
                    <p>• 배송 중 상품이 파손 또는 훼손된 경우</p>
                    <p>• 주문 내용과 다른 상품이 배송된 경우</p>
                </div>

                <div className="refund-item">
                    <span className="refund-label">2) 환불 가능</span>
                    <p>• 결제 후 제작 시작 전 취소 요청 시</p>
                    <p>• 품절 또는 배송 불가 지역인 경우</p>
                </div>

                <div className="refund-item">
                    <span className="refund-label">3) 교환/환불 불가</span>
                    <p>• 생화는 제작 후 재사용이 불가하여, 제작 완료 후 단순 변심에 의한 교환/환불이 어렵습니다.</p>
                </div>

                <div className="refund-item">
                    <span className="refund-label">4) 이미지 관련 안내</span>
                    <p>• 화분, 바구니, 포장지 등 부속품은 시즌 및 지역에 따라 이미지와 다를 수 있습니다.</p>
                </div>
            </div>

            {/* 하단 주문 버튼 */}
            <div className="flower-detail-footer">
                <button
                    className="btn-order"
                    onClick={() => router.push(`/view/${bugoId}/order/${productId}`)}
                >
                    주문하기
                </button>
            </div>
        </div>
    );
}
