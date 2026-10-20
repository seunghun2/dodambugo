'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/lib/supabase';
import { BRAND_COLORS } from '@/app/view/[id]/thanks/gift/types';
import './gift-editor.css';

interface GiftProductAdmin {
    id: string;
    brand: string;
    name: string;
    category: string;
    list_price: number;
    sale_price: number;
    image_url: string | null;
    badge: string | null;
    daou_sheet: string | null;
    daou_goods_code: string | null;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

const BADGE_PRESETS = ['자주선택', '부담없는', '든든한', '정성가득', '추천', '인기', 'BEST'];

const BRAND_PRESETS = [
    '스타벅스',
    '투썸플레이스',
    '파리바게뜨',
    '뚜레쥬르',
    '던킨도너츠',
    '배스킨라빈스',
    '설빙',
    '정관장',
    '신세계이마트',
    '올리브영',
    '다이소',
    '해피콘',
];

const CATEGORY_PRESETS = ['커피/음료', '베이커리/케이크', '상품권/금액권', '디저트/간식', '건강/선물세트', '기타'];

const PRICE_FILTERS: { label: string; test: (p: number) => boolean }[] = [
    { label: '추천 (전체)', test: () => true },
    { label: '~1만원', test: (p) => p < 10000 },
    { label: '1~2만원', test: (p) => p >= 10000 && p < 20000 },
    { label: '2~3만원', test: (p) => p >= 20000 && p < 30000 },
    { label: '3~5만원', test: (p) => p >= 30000 && p < 50000 },
    { label: '5만원~', test: (p) => p >= 50000 },
];

const emptyProduct: Partial<GiftProductAdmin> = {
    brand: '스타벅스',
    name: '',
    category: '커피/음료',
    list_price: 0,
    sale_price: 0,
    image_url: null,
    badge: null,
    daou_sheet: '물품교환형',
    daou_goods_code: '',
    sort_order: 10,
    is_active: true,
};

export default function AdminGiftProductsPage() {
    const [products, setProducts] = useState<GiftProductAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<GiftProductAdmin | null>(null);
    const [editForm, setEditForm] = useState<Partial<GiftProductAdmin>>(emptyProduct);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 목록 뷰 / 필터 상태
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [brandFilter, setBrandFilter] = useState('전체');
    const [statusFilter, setStatusFilter] = useState('전체');
    const [priceFilterIdx, setPriceFilterIdx] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkDiscountPct, setBulkDiscountPct] = useState<number>(5);
    const [applyingDiscount, setApplyingDiscount] = useState(false);

