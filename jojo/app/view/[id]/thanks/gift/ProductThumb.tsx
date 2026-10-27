'use client';

import { BRAND_COLORS, type GiftProduct } from './types';

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
