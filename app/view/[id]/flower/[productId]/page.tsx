'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import './flower-detail.css';

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
}

export default function FlowerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;
    const productId = parseInt(params.productId as string);

    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);

    const product = flowerProducts.find(p => p.id === productId);

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const isUUID = bugoId.includes('-') && bugoId.length > 10;
                let data = null;

                if (isUUID) {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name, funeral_home, room_number').eq('id', bugoId).limit(1);
                    data = result.data?.[0] || null;
                } else {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name, funeral_home, room_number').eq('bugo_number', bugoId).order('created_at', { ascending: false }).limit(1);
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

    if (loading) {
        return (
            <div className="flower-detail-loading">
                <div className="loading-spinner" />
                <p>상품 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

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
                <h1>화환 상세</h1>
                <div style={{ width: 40 }} />
            </header>

            {/* 상품 이미지 */}
            <div className="flower-detail-image">
                <img src={product.image} alt={product.name} />
            </div>

            {/* 상품 정보 */}
            <div className="flower-detail-info">
                <h2 className="flower-detail-name">{product.name}</h2>
                <p className="flower-detail-desc">{product.desc}</p>

                <div className="flower-detail-price">
                    <span className="original-price">{product.originalPrice.toLocaleString()}원</span>
                    <span className="sale-price">{product.price.toLocaleString()}원</span>
                </div>

                {/* 배송 정보 */}
                <div className="flower-detail-delivery">
                    <div className="delivery-item">
                        <span className="material-symbols-outlined">local_shipping</span>
                        <span>빠른 배송</span>
                    </div>
                    <div className="delivery-item">
                        <span className="material-symbols-outlined">location_on</span>
                        <span>{bugo?.funeral_home || '장례식장'} {bugo?.room_number || ''}</span>
                    </div>
                </div>

                {/* 고인 정보 */}
                {bugo && (
                    <div className="flower-detail-bugo">
                        <p>故 {bugo.deceased_name}님께 보내는 화환</p>
                    </div>
                )}
            </div>

            {/* 하단 주문 버튼 */}
            <div className="flower-detail-footer">
                <button
                    className="btn-order"
                    onClick={() => router.push(`/view/${bugoId}/order/${productId}`)}
                >
                    주문하기 · {product.price.toLocaleString()}원
                </button>
            </div>
        </div>
    );
}