    // 드래그 앤 드롭 상태
    const [dragId, setDragId] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/gift-products', { cache: 'no-store' });
            const data = await res.json();
            const list: GiftProductAdmin[] = data.products || [];
            setProducts(list);
            if (selectedProduct) {
                const updated = list.find((p) => p.id === selectedProduct.id);
                if (updated) {
                    setSelectedProduct(updated);
                    setEditForm(updated);
                }
            }
        } catch (err) {
            console.error('Error fetching gift products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allBrands = useMemo(() => {
        const s = new Set<string>();
        products.forEach((p) => p.brand && s.add(p.brand));
        return Array.from(s);
    }, [products]);

    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const priceTest = PRICE_FILTERS[priceFilterIdx]?.test || (() => true);

        return products.filter((p) => {
            if (brandFilter !== '전체' && p.brand !== brandFilter) return false;
            if (statusFilter === '노출' && !p.is_active) return false;
            if (statusFilter === '숨김' && p.is_active) return false;
            if (statusFilter === '뱃지있음' && !p.badge) return false;
            if (!priceTest(p.sale_price)) return false;
            if (q && !`${p.brand} ${p.name} ${p.badge || ''} ${p.category}`.toLowerCase().includes(q)) {
                return false;
            }
            return true;
        });
    }, [products, brandFilter, statusFilter, priceFilterIdx, searchQuery]);

    const handleSelectProduct = (product: GiftProductAdmin) => {
        setSelectedProduct(product);
        setEditForm(product);
        setIsCreating(false);
    };

    const handleCreateNew = () => {
        setSelectedProduct(null);
        setEditForm({
            ...emptyProduct,
            sort_order: 1,
        });
        setIsCreating(true);
    };

    // 노출/숨김 원클릭 토글 (넣다뺐다)
    const handleToggleActive = async (product: GiftProductAdmin, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextActive = !product.is_active;

        setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, is_active: nextActive } : item)));
        if (selectedProduct?.id === product.id) {
            setSelectedProduct({ ...product, is_active: nextActive });
            setEditForm((prev) => ({ ...prev, is_active: nextActive }));
        }

        await fetch('/api/admin/gift-products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: product.id, is_active: nextActive }),
        });
    };

    // 인라인 뱃지 변경
    const handleQuickBadgeChange = async (product: GiftProductAdmin, nextBadge: string | null) => {
        setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, badge: nextBadge } : item)));
        if (selectedProduct?.id === product.id) {
            setSelectedProduct({ ...product, badge: nextBadge });
            setEditForm((prev) => ({ ...prev, badge: nextBadge }));
        }

        await fetch('/api/admin/gift-products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: product.id, badge: nextBadge }),
        });
    };

    // 전체 순서 일괄 저장
    const commitOrder = async (ordered: GiftProductAdmin[]) => {
        const reindexed = ordered.map((item, idx) => ({
            ...item,
            sort_order: (idx + 1) * 10,
        }));
        setProducts(reindexed);

        if (selectedProduct) {
            const found = reindexed.find((x) => x.id === selectedProduct.id);
            if (found) {
                setSelectedProduct(found);
                setEditForm((prev) => ({ ...prev, sort_order: found.sort_order }));
            }
        }

        await fetch('/api/admin/gift-products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bulk: reindexed.map((x) => ({ id: x.id, sort_order: x.sort_order })),
            }),
        });
    };

    // 위/아래 위치 이동
    const handleMove = async (productId: string, dir: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        const visIdx = filteredProducts.findIndex((p) => p.id === productId);
        const targetVisIdx = dir === 'up' ? visIdx - 1 : visIdx + 1;
        if (targetVisIdx < 0 || targetVisIdx >= filteredProducts.length) return;

        const targetId = filteredProducts[targetVisIdx].id;
        const srcMasterIdx = products.findIndex((p) => p.id === productId);
        const dstMasterIdx = products.findIndex((p) => p.id === targetId);
        if (srcMasterIdx < 0 || dstMasterIdx < 0) return;

        const next = [...products];
        const tmp = next[srcMasterIdx];
        next[srcMasterIdx] = next[dstMasterIdx];
        next[dstMasterIdx] = tmp;

        await commitOrder(next);
    };

    // 순번 직접 입력 이동 (1-based)
    const handleRankJump = async (productId: string, rankOneBased: number) => {
        const srcIdx = products.findIndex((p) => p.id === productId);
        if (srcIdx < 0) return;
        const dstIdx = Math.max(0, Math.min(products.length - 1, rankOneBased - 1));
        if (srcIdx === dstIdx) return;

        const next = [...products];
        const [moved] = next.splice(srcIdx, 1);
        next.splice(dstIdx, 0, moved);
        await commitOrder(next);
    };

    // 드래그 앤 드롭 배치
    const handleDrop = async (targetId: string) => {
        const srcId = dragId;
        setDragId(null);
        if (!srcId || srcId === targetId) return;

        const srcIdx = products.findIndex((p) => p.id === srcId);
        const dstIdx = products.findIndex((p) => p.id === targetId);
        if (srcIdx < 0 || dstIdx < 0) return;

        const next = [...products];
        const [moved] = next.splice(srcIdx, 1);
        next.splice(dstIdx, 0, moved);
        await commitOrder(next);
    };

    const handleSave = async () => {
        const brand = (editForm.brand || '').trim();
        const name = (editForm.name || '').trim();
        const salePrice = Number(editForm.sale_price) || 0;
        const listPrice = Number(editForm.list_price) || salePrice;

        if (!brand || !name || !salePrice) {
            alert('브랜드, 상품명, 판매가는 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            if (isCreating) {
                const res = await fetch('/api/admin/gift-products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        brand,
                        name,
                        category: editForm.category || '커피/음료',
                        list_price: listPrice,
                        sale_price: salePrice,
                        image_url: editForm.image_url || null,
                        badge: editForm.badge || null,
                        daou_sheet: editForm.daou_sheet || null,
                        daou_goods_code: editForm.daou_goods_code || null,
                        sort_order: editForm.sort_order ?? 10,
                        is_active: editForm.is_active ?? true,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || '등록 실패');
                alert('상품이 등록되었습니다.');
            } else if (selectedProduct) {
                const res = await fetch('/api/admin/gift-products', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: selectedProduct.id,
                        brand,
                        name,
                        category: editForm.category || '커피/음료',
                        list_price: listPrice,
                        sale_price: salePrice,
                        image_url: editForm.image_url || null,
                        badge: editForm.badge || null,
                        daou_sheet: editForm.daou_sheet || null,
                        daou_goods_code: editForm.daou_goods_code || null,
                        sort_order: editForm.sort_order ?? selectedProduct.sort_order,
                        is_active: editForm.is_active ?? true,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || '수정 실패');
                alert('상품이 수정되었습니다.');
            }

            await fetchProducts();
            setIsCreating(false);
            setSelectedProduct(null);
            setEditForm(emptyProduct);
        } catch (err: any) {
            alert('저장 중 오류: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        if (!confirm('정말 삭제하시겠습니까?')) return;

        const res = await fetch(`/api/admin/gift-products?id=${encodeURIComponent(selectedProduct.id)}`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            alert('삭제 오류: ' + (d.error || '알 수 없는 오류'));
        } else {
            alert('삭제되었습니다.');
            setSelectedProduct(null);
            setEditForm(emptyProduct);
            fetchProducts();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const file = files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `gift_${Date.now()}.${fileExt}`;
            const filePath = `gift-products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
            if (urlData?.publicUrl) {
                setEditForm({ ...editForm, image_url: urlData.publicUrl });
            }
        } catch (err: any) {
            alert('이미지 업로드 실패: ' + (err.message || '알 수 없는 오류'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price || 0);

    const calcDiscountPct = (listPrice?: number, salePrice?: number) => {
        const l = Number(listPrice) || 0;
        const s = Number(salePrice) || 0;
        if (l <= 0 || s <= 0 || l <= s) return 0;
        return Math.round((1 - s / l) * 100);
    };

    const calcSaleFromDiscount = (listPrice: number, pct: number) => {
        const l = Math.max(0, Number(listPrice) || 0);
        const p = Math.max(0, Math.min(90, Number(pct) || 0));
        if (l <= 0 || p <= 0) return l;
        return Math.max(10, Math.round((l * (100 - p)) / 1000) * 10);
    };

    const handleApplyBulkDiscount = async (pctOverride?: number) => {
        const pct = Math.max(0, Math.min(90, Number(pctOverride ?? bulkDiscountPct) || 0));
        const targetLabel = brandFilter === '전체' ? `전체 상품(${products.length}개)` : `[${brandFilter}] 브랜드 상품`;
        if (!confirm(`${targetLabel}의 판매가를 정가 대비 ${pct}% 할인으로 일괄 변경하시겠습니까?`)) return;

        setApplyingDiscount(true);
        try {
            const res = await fetch('/api/admin/gift-products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bulkDiscountPercent: pct, brand: brandFilter }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '일괄 변경 실패');
            setBulkDiscountPct(pct);
            await fetchProducts();
            alert(`${data.count || 0}개 상품에 ${pct}% 고객 할인율이 적용되었습니다.`);
        } catch (err: any) {
            alert('할인율 적용 오류: ' + (err.message || '오류'));
        } finally {
            setApplyingDiscount(false);
        }
    };

    return (
        <div className="admin-pc">
            <AdminSidebar />

            {/* 메인 콘텐츠 (/admin/products 100% 동일 레이아웃) */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>답례품 관리</h1>
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="total-count">총 {filteredProducts.length}건</span>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '13px',
                            }}
                        >
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                                고객할인율({brandFilter === '전체' ? '전체' : brandFilter}):
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={90}
                                value={bulkDiscountPct}
                                onChange={(e) => setBulkDiscountPct(Math.max(0, Math.min(90, parseInt(e.target.value, 10) || 0)))}
                                style={{
                                    width: '52px',
                                    padding: '4px 6px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    textAlign: 'right',
                                    fontWeight: 700,
                                }}
                            />
                            <span style={{ color: '#64748b' }}>%</span>
                            <button
                                type="button"
                                onClick={() => handleApplyBulkDiscount()}
                                disabled={applyingDiscount}
                                style={{
                                    padding: '5px 10px',
                                    border: 0,
                                    borderRadius: '6px',
                                    background: '#e5484d',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                {applyingDiscount ? '적용중...' : '일괄 적용'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyBulkDiscount(0)}
                                disabled={applyingDiscount}
                                style={{
                                    padding: '5px 8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    background: '#fff',
                                    color: '#475569',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                0%(정가)
                            </button>
                        </div>
                        <button onClick={handleCreateNew} className="gp-btn-primary">
                            <span className="material-symbols-outlined">add</span>
                            상품 등록
                        </button>
                        <button onClick={fetchProducts} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 좌측: 상품 목록 패널 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span className="gp-panel-title">상품 목록</span>
                            <div className="gp-header-filters">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="상품명 / 브랜드 검색"
                                />
                                <select
                                    value={priceFilterIdx}
                                    onChange={(e) => setPriceFilterIdx(Number(e.target.value))}
                                >
                                    {PRICE_FILTERS.map((f, i) => (
                                        <option key={f.label} value={i}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                                <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                                    <option value="전체">전체 브랜드</option>
                                    {allBrands.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="전체">전체 상태</option>
                                    <option value="노출">노출 중</option>
                                    <option value="숨김">숨김</option>
                                    <option value="뱃지있음">뺏지 있음</option>
                                </select>
                                <div className="gp-view-toggle">
                                    <button
                                        type="button"
                                        className={viewMode === 'table' ? 'active' : ''}
                                        onClick={() => setViewMode('table')}
                                    >
                                        <span className="material-symbols-outlined">list</span>
                                        목록
                                    </button>
                                    <button
                                        type="button"
                                        className={viewMode === 'grid' ? 'active' : ''}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <span className="material-symbols-outlined">grid_view</span>
                                        2열 배치
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : viewMode === 'table' ? (
                            <div className="inquiry-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="gp-nowrap" style={{ width: '104px' }}>위치 배치</th>
                                            <th className="gp-nowrap" style={{ width: '60px' }}>이미지</th>
                                            <th className="gp-nowrap">브랜드</th>
                                            <th>상품명</th>
                                            <th className="gp-nowrap">정가</th>
                                            <th className="gp-nowrap">판매가</th>
                                            <th className="gp-nowrap">뺏지</th>
                                            <th className="gp-nowrap">상태</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    등록된 상품이 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product, visIdx) => {
                                                const masterRank = products.findIndex((x) => x.id === product.id) + 1;
                                                return (
                                                    <tr
                                                        key={product.id}
                                                        draggable
                                                        onDragStart={() => setDragId(product.id)}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={() => handleDrop(product.id)}
                                                        className={selectedProduct?.id === product.id ? 'selected' : ''}
                                                        onClick={() => handleSelectProduct(product)}
                                                    >
                                                        <td className="gp-nowrap" onClick={(e) => e.stopPropagation()}>
                                                            <div className="gp-order-cell">
                                                                <input
                                                                    type="number"
                                                                    className="gp-order-input"
                                                                    key={`${product.id}-${masterRank}`}
                                                                    defaultValue={masterRank}
                                                                    min={1}
                                                                    max={products.length}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            const v = parseInt((e.target as HTMLInputElement).value, 10);
                                                                            if (!isNaN(v)) handleRankJump(product.id, v);
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const v = parseInt(e.target.value, 10);
                                                                        if (!isNaN(v) && v !== masterRank) handleRankJump(product.id, v);
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="gp-order-btn"
                                                                    disabled={visIdx === 0}
                                                                    onClick={(e) => handleMove(product.id, 'up', e)}
                                                                    title="위로 이동"
                                                                >
                                                                    <span className="material-symbols-outlined">keyboard_arrow_up</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="gp-order-btn"
                                                                    disabled={visIdx === filteredProducts.length - 1}
                                                                    onClick={(e) => handleMove(product.id, 'down', e)}
                                                                    title="아래로 이동"
                                                                >
                                                                    <span className="material-symbols-outlined">keyboard_arrow_down</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div
                                                                className="gp-thumb"
                                                                style={{
                                                                    background: product.image_url
                                                                        ? '#f1f5f9'
                                                                        : BRAND_COLORS[product.brand] || '#64748b',
                                                                }}
                                                            >
                                                                {product.image_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={product.image_url} alt={product.name} />
                                                                ) : (
                                                                    <span>{product.brand}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="gp-nowrap">{product.brand}</td>
                                                        <td className="name-cell">{product.name}</td>
                                                        <td className="number-cell gp-nowrap">{formatPrice(product.list_price)}원</td>
                                                        <td className="number-cell gp-nowrap">
                                                            {calcDiscountPct(product.list_price, product.sale_price) > 0 && (
                                                                <span style={{ color: '#e5484d', fontWeight: 700, marginRight: '6px', fontSize: '12px' }}>
                                                                    {calcDiscountPct(product.list_price, product.sale_price)}%
                                                                </span>
                                                            )}
                                                            {formatPrice(product.sale_price)}원
                                                        </td>
                                                        <td className="gp-nowrap" onClick={(e) => e.stopPropagation()}>
                                                            <select
                                                                className={`gp-badge-select ${product.badge ? 'has-val' : ''}`}
                                                                value={product.badge || ''}
                                                                onChange={(e) =>
                                                                    handleQuickBadgeChange(product, e.target.value || null)
                                                                }
                                                            >
                                                                <option value="">없음</option>
                                                                {BADGE_PRESETS.map((b) => (
                                                                    <option key={b} value={b}>
                                                                        {b}
                                                                    </option>
                                                                ))}
                                                                {product.badge && !BADGE_PRESETS.includes(product.badge) && (
                                                                    <option value={product.badge}>{product.badge}</option>
                                                                )}
                                                            </select>
                                                        </td>
                                                        <td className="gp-nowrap">
                                                            <button
                                                                type="button"
                                                                className={`gp-status-badge ${product.is_active ? 'active' : 'inactive'}`}
                                                                onClick={(e) => handleToggleActive(product, e)}
                                                                title="클릭하여 노출/숨김 전환"
                                                            >
                                                                {product.is_active ? '노출' : '숨김'}
                                                            </button>
                                                        </td>
                                                        <td className="arrow-cell">
                                                            <span className="material-symbols-outlined">chevron_right</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* 2열 배치 뷰 (실제 고객 화면처럼 드래그 배치) */
                            <div className="gp-grid-wrap">
                                <div className="gp-grid-toolbar">
                                    <span>카드를 드래그하거나 화살표로 위치를 변경하면 고객 화면 순서에 즉시 반영됩니다.</span>
                                    <span>표시 {filteredProducts.length}건</span>
                                </div>
                                <div className="gp-grid-2col">
                                    {filteredProducts.map((product, visIdx) => {
                                        const masterRank = products.findIndex((x) => x.id === product.id) + 1;
                                        return (
                                            <div
                                                key={product.id}
                                                draggable
                                                onDragStart={() => setDragId(product.id)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDrop(product.id)}
                                                onClick={() => handleSelectProduct(product)}
                                                className={`gp-grid-card ${
                                                    selectedProduct?.id === product.id ? 'selected' : ''
                                                } ${!product.is_active ? 'inactive' : ''}`}
                                            >
                                                <div className="gp-grid-card-top" onClick={(e) => e.stopPropagation()}>
                                                    <div className="gp-order-cell">
                                                        <span style={{ color: '#64748b', fontWeight: 600 }}>#{masterRank}</span>
                                                        <button
                                                            type="button"
                                                            className="gp-order-btn"
                                                            disabled={visIdx === 0}
                                                            onClick={(e) => handleMove(product.id, 'up', e)}
                                                        >
                                                            <span className="material-symbols-outlined">chevron_left</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="gp-order-btn"
                                                            disabled={visIdx === filteredProducts.length - 1}
                                                            onClick={(e) => handleMove(product.id, 'down', e)}
                                                        >
                                                            <span className="material-symbols-outlined">chevron_right</span>
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={`gp-status-badge ${product.is_active ? 'active' : 'inactive'}`}
                                                        onClick={(e) => handleToggleActive(product, e)}
                                                    >
                                                        {product.is_active ? '노출' : '숨김'}
                                                    </button>
                                                </div>

                                                <div
                                                    className="gp-grid-card-img"
                                                    style={{
                                                        background: product.image_url
                                                            ? '#f8fafc'
                                                            : BRAND_COLORS[product.brand] || '#64748b',
                                                    }}
                                                >
                                                    {product.image_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={product.image_url} alt={product.name} />
                                                    ) : (
                                                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                                                            {product.brand}
                                                        </span>
                                                    )}
                                                    {product.badge && (
                                                        <span className="gp-grid-card-badge">{product.badge}</span>
                                                    )}
                                                </div>

                                                <div className="gp-grid-card-body">
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                                                        {product.brand}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#1e293b',
                                                            marginBottom: '4px',
                                                            lineHeight: 1.35,
                                                        }}
                                                    >
                                                        {product.name}
                                                    </div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                                                        {formatPrice(product.sale_price)}원
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 우측: 상품 상세/등록 패널 (/admin/products 100% 동일 구조) */}
                    <div className="detail-panel">
                        {selectedProduct || isCreating ? (
                            <>
                                <div className="panel-header">
                                    <span>{isCreating ? '상품 등록' : '상품 수정'}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            setIsCreating(false);
                                            setEditForm(emptyProduct);
                                        }}
                                        className="btn-close"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="detail-content">
                                    <div className="detail-section">
                                        <div className="gp-form-group">
                                            <label>브랜드 *</label>
                                            <div className="gp-tag-list">
                                                {BRAND_PRESETS.map((b) => (
                                                    <button
                                                        key={b}
                                                        type="button"
                                                        className={`gp-tag-btn ${editForm.brand === b ? 'active' : ''}`}
                                                        onClick={() => setEditForm({ ...editForm, brand: b })}
                                                    >
                                                        {b}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.brand || ''}
                                                onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                                                placeholder="브랜드명 입력"
                                            />
                                        </div>

                                        <div className="gp-form-group">
                                            <label>상품명 *</label>
                                            <input
                                                type="text"
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="상품명 입력"
                                            />
                                        </div>

                                        <div className="gp-form-row">
                                            <div className="gp-form-group">
                                                <label>정가</label>
                                                <input
                                                    type="number"
                                                    value={editForm.list_price || ''}
                                                    onChange={(e) => {
                                                        const nextList = parseInt(e.target.value, 10) || 0;
                                                        const curDisc = calcDiscountPct(editForm.list_price, editForm.sale_price);
                                                        setEditForm({
                                                            ...editForm,
                                                            list_price: nextList,
                                                            sale_price: curDisc > 0 ? calcSaleFromDiscount(nextList, curDisc) : nextList,
                                                        });
                                                    }}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="gp-form-group">
                                                <label>고객 할인율 (%)</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={90}
                                                    value={calcDiscountPct(editForm.list_price, editForm.sale_price)}
                                                    onChange={(e) => {
                                                        const pct = Math.max(0, Math.min(90, parseInt(e.target.value, 10) || 0));
                                                        const base = Number(editForm.list_price) || Number(editForm.sale_price) || 0;
                                                        setEditForm({
                                                            ...editForm,
                                                            list_price: base,
                                                            sale_price: calcSaleFromDiscount(base, pct),
                                                        });
                                                    }}
                                                    placeholder="5"
                                                />
                                            </div>
                                            <div className="gp-form-group">
                                                <label>판매가 *</label>
                                                <input
                                                    type="number"
                                                    value={editForm.sale_price || ''}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, sale_price: parseInt(e.target.value, 10) || 0 })
                                                    }
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="gp-tag-list" style={{ marginBottom: '12px' }}>
                                            {[0, 3, 5, 7, 10].map((pct) => {
                                                const curPct = calcDiscountPct(editForm.list_price, editForm.sale_price);
                                                return (
                                                    <button
                                                        key={pct}
                                                        type="button"
                                                        className={`gp-tag-btn ${curPct === pct ? 'active' : ''}`}
                                                        onClick={() => {
                                                            const base = Number(editForm.list_price) || Number(editForm.sale_price) || 0;
                                                            setEditForm({
                                                                ...editForm,
                                                                list_price: base,
                                                                sale_price: calcSaleFromDiscount(base, pct),
                                                            });
                                                        }}
                                                    >
                                                        {pct === 0 ? '정가(0%)' : `${pct}% 할인`}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="gp-form-group">
                                            <label>카테고리</label>
                                            <select
                                                value={editForm.category || '커피/음료'}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            >
                                                {CATEGORY_PRESETS.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="gp-form-group">
                                            <label>뺏지</label>
                                            <div className="gp-tag-list">
                                                <button
                                                    type="button"
                                                    className={`gp-tag-btn ${!editForm.badge ? 'active' : ''}`}
                                                    onClick={() => setEditForm({ ...editForm, badge: null })}
                                                >
                                                    없음
                                                </button>
                                                {BADGE_PRESETS.map((b) => (
                                                    <button
                                                        key={b}
                                                        type="button"
                                                        className={`gp-tag-btn ${editForm.badge === b ? 'active' : ''}`}
                                                        onClick={() => setEditForm({ ...editForm, badge: b })}
                                                    >
                                                        {b}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.badge || ''}
                                                onChange={(e) => setEditForm({ ...editForm, badge: e.target.value || null })}
                                                placeholder="직접 입력 (비우면 없음)"
                                            />
                                        </div>

                                        <div className="gp-form-group">
                                            <label>노출 상태</label>
                                            <label className="gp-toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.is_active ?? true}
                                                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                                />
                                                <span style={{ fontSize: '14px', color: '#334155' }}>
                                                    {editForm.is_active ? '노출 중' : '숨김 처리'}
                                                </span>
                                            </label>
                                        </div>

                                        <div className="gp-form-group">
                                            <label>정렬 순서</label>
                                            <input
                                                type="number"
                                                value={editForm.sort_order ?? 0}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, sort_order: parseInt(e.target.value, 10) || 0 })
                                                }
                                                placeholder="10"
                                            />
                                            <small>숫자가 작을수록 먼저 표시됩니다</small>
                                        </div>

                                        <div className="gp-form-row">
                                            <div className="gp-form-group">
                                                <label>쿠폰 구분</label>
                                                <select
                                                    value={editForm.daou_sheet || '물품교환형'}
                                                    onChange={(e) => setEditForm({ ...editForm, daou_sheet: e.target.value })}
                                                >
                                                    <option value="물품교환형">물품교환형</option>
                                                    <option value="금액권(잔액관리형)">금액권(잔액관리형)</option>
                                                    <option value="기타">기타</option>
                                                </select>
                                            </div>
                                            <div className="gp-form-group">
                                                <label>다우 상품코드</label>
                                                <input
                                                    type="text"
                                                    value={editForm.daou_goods_code || ''}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, daou_goods_code: e.target.value })
                                                    }
                                                    placeholder="상품코드"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label>상품 이미지</label>
                                        <div className="gp-image-upload-area">
                                            {editForm.image_url && (
                                                <div className="gp-image-preview">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={editForm.image_url} alt="상품 이미지" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditForm({ ...editForm, image_url: null })}
                                                        className="gp-btn-remove-img"
                                                    >
                                                        <span className="material-symbols-outlined">close</span>
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="gp-btn-add-image"
                                                disabled={uploading}
                                            >
                                                <span className="material-symbols-outlined">add_photo_alternate</span>
                                                {uploading ? '업로드중...' : '이미지 추가'}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="detail-actions">
                                        <button onClick={handleSave} className="btn-action primary" disabled={saving}>
                                            <span className="material-symbols-outlined">save</span>
                                            {saving ? '저장 중...' : isCreating ? '등록하기' : '저장하기'}
                                        </button>
                                        {!isCreating && selectedProduct && (
                                            <button
                                                onClick={() =>
                                                    window.open(`/view/9448/gift/${selectedProduct.id}`, '_blank')
                                                }
                                                className="btn-action"
                                                style={{ background: '#3b82f6', color: '#fff' }}
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                                미리보기
                                            </button>
                                        )}
                                        {!isCreating && (
                                            <button onClick={handleDelete} className="btn-action danger">
                                                <span className="material-symbols-outlined">delete</span>
                                                삭제하기
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">redeem</span>
                                <p>
                                    상품을 선택하거나
                                    <br />새 상품을 등록하세요
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
