'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import './flower-detail.css';

// 상품 데이터
const flowerProducts = [
    {
        id: 1,
        name: '프리미엄형 화환',
        subtitle: '복도에 비치되는 고급근조 3단 특대 형태',
        price: 120000,
        images: ['/images/flower-wreath.png'],
        origin: '생화 (국화, 백합, 글라디올라스 등): 중국산, 베트남산\n리본 및 부자재: 국산',
        usage: '부의, 추모, 추도, 장례식장, 영결식장등 삼가 고인의 명복을 비는 장소에 쓰이는 상품',
        features: '이미지의 포인트는 달라질 수 있으며 계절에 맞는 소재로 변경될 수 있습니다. 고인에 대한 보내는 분의 애도의 마음을 담아 정성껏 제작 배송해 드립니다.',
    },
    {
        id: 2,
        name: '대통령 화환',
        subtitle: '복도에 비치되는 고급근조 3단 특대 형태',
        price: 150000,
        images: ['/images/flower-wreath.png'],
        origin: '생화 (국화, 백합, 글라디올라스 등): 중국산, 베트남산\n리본 및 부자재: 국산',
        usage: '부의, 추모, 추도, 장례식장, 영결식장등 삼가 고인의 명복을 비는 장소에 쓰이는 상품',
        features: '국가급 품격을 갖춘 최고급 화환입니다. 대형 근조화환으로 정성을 표현하세요.',
    },
    {
        id: 3,
        name: '스탠다드 화환',
        subtitle: '복도에 비치되는 표준형 3단 화환',
        price: 100000,
        images: ['/images/flower-wreath.png'],
        origin: '생화 (국화, 백합, 글라디올라스 등): 중국산, 베트남산\n리본 및 부자재: 국산',
        usage: '부의, 추모, 추도, 장례식장, 영결식장등 삼가 고인의 명복을 비는 장소에 쓰이는 상품',
        features: '가장 기본적이면서도 품격 있는 표준형 화환입니다.',
    },
    {
        id: 4,
        name: '베이직 화환',
        subtitle: '간결하면서도 정성이 담긴 기본형 화환',
        price: 80000,
        images: ['/images/flower-wreath.png'],
        origin: '생화 (국화, 백합 등): 중국산, 베트남산\n리본 및 부자재: 국산',
        usage: '부의, 추모, 추도, 장례식장등 고인의 명복을 비는 장소에 쓰이는 상품',
        features: '깔끔하고 정갈한 디자인의 기본형 화환입니다.',
    },
    {
        id: 5,
        name: '고급 근조 화환',
        subtitle: '최고급 생화로 제작되는 프리미엄 화환',
        price: 170000,
        images: ['/images/flower-wreath.png'],
        origin: '생화 (국화, 백합, 글라디올라스, 카네이션 등): 국산, 수입산\n리본 및 부자재: 국산',
        usage: '부의, 추모, 추도, 장례식장, 영결식장등 삼가 고인의 명복을 비는 장소에 쓰이는 상품',
        features: '최고급 생화만을 사용하여 제작하는 프리미엄 근조 화환입니다.',
    },
];

export default function FlowerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;
    const productId = parseInt(params.productId as string);
    const [selectedImage, setSelectedImage] = useState(0);

    const product = flowerProducts.find(p => p.id === productId);

    if (!product) {
        return (
            <div className="flower-detail-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <button onClick={() => router.back()}>돌아가기</button>
            </div>
        );
    }

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
                <p className="product-subtitle">{product.subtitle}</p>
            </div>

            {/* 이미지 */}
            <div className="product-image-section">
                <div className="main-image">
                    <img src={product.images[selectedImage]} alt={product.name} />
                </div>
                {product.images.length > 1 && (
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
                    <p className="info-content">{product.origin}</p>
                </div>

                <div className="info-item">
                    <span className="info-label">[ 상품용도 ]</span>
                    <p className="info-content">{product.usage}</p>
                </div>

                <div className="info-item">
                    <span className="info-label">[ 상품특징 ]</span>
                    <p className="info-content">{product.features}</p>
                </div>
            </div>

            {/* 배송안내 */}
            <div className="delivery-section">
                <h3 className="section-title">배송안내</h3>
                <p className="delivery-notice">* 계절 및 배송 지역에 따라 실제 배송 상품은 이미지와 다소 차이가 있을 수 있습니다.</p>

                <div className="delivery-item">
                    <span className="delivery-label">1) 배송비용</span>
                    <p>기본적인 배송비는 무료 (단, 지역에 따라 별도 배송비가 추가될 수 있습니다.)</p>
                </div>

                <div className="delivery-item">
                    <span className="delivery-label">2) 배송시간</span>
                    <p>상품배송은 전국 어디든 4시간 이내 배송가능</p>
                    <p>주말 및 교통상황에 따라 일부 지연될 수 있습니다.</p>
                </div>

                <div className="delivery-item">
                    <span className="delivery-label">3) 배송가능시간</span>
                    <p>오전 8시 ~ 오후 6시 주문건에 한하여 당일 배송가능합니다.</p>
                    <p>오후 6시 이후 주문 건은 다음날 오후 1시 전으로 배송해드립니다.</p>
                </div>

                <div className="delivery-item">
                    <span className="delivery-label">4) 영업시간</span>
                    <p>오전 8시 ~ 오후 8시</p>
                    <p>온라인 주문은 24시간 가능하며, 전화상담은 영업시간에만 가능</p>
                </div>
            </div>

            {/* 교환/환불 안내 */}
            <div className="refund-section">
                <h3 className="section-title">교환/환불 안내</h3>
                <p className="refund-notice">* 교환 및 환불은 인터넷 쇼핑몰 상에서는 불가능 하므로 교환환불건은 고객센터 1877-4133으로 전화 요청하셔야합니다. *</p>

                <p className="refund-desc">교환과 환불은 아래와 같은 요인이 발생했을 시 100%가능합니다.</p>

                <div className="refund-item">
                    <span className="refund-label">1) 교환이 가능한 경우</span>
                    <p>배송된 상품이 파손되었거나 오염되었을 경우.</p>
                    <p>배송된 상품이 주문한 내용과 다를 경우.</p>
                    <p>쇼핑몰이 제공한 정보와 다를 경우.</p>
                </div>

                <div className="refund-item">
                    <span className="refund-label">2) 환불이 가능한 경우</span>
                    <p>입금완료 후 주문접수 전 주문을 취소한 경우.</p>
                    <p>상품이 품절되었거나 기타 사유로 인해 배송이 불가능한 경우.</p>
                </div>

                <div className="refund-item">
                    <span className="refund-label">3) 교환 및 환불 불가</span>
                    <p>생화 상품의 경우 한번 잘리면 다시 사용할 수 없는 꽃의 특성상 제작이 완료된 상품은 고객님의 변심에 의한 교환 및 환불이 불가능합니다.</p>
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
