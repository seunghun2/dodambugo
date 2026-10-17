'use client';

import { useMemo, useState } from 'react';
import { BRAND_COLORS, won, type GiftProduct } from './types';

type SortKey = 'recommend' | 'low' | 'high';

const PRICE_FILTERS: { label: string; test: (p: number) => boolean }[] = [
    { label: '전체', test: () => true },
    { label: '~1만원', test: (p) => p < 10000 },
    { label: '1~3만원', test: (p) => p >= 10000 && p < 30000 },
    { label: '3~5만원', test: (p) => p >= 30000 && p < 50000 },
    { label: '5만원~', test: (p) => p >= 50000 },
];

const SORT_LABEL: Record<SortKey, string> = { recommend: '상품 추천 순', low: '낮은 가격 순', high: '높은 가격 순' };
const SORT_NEXT: Record<SortKey, SortKey> = { recommend: 'low', low: 'high', high: 'recommend' };

/** 상품 이미지가 아직 없을 때 브랜드 색 타일로 대체 (브랜드 로고/이미지는 권리 확인 전까지 쓰지 않음) */
export function ProductThumb({ product, size = 'md' }: { product: GiftProduct; size?: 'sm' | 'md' }) {
    if (product.image_url) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img className={`gs-thumb gs-thumb-${size}`} src={product.image_url} alt={product.name} />;
    }
    return (
        <div className={`gs-thumb gs-thumb-${size} gs-thumb-fallback`} style={{ background: BRAND_COLORS[product.brand] || '#777' }}>
            <span>{product.brand}</span>
        </div>
    );
}

export default function ProductPicker({
    products,
    selectedId,
    onSelect,
    onClose,
}: {
    products: GiftProduct[];
    selectedId: string | null;
    onSelect: (p: GiftProduct) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState('');
    const [filterIdx, setFilterIdx] = useState(0);
    const [sort, setSort] = useState<SortKey>('recommend');

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        const f = PRICE_FILTERS[filterIdx];
        const out = products.filter(
            (p) => f.test(p.sale_price) && (!q || `${p.brand} ${p.name}`.toLowerCase().includes(q))
        );
        if (sort === 'low') out.sort((a, b) => a.sale_price - b.sale_price);
        if (sort === 'high') out.sort((a, b) => b.sale_price - a.sale_price);
        return out; // recommend = 서버가 내려준 sort_order 그대로
    }, [products, query, filterIdx, sort]);

    return (
        <div className="gs-overlay gs-fullscreen" role="dialog" aria-modal="true" aria-label="답례품 선택">
            <header className="gs-picker-header">
                <button className="gs-icon-btn" onClick={onClose} aria-label="뒤로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h2>선물하기</h2>
                <span className="gs-header-spacer" />
            </header>

            <div className="gs-picker-tools">
                <div className="gs-search">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="상품 검색"
                        aria-label="상품 검색"
                    />
                </div>
                <button className="gs-sort" onClick={() => setSort(SORT_NEXT[sort])}>
                    {SORT_LABEL[sort]} ⇵
                </button>
            </div>
            <div className="gs-chips gs-chips-scroll">
                {PRICE_FILTERS.map((f, i) => (
                    <button key={f.label} className={`gs-chip ${i === filterIdx ? 'active' : ''}`} onClick={() => setFilterIdx(i)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {list.length === 0 ? (
                <p className="gs-empty">조건에 맞는 상품이 없습니다.</p>
            ) : (
                <ul className="gs-grid">
                    {list.map((p) => {
                        const discount = p.list_price > p.sale_price ? Math.round((1 - p.sale_price / p.list_price) * 100) : 0;
                        return (
                            <li key={p.id}>
                                <button className={`gs-card ${p.id === selectedId ? 'selected' : ''}`} onClick={() => onSelect(p)}>
                                    <div className="gs-card-img">
                                        <ProductThumb product={p} />
                                        {p.badge && <span className="gs-badge">{p.badge}</span>}
                                    </div>
                                    <p className="gs-card-name">
                                        [{p.brand}] {p.name}
                                    </p>
                                    <div className="gs-card-price">
                                        {discount > 0 && <s>{won(p.list_price)}</s>}
                                        <div>
                                            {discount > 0 && <em>{discount}%</em>}
                                            <strong>{p.sale_price.toLocaleString('ko-KR')}</strong>원
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
