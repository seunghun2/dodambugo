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

type SortKey = 'recommend' | 'low' | 'high';

// 구간이 끊기지 않게 이어 붙인다. (5만원권처럼 딱 떨어지는 가격이 어느 구간에도 안 걸려 사라지는 것을 막기 위해)
const PRICE_FILTERS: { label: string; test: (p: number) => boolean }[] = [
    { label: '추천', test: () => true },
    { label: '~1만원', test: (p) => p < 10000 },
    { label: '1~2만원', test: (p) => p >= 10000 && p < 20000 },
    { label: '2~3만원', test: (p) => p >= 20000 && p < 30000 },
    { label: '3~5만원', test: (p) => p >= 30000 && p < 50000 },
    { label: '5만원~', test: (p) => p >= 50000 },
];
const SORT_LABEL: Record<SortKey, string> = { recommend: '상품 추천 순', low: '낮은 가격 순', high: '높은 가격 순' };
const SORT_NEXT: Record<SortKey, SortKey> = { recommend: 'low', low: 'high', high: 'recommend' };

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
    const [query, setQuery] = useState('');
    const [filterIdx, setFilterIdx] = useState(0);
    const [sort, setSort] = useState<SortKey>('recommend');

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

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        const f = PRICE_FILTERS[filterIdx];
        const out = products.filter((p) => f.test(p.sale_price) && (!q || `${p.brand} ${p.name}`.toLowerCase().includes(q)));
        if (sort === 'low') out.sort((a, b) => a.sale_price - b.sale_price);
        if (sort === 'high') out.sort((a, b) => b.sale_price - a.sale_price);
        return out; // recommend = 서버가 내려준 sort_order 그대로
    }, [products, query, filterIdx, sort]);

    return (
        <div className="gift-page">
            {/* 상단 썸네일 (뒤로가기 헤더 없음: 알림톡 링크로 바로 들어오는 첫 화면) */}
            <div className="gift-hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/gift/gift-hero.jpg" alt="" />
                <p className="gift-hero-text">
                    조문해 주신 분들께
                    <br />
                    <b>감사의 마음</b>을
                    <br />
                    답례품으로 전해보세요.
                </p>
            </div>

            {live === false && <div className="gift-test-banner">테스트 모드 — 실제 결제와 발송은 이루어지지 않습니다.</div>}

            <div className="gift-products">
                <div className="gift-tools">
                    <label className="gift-search">
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="상품 검색" aria-label="상품 검색" />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" stroke="#555" strokeWidth="2" />
                            <path d="M20 20L16.5 16.5" stroke="#555" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </label>
                    <button className="gift-sort" onClick={() => setSort(SORT_NEXT[sort])}>
                        {SORT_LABEL[sort]} ⇵
                    </button>
                </div>
                <div className="gift-chips" role="tablist" aria-label="가격대">
                    {PRICE_FILTERS.map((f, i) => (
                        <button key={f.label} role="tab" aria-selected={i === filterIdx} className={`gift-chip ${i === filterIdx ? 'active' : ''}`} onClick={() => setFilterIdx(i)}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="gift-empty">상품을 불러오는 중…</p>
                ) : error ? (
                    <p className="gift-empty">상품을 불러오지 못했습니다. 새로고침해주세요.</p>
                ) : list.length === 0 ? (
                    <p className="gift-empty">조건에 맞는 상품이 없습니다.</p>
                ) : (
                    <div className="product-grid">
                        {list.map((p) => {
                            const discount = p.list_price > p.sale_price ? Math.round((1 - p.sale_price / p.list_price) * 100) : 0;
                            const go = () => router.push(`/view/${bugoId}/gift/${p.id}`);
                            return (
                                <div key={p.id} className="product-card" role="link" tabIndex={0} onClick={go} onKeyDown={(e) => e.key === 'Enter' && go()}>
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
