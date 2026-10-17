'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GIFT_NOTICES, ORDER_INFO } from '@/lib/gift/notices';
import BrandTile from '../BrandTile';
import SellerInfo from '../SellerInfo';
import '../gift.css';
import './gift-detail.css';

interface GiftProduct {
    id: string;
    brand: string;
    name: string;
    list_price: number;
    sale_price: number;
    image_url: string | null;
    badge: string | null;
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** 상품 상세: 유효기간·이용안내·유의사항을 고지하고, [구매하기]로 문구/받는 분/결제 화면으로 넘어간다 */
export default function GiftDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params?.id as string;
    const productId = params?.productId as string;

    const [product, setProduct] = useState<GiftProduct | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
    const [tab, setTab] = useState<'order' | 'notice'>('order');

    useEffect(() => {
        let alive = true;
        fetch('/api/gift/products')
            .then((r) => r.json())
            .then((d) => {
                if (!alive) return;
                const found = (d.products || []).find((p: GiftProduct) => p.id === productId) || null;
                setProduct(found);
                setState(found ? 'ready' : 'missing');
            })
            .catch(() => alive && setState('missing'));
        return () => {
            alive = false;
        };
    }, [productId]);

    const goList = () => router.push(`/view/${bugoId}/gift`);

    if (state !== 'ready' || !product) {
        return (
            <div className="gift-page gd-page">
                <header className="gift-header">
                    <button className="back-btn" onClick={goList} aria-label="뒤로">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1>상품 상세</h1>
                </header>
                <p className="gift-empty">{state === 'loading' ? '불러오는 중…' : '상품을 찾을 수 없습니다.'}</p>
                {state === 'missing' && (
                    <div className="gd-center">
                        <button className="gd-btn" onClick={goList}>
                            목록으로
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const discount = product.list_price > product.sale_price ? Math.round((1 - product.sale_price / product.list_price) * 100) : 0;

    return (
        <div className="gift-page gd-page">
            <header className="gift-header">
                <button className="back-btn" onClick={goList} aria-label="뒤로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>상품 상세</h1>
            </header>

            <div className="gd-visual">
                <BrandTile brand={product.brand} name={product.name} imageUrl={product.image_url} />
                {product.badge && <span className="product-badge">{product.badge}</span>}
            </div>

            <section className="gd-summary">
                <p className="gd-brand">[{product.brand}]</p>
                <h2 className="gd-name">{product.name}</h2>
                <div className="gd-price">
                    {discount > 0 && <span className="gd-discount">{discount}%</span>}
                    <strong>{won(product.sale_price)}</strong>
                    {discount > 0 && <s>{won(product.list_price)}</s>}
                </div>
            </section>

            <div className="gd-tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'order'} className={tab === 'order' ? 'active' : ''} onClick={() => setTab('order')}>
                    주문안내
                </button>
                <button role="tab" aria-selected={tab === 'notice'} className={tab === 'notice' ? 'active' : ''} onClick={() => setTab('notice')}>
                    유의사항
                </button>
            </div>

            <section className="gd-panel">
                {tab === 'order' ? (
                    <dl className="gd-info">
                        {ORDER_INFO.map((r) => (
                            <div key={r.label}>
                                <dt>{r.label}</dt>
                                <dd>{r.text}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <>
                        <p className="gd-notice-title">&lt;모바일 쿠폰 유의사항&gt;</p>
                        <ul className="gd-notice">
                            {GIFT_NOTICES.map((t) => (
                                <li key={t}>{t}</li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <SellerInfo />

            <div className="gd-bottom">
                <button className="gd-buy" onClick={() => router.push(`/view/${bugoId}/thanks/gift?product=${product.id}`)}>
                    구매하기
                </button>
            </div>
        </div>
    );
}
