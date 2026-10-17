'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GIFT_VALID_DAYS } from '@/lib/gift/notices';
import BrandTile from './BrandTile';
import SellerInfo from './SellerInfo';
import './gift.css';

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

/** 답례품 목록 → 상품을 누르면 상품 상세(고지) → 구매하기 → 문구/받는 분/결제 */
export default function GiftListPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params?.id as string;

    const [products, setProducts] = useState<GiftProduct[]>([]);
    const [live, setLive] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [brand, setBrand] = useState('전체');

    useEffect(() => {
        let alive = true;
        fetch('/api/gift/products')
            .then((r) => r.json())
            .then((d) => {
                if (!alive) return;
                setProducts(d.products || []);
                setLive(!!d.live);
            })
            .catch(() => alive && setError(true))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    const brands = useMemo(() => ['전체', ...Array.from(new Set(products.map((p) => p.brand)))], [products]);
    const list = useMemo(() => products.filter((p) => brand === '전체' || p.brand === brand), [products, brand]);

    return (
        <div className="gift-page">
            <header className="gift-header">
                <button className="back-btn" onClick={() => router.back()} aria-label="뒤로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>답례품 선택</h1>
            </header>

            {live === false && <div className="gift-test-banner">테스트 모드 — 실제 결제와 발송은 이루어지지 않습니다.</div>}

            <div className="gift-banner">
                <div className="banner-content">
                    <p className="banner-text">
                        조문해 주신 분들께
                        <br />
                        감사의 마음을 전해보세요.
                    </p>
                </div>
            </div>

            <div className="gift-products">
                {loading ? (
                    <p className="gift-empty">상품을 불러오는 중…</p>
                ) : error ? (
                    <p className="gift-empty">상품을 불러오지 못했습니다. 새로고침해주세요.</p>
                ) : (
                    <>
                        <div className="brand-chips" role="tablist" aria-label="브랜드">
                            {brands.map((b) => (
                                <button key={b} role="tab" aria-selected={b === brand} className={`brand-chip ${b === brand ? 'active' : ''}`} onClick={() => setBrand(b)}>
                                    {b}
                                </button>
                            ))}
                        </div>
                        <div className="product-grid">
                            {list.map((p) => {
                                const discount = p.list_price > p.sale_price ? Math.round((1 - p.sale_price / p.list_price) * 100) : 0;
                                return (
                                    <div key={p.id} className="product-card" role="link" tabIndex={0} onClick={() => router.push(`/view/${bugoId}/gift/${p.id}`)} onKeyDown={(e) => e.key === 'Enter' && router.push(`/view/${bugoId}/gift/${p.id}`)}>
                                        <div className="product-image">
                                            <BrandTile brand={p.brand} name={p.name} imageUrl={p.image_url} />
                                            {p.badge && <span className="product-badge">{p.badge}</span>}
                                        </div>
                                        <div className="product-info">
                                            <p className="product-brand">{p.brand}</p>
                                            <h3 className="product-name">{p.name}</h3>
                                            <div className="product-price">
                                                {discount > 0 && <span className="discount-percent">{discount}%</span>}
                                                <span className="sale">{won(p.sale_price)}</span>
                                                {discount > 0 && <span className="original">{won(p.list_price)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <div className="gift-notice">
                <h3>안내사항</h3>
                <ul>
                    <li>답례품은 받는 분 휴대폰으로 모바일 쿠폰이 문자로 발송됩니다.</li>
                    <li>쿠폰 유효기간은 발송일로부터 {GIFT_VALID_DAYS}일이며, 만료 후 연장 및 환불이 불가합니다.</li>
                    <li>상품별 이용 안내는 상품 상세에서 확인하실 수 있습니다.</li>
                </ul>
            </div>

            <SellerInfo />
        </div>
    );
}
