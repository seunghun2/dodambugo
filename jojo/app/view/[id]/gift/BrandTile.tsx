'use client';

import { BRAND_COLORS } from '../thanks/gift/types';

/** 상품 이미지가 아직 없을 때 브랜드 색 타일 (브랜드 로고/이미지는 권리 확인 전까지 쓰지 않음) */
export default function BrandTile({ brand, name, imageUrl }: { brand: string; name: string; imageUrl?: string | null }) {
    if (imageUrl) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={imageUrl} alt={name} />;
    }
    return (
        <div className="brand-tile" style={{ background: BRAND_COLORS[brand] || '#777' }}>
            <span>{brand}</span>
        </div>
    );
}
