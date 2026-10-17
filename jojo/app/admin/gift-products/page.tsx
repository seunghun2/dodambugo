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

const CUSTOMER_PRICE_TABS: { label: string; test: (p: number) => boolean }[] = [
    { label: '추천', test: () => true },
    { label: '~1만원', test: (p) => p < 10000 },
    { label: '1~2만원', test: (p) => p >= 10000 && p < 20000 },
    { label: '2~3만원', test: (p) => p >= 20000 && p < 30000 },
    { label: '3~5만원', test: (p) => p >= 30000 && p < 50000 },
    { label: '5만원~', test: (p) => p >= 50000 },
];

const emptyForm = (): Partial<GiftProductAdmin> & { insertPos?: 'top' | 'bottom' } => ({
    brand: '스타벅스',
    name: '',
    category: '커피/음료',
    list_price: 10000,
    sale_price: 10000,
    image_url: null,
    badge: null,
    daou_sheet: '물품교환형',
    daou_goods_code: '',
    is_active: true,
    insertPos: 'top',
});

const won = (n: number) => `${(Number(n) || 0).toLocaleString('ko-KR')}원`;

export default function AdminGiftProductsPage() {
    const [products, setProducts] = useState<GiftProductAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');

    // 필터 상태
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'badged'>('all');
    const [priceTabIdx, setPriceTabIdx] = useState(0);
    const [brandFilter, setBrandFilter] = useState('전체');
    const [badgeFilter, setBadgeFilter] = useState('전체');
    const [searchQuery, setSearchQuery] = useState('');

    // 카드 위 뱃지 퀵 팝오버 ID
    const [openBadgePopoverId, setOpenBadgePopoverId] = useState<string | null>(null);

    // 드래그 앤 드롭 상태
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // 우측 인스펙터 (선택된 상품 또는 신규 등록)
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<Partial<GiftProductAdmin> & { insertPos?: 'top' | 'bottom' }>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 토스트 알림
    const [toast, setToast] = useState<string | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    };

    const fetchProducts = async (keepSelection = true) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/gift-products', { cache: 'no-store' });
            const data = await res.json();
            const list: GiftProductAdmin[] = data.products || [];
            setProducts(list);
            if (keepSelection && selectedId) {
                const found = list.find((p) => p.id === selectedId);
                if (found) setForm(found);
            } else if (!selectedId && !isCreating && list.length > 0) {
                setSelectedId(list[0].id);
                setForm(list[0]);
            }
        } catch (err) {
            console.error('Failed to fetch gift products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 통계
    const counts = useMemo(() => {
        const total = products.length;
        const active = products.filter((p) => p.is_active).length;
        const hidden = total - active;
        const badged = products.filter((p) => !!p.badge).length;
        return { total, active, hidden, badged };
    }, [products]);

    // 브랜드 목록 (실제 등록된 브랜드 + 프리셋)
    const allBrands = useMemo(() => {
        const s = new Set<string>();
        products.forEach((p) => p.brand && s.add(p.brand));
        return Array.from(s);
    }, [products]);

    // 필터링된 목록
    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const priceTest = CUSTOMER_PRICE_TABS[priceTabIdx]?.test || (() => true);

        return products.filter((p) => {
            if (statusFilter === 'active' && !p.is_active) return false;
            if (statusFilter === 'hidden' && p.is_active) return false;
            if (statusFilter === 'badged' && !p.badge) return false;
            if (!priceTest(p.sale_price)) return false;
            if (brandFilter !== '전체' && p.brand !== brandFilter) return false;
            if (badgeFilter === '있음' && !p.badge) return false;
            if (badgeFilter === '없음' && p.badge) return false;
            if (badgeFilter !== '전체' && badgeFilter !== '있음' && badgeFilter !== '없음' && p.badge !== badgeFilter) {
                return false;
            }
            if (q) {
                const hay = `${p.brand} ${p.name} ${p.category} ${p.badge || ''} ${p.daou_goods_code || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [products, statusFilter, priceTabIdx, brandFilter, badgeFilter, searchQuery]);

    // 상품 선택
    const handleSelectProduct = (p: GiftProductAdmin) => {
        setIsCreating(false);
        setSelectedId(p.id);
        setForm({ ...p });
    };

    // 신규 상품 등록 모드 전환
    const handleStartCreate = () => {
        setSelectedId(null);
        setIsCreating(true);
        setForm(emptyForm());
    };

    // 즉시 노출 ON/OFF 토글 (넣다뺐다)
    const handleToggleActive = async (p: GiftProductAdmin, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const nextActive = !p.is_active;

        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, is_active: nextActive } : item)));
        if (selectedId === p.id) {
            setForm((prev) => ({ ...prev, is_active: nextActive }));
        }

        const res = await fetch('/api/admin/gift-products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, is_active: nextActive }),
        });

        if (res.ok) {
            showToast(nextActive ? `'${p.name}' 노출 켜짐 (ON)` : `'${p.name}' 숨김 처리됨 (OFF)`);
        } else {
            showToast('상태 변경 실패 — 다시 시도해주세요');
            fetchProducts();
        }
    };

    // 즉시 뱃지 변경
    const handleQuickBadge = async (p: GiftProductAdmin, nextBadge: string | null, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setOpenBadgePopoverId(null);

        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, badge: nextBadge } : item)));
        if (selectedId === p.id) {
            setForm((prev) => ({ ...prev, badge: nextBadge }));
        }

        const res = await fetch('/api/admin/gift-products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, badge: nextBadge }),
        });

        if (res.ok) {
            showToast(nextBadge ? `뱃지 [${nextBadge}] 적용됨` : '뱃지 해제됨');
        } else {
            showToast('뱃지 변경 실패');
            fetchProducts();
        }
    };

    // 전체 리스트 순서 재부여 & 서버 일괄 저장
    const commitNewOrder = async (newOrderedList: GiftProductAdmin[], label = '배치 순서가 저장되었습니다') => {
        const withSortOrder = newOrderedList.map((item, idx) => ({
            ...item,
            sort_order: (idx + 1) * 10,
        }));
        setProducts(withSortOrder);

        if (selectedId) {
            const updatedSel = withSortOrder.find((x) => x.id === selectedId);
            if (updatedSel) setForm((prev) => ({ ...prev, sort_order: updatedSel.sort_order }));
        }

        const bulk = withSortOrder.map((item) => ({ id: item.id, sort_order: item.sort_order }));
        const res = await fetch('/api/admin/gift-products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bulk }),
        });

        if (res.ok) {
            showToast(label);
        } else {
            showToast('순서 저장 중 오류가 발생했습니다');
            fetchProducts();
        }
    };

    // 단건 위치 이동 (맨위 / 앞으로 / 뒤로 / 맨아래)
    const handleMoveProduct = async (productId: string, direction: 'top' | 'up' | 'down' | 'bottom', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        // 현재 필터링된 뷰 기준으로 이웃 상품과 위치를 바꾸거나 전체 맨위/맨아래로 이동
        const masterIdx = products.findIndex((p) => p.id === productId);
        if (masterIdx < 0) return;

        const next = [...products];
        if (direction === 'top') {
            const [item] = next.splice(masterIdx, 1);
            next.unshift(item);
            await commitNewOrder(next, '맨 앞(1번)으로 이동되었습니다');
            return;
        }
        if (direction === 'bottom') {
            const [item] = next.splice(masterIdx, 1);
            next.push(item);
            await commitNewOrder(next, '맨 뒤로 이동되었습니다');
            return;
        }

        // 현재 화면에 보이는 목록(filteredProducts) 안에서 이전/다음 카드와 위치 교환
        const visIdx = filteredProducts.findIndex((p) => p.id === productId);
        const targetVisIdx = direction === 'up' ? visIdx - 1 : visIdx + 1;
        if (targetVisIdx < 0 || targetVisIdx >= filteredProducts.length) return;

        const targetId = filteredProducts[targetVisIdx].id;
        const targetMasterIdx = next.findIndex((p) => p.id === targetId);
        if (targetMasterIdx < 0) return;

        const temp = next[masterIdx];
        next[masterIdx] = next[targetMasterIdx];
        next[targetMasterIdx] = temp;

        await commitNewOrder(next, '위치가 변경되었습니다');
    };

    // 순번(#) 직접 입력하여 이동 (1-based rank)
    const handleJumpRank = async (productId: string, targetRankOneBased: number) => {
        const currentIdx = products.findIndex((p) => p.id === productId);
        if (currentIdx < 0) return;
        const clampedIdx = Math.max(0, Math.min(products.length - 1, targetRankOneBased - 1));
        if (currentIdx === clampedIdx) return;

        const next = [...products];
        const [item] = next.splice(currentIdx, 1);
        next.splice(clampedIdx, 0, item);
        await commitNewOrder(next, `${clampedIdx + 1}번 위치로 이동되었습니다`);
    };

    // 드래그 앤 드롭 핸들러
    const handleDropOnCard = async (targetId: string) => {
        const sourceId = dragId;
        setDragId(null);
        setDragOverId(null);
        if (!sourceId || sourceId === targetId) return;

        const srcIdx = products.findIndex((p) => p.id === sourceId);
        const dstIdx = products.findIndex((p) => p.id === targetId);
        if (srcIdx < 0 || dstIdx < 0) return;

        const next = [...products];
        const [moved] = next.splice(srcIdx, 1);
        next.splice(dstIdx, 0, moved);
        await commitNewOrder(next, '드래그 위치 배치가 반영되었습니다');
    };

    // 원클릭 자동 배치 프리셋
    const handlePresetSort = async (mode: 'badge-first' | 'price-asc' | 'brand') => {
        const next = [...products];
        if (mode === 'badge-first') {
            const badgePriority: Record<string, number> = {
                추천: 1,
                인기: 2,
                BEST: 3,
                자주선택: 4,
                부담없는: 5,
                든든한: 6,
                정성가득: 7,
            };
            next.sort((a, b) => {
                const aHas = a.badge ? badgePriority[a.badge] || 10 : 999;
                const bHas = b.badge ? badgePriority[b.badge] || 10 : 999;
                if (aHas !== bHas) return aHas - bHas;
                return a.sort_order - b.sort_order;
            });
            await commitNewOrder(next, '뱃지 상품이 상단으로 배치되었습니다');
        } else if (mode === 'price-asc') {
            next.sort((a, b) => a.sale_price - b.sale_price || a.sort_order - b.sort_order);
            await commitNewOrder(next, '낮은 가격순으로 배치되었습니다');
        } else if (mode === 'brand') {
            next.sort((a, b) => a.brand.localeCompare(b.brand, 'ko') || a.sale_price - b.sale_price);
            await commitNewOrder(next, '브랜드별·가격순으로 배치되었습니다');
        }
    };

    // 이미지 업로드 (Supabase Storage 'images' 버킷)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `gift-products/gift_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
            if (urlData?.publicUrl) {
                setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
                showToast('이미지가 업로드되었습니다');
            }
        } catch (err: any) {
            alert('이미지 업로드 실패: ' + (err?.message || '알 수 없는 오류'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 우측 인스펙터 폼 저장 (신규 등록 또는 수정)
    const handleSaveForm = async () => {
        const brand = (form.brand || '').trim();
        const name = (form.name || '').trim();
        const salePrice = Number(form.sale_price) || 0;
        const listPrice = Number(form.list_price) || salePrice;

        if (!brand || !name) {
            alert('브랜드와 상품명을 입력해주세요.');
            return;
        }
        if (salePrice <= 0) {
            alert('판매가는 0원보다 커야 합니다.');
            return;
        }

        setSaving(true);
        try {
            if (isCreating) {
                const minOrder = products.length > 0 ? Math.min(...products.map((p) => p.sort_order)) : 10;
                const maxOrder = products.length > 0 ? Math.max(...products.map((p) => p.sort_order)) : 0;
                const sort_order = form.insertPos === 'bottom' ? maxOrder + 10 : Math.max(1, minOrder - 10);

                const res = await fetch('/api/admin/gift-products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        brand,
                        name,
                        category: form.category || '커피/음료',
                        list_price: listPrice,
                        sale_price: salePrice,
                        image_url: form.image_url || null,
                        badge: form.badge || null,
                        daou_sheet: form.daou_sheet || null,
                        daou_goods_code: form.daou_goods_code || null,
                        is_active: form.is_active ?? true,
                        sort_order,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || '등록 실패');
                    return;
                }
                showToast(`'${name}' 상품이 등록되었습니다`);
                setIsCreating(false);
                setSelectedId(data.product.id);
                setForm(data.product);
                await fetchProducts(false);
                setSelectedId(data.product.id);
            } else if (selectedId) {
                const res = await fetch('/api/admin/gift-products', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: selectedId,
                        brand,
                        name,
                        category: form.category || '커피/음료',
                        list_price: listPrice,
                        sale_price: salePrice,
                        image_url: form.image_url || null,
                        badge: form.badge || null,
                        daou_sheet: form.daou_sheet || null,
                        daou_goods_code: form.daou_goods_code || null,
                        is_active: form.is_active ?? true,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || '수정 실패');
                    return;
                }
                setProducts((prev) => prev.map((p) => (p.id === selectedId ? data.product : p)));
                setForm(data.product);
                showToast(`'${name}' 상품 정보가 저장되었습니다`);
            }
        } finally {
            setSaving(false);
        }
    };

    // 상품 복제하여 신규 등록 모드로 열기
    const handleDuplicate = () => {
        setIsCreating(true);
        setSelectedId(null);
        setForm({
            ...form,
            id: undefined,
            name: `${form.name || ''} (복사본)`,
            insertPos: 'top',
        });
        showToast('복제 모드로 전환되었습니다 — 상품명 수정 후 등록하세요');
    };

    // 상품 삭제
    const handleDeleteProduct = async (target?: GiftProductAdmin) => {
        const p = target || products.find((x) => x.id === selectedId);
        if (!p) return;
        if (!confirm(`[${p.brand}] '${p.name}' 상품을 삭제하시겠습니까?\n(단순 비노출은 '숨김' 스위치를 사용하실 수 있습니다.)`)) {
            return;
        }

        const res = await fetch(`/api/admin/gift-products?id=${encodeURIComponent(p.id)}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            alert(d.error || '삭제 실패');
            return;
        }

        const remaining = products.filter((x) => x.id !== p.id);
        setProducts(remaining);
        showToast(`'${p.name}' 상품이 삭제되었습니다`);
        if (selectedId === p.id) {
            if (remaining.length > 0) {
                setSelectedId(remaining[0].id);
                setForm(remaining[0]);
            } else {
                handleStartCreate();
            }
        }
    };

    const previewDiscount =
        (Number(form.list_price) || 0) > (Number(form.sale_price) || 0) && (Number(form.list_price) || 0) > 0
            ? Math.round((1 - (Number(form.sale_price) || 0) / (Number(form.list_price) || 1)) * 100)
            : 0;

    return (
        <div className="admin-pc" onClick={() => setOpenBadgePopoverId(null)}>
            <AdminSidebar />

            <main className="admin-main">
                {/* 상단 헤더 */}
                <header className="admin-top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1>답례품 상품 에디터</h1>
                        <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
                            드래그 배치 · 원클릭 노출(넣다뺐다) · 뱃지 · 상품 등록/삭제
                        </span>
                    </div>
                    <div className="header-actions">
                        <button
                            type="button"
                            onClick={() => window.open('/view/9448/gift', '_blank')}
                            className="ge-preset-btn"
                        >
                            <span className="material-symbols-outlined">open_in_new</span>
                            실제 고객화면 열기
                        </button>
                        <button
                            type="button"
                            onClick={handleStartCreate}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                background: '#f59e0b',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '7px',
                                fontSize: '13.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                add
                            </span>
                            새 답례품 등록
                        </button>
                    </div>
                </header>

                {/* 상단 통계 & 뷰 전환 & 자동 정렬 프리셋 바 */}
                <div className="ge-toolbar">
                    <div className="ge-stats">
                        <button
                            type="button"
                            className={`ge-stat-pill ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            전체 상품 <b>{counts.total}</b>
                        </button>
                        <button
                            type="button"
                            className={`ge-stat-pill ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >
                            <span className="ge-stat-dot on" />
                            노출 중 (ON) <b>{counts.active}</b>
                        </button>
                        <button
                            type="button"
                            className={`ge-stat-pill ${statusFilter === 'hidden' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('hidden')}
                        >
                            <span className="ge-stat-dot off" />
                            숨김 보관 (OFF) <b>{counts.hidden}</b>
                        </button>
                        <button
                            type="button"
                            className={`ge-stat-pill ${statusFilter === 'badged' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('badged')}
                        >
                            <span className="ge-stat-dot badge" />
                            뱃지 부착 <b>{counts.badged}</b>
                        </button>
                    </div>

                    <div className="ge-toolbar-right">
                        <button type="button" className="ge-preset-btn" onClick={() => handlePresetSort('badge-first')}>
                            <span className="material-symbols-outlined">auto_awesome</span>
                            뱃지 상품 상단 배치
                        </button>
                        <button type="button" className="ge-preset-btn" onClick={() => handlePresetSort('price-asc')}>
                            <span className="material-symbols-outlined">sort</span>
                            낮은 가격순 배치
                        </button>
                        <button type="button" className="ge-preset-btn" onClick={() => handlePresetSort('brand')}>
                            <span className="material-symbols-outlined">sell</span>
                            브랜드별 묶음 배치
                        </button>

                        <div className="ge-view-switch">
                            <button
                                type="button"
                                className={`ge-view-btn ${viewMode === 'canvas' ? 'active' : ''}`}
                                onClick={() => setViewMode('canvas')}
                            >
                                <span className="material-symbols-outlined">smartphone</span>
                                2열 화면 에디터
                            </button>
                            <button
                                type="button"
                                className={`ge-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                            >
                                <span className="material-symbols-outlined">table_rows</span>
                                전체 표 에디터
                            </button>
                        </div>
                    </div>
                </div>

                {/* 검색 · 브랜드 · 뱃지 · 고객 가격탭 필터 바 */}
                <div className="ge-filterbar">
                    <div className="ge-search-box">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="상품명, 브랜드, 뱃지 검색..."
                        />
                        <span className="material-symbols-outlined">search</span>
                    </div>

                    <select className="ge-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                        <option value="전체">전체 브랜드</option>
                        {allBrands.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>

                    <select className="ge-select" value={badgeFilter} onChange={(e) => setBadgeFilter(e.target.value)}>
                        <option value="전체">뱃지 전체</option>
                        <option value="있음">뱃지 있음</option>
                        <option value="없음">뱃지 없음</option>
                        {BADGE_PRESETS.map((b) => (
                            <option key={b} value={b}>
                                뱃지: {b}
                            </option>
                        ))}
                    </select>

                    <div className="ge-price-tabs">
                        {CUSTOMER_PRICE_TABS.map((tab, i) => (
                            <button
                                key={tab.label}
                                type="button"
                                className={`ge-price-tab ${priceTabIdx === i ? 'active' : ''}`}
                                onClick={() => setPriceTabIdx(i)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 메인 워크스페이스 */}
                <div className="ge-workspace">
                    {/* 좌측: 에디터 캔버스 or 테이블 */}
                    <div>
                        {loading ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                답례품 목록을 불러오는 중...
                            </div>
                        ) : viewMode === 'canvas' ? (
                            <div className="ge-canvas-wrap">
                                <div className="ge-canvas-guide">
                                    <span>
                                        💡 카드를 <b>드래그</b>하거나 <b>▲/▼/순번</b>으로 위치를 바꾸면 고객 화면에 즉시 반영됩니다. 우측 상단 <b>뱃지</b>를 클릭해 바로 변경하세요.
                                    </span>
                                    <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                                        표시 {filteredProducts.length}개
                                    </span>
                                </div>

                                <div className="ge-phone-frame">
                                    {/* 실제 모바일 히어로 배너 */}
                                    <div className="ge-phone-header">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/images/gift/gift-hero.jpg" alt="" />
                                        <p className="ge-phone-header-text">
                                            조문해 주신 분들께
                                            <br />
                                            <b>감사의 마음</b>을
                                            <br />
                                            답례품으로 전해보세요.
                                        </p>
                                    </div>

                                    {/* 실제 모바일 가격 칩 */}
                                    <div className="ge-phone-chips">
                                        {CUSTOMER_PRICE_TABS.map((tab, i) => (
                                            <button
                                                key={tab.label}
                                                type="button"
                                                className={`ge-price-tab ${priceTabIdx === i ? 'active' : ''}`}
                                                onClick={() => setPriceTabIdx(i)}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 2열 상품 그리드 에디터 */}
                                    {filteredProducts.length === 0 ? (
                                        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                            해당 조건의 상품이 없습니다.
                                        </div>
                                    ) : (
                                        <div className="ge-phone-grid">
                                            {filteredProducts.map((p, visIdx) => {
                                                const masterRank = products.findIndex((x) => x.id === p.id) + 1;
                                                const discount =
                                                    p.list_price > p.sale_price
                                                        ? Math.round((1 - p.sale_price / p.list_price) * 100)
                                                        : 0;
                                                const isSelected = !isCreating && selectedId === p.id;

                                                return (
                                                    <div
                                                        key={p.id}
                                                        draggable
                                                        onDragStart={() => setDragId(p.id)}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            if (dragOverId !== p.id) setDragOverId(p.id);
                                                        }}
                                                        onDragLeave={() => {
                                                            if (dragOverId === p.id) setDragOverId(null);
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            handleDropOnCard(p.id);
                                                        }}
                                                        onDragEnd={() => {
                                                            setDragId(null);
                                                            setDragOverId(null);
                                                        }}
                                                        onClick={() => handleSelectProduct(p)}
                                                        className={`ge-card ${isSelected ? 'selected' : ''} ${
                                                            !p.is_active ? 'inactive' : ''
                                                        } ${dragId === p.id ? 'dragging' : ''} ${
                                                            dragOverId === p.id && dragId !== p.id ? 'drag-over' : ''
                                                        }`}
                                                    >
                                                        {/* 카드 상단 컨트롤: 순번 직접 입력 + 이동 버튼 + 노출 ON/OFF */}
                                                        <div className="ge-card-topbar" onClick={(e) => e.stopPropagation()}>
                                                            <div className="ge-rank-box" title="전체 노출 순번 (숫자 입력 후 엔터로 이동)">
                                                                <span>#</span>
                                                                <input
                                                                    type="number"
                                                                    className="ge-rank-input"
                                                                    key={`${p.id}-${masterRank}`}
                                                                    defaultValue={masterRank}
                                                                    min={1}
                                                                    max={products.length}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                                                                            if (!isNaN(val)) handleJumpRank(p.id, val);
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const val = parseInt(e.target.value, 10);
                                                                        if (!isNaN(val) && val !== masterRank) {
                                                                            handleJumpRank(p.id, val);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="ge-move-btns">
                                                                <button
                                                                    type="button"
                                                                    className="ge-move-btn"
                                                                    title="맨 위로"
                                                                    disabled={masterRank === 1}
                                                                    onClick={(e) => handleMoveProduct(p.id, 'top', e)}
                                                                >
                                                                    ⏫
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ge-move-btn"
                                                                    title="앞으로 한 칸"
                                                                    disabled={visIdx === 0}
                                                                    onClick={(e) => handleMoveProduct(p.id, 'up', e)}
                                                                >
                                                                    ◀
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ge-move-btn"
                                                                    title="뒤로 한 칸"
                                                                    disabled={visIdx === filteredProducts.length - 1}
                                                                    onClick={(e) => handleMoveProduct(p.id, 'down', e)}
                                                                >
                                                                    ▶
                                                                </button>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className={`ge-active-pill ${p.is_active ? 'on' : 'off'}`}
                                                                onClick={(e) => handleToggleActive(p, e)}
                                                                title="클릭하여 노출/숨김 전환"
                                                            >
                                                                {p.is_active ? '노출 ON' : '숨김 OFF'}
                                                            </button>
                                                        </div>

                                                        {/* 카드 썸네일 & 원클릭 뱃지 버튼 */}
                                                        <div className="ge-card-thumb">
                                                            {p.image_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={p.image_url} alt={p.name} />
                                                            ) : (
                                                                <div
                                                                    className="ge-brand-tile"
                                                                    style={{ background: BRAND_COLORS[p.brand] || '#64748b' }}
                                                                >
                                                                    {p.brand}
                                                                </div>
                                                            )}

                                                            <button
                                                                type="button"
                                                                className={`ge-card-badge-btn ${p.badge ? 'has-badge' : 'no-badge'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenBadgePopoverId(openBadgePopoverId === p.id ? null : p.id);
                                                                }}
                                                                title="클릭하여 뱃지 변경"
                                                            >
                                                                {p.badge || '+ 뱃지'}
                                                            </button>

                                                            {!p.is_active && <span className="ge-hidden-overlay">숨김 상태</span>}
                                                        </div>

                                                        {/* 카드 위 뱃지 퀵 선택 팝오버 */}
                                                        {openBadgePopoverId === p.id && (
                                                            <div
                                                                className="ge-badge-popover"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {BADGE_PRESETS.map((b) => (
                                                                    <button
                                                                        key={b}
                                                                        type="button"
                                                                        className={`ge-badge-opt ${p.badge === b ? 'active' : ''}`}
                                                                        onClick={(e) => handleQuickBadge(p, b, e)}
                                                                    >
                                                                        {b}
                                                                    </button>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    className="ge-badge-opt clear"
                                                                    onClick={(e) => handleQuickBadge(p, null, e)}
                                                                >
                                                                    해제
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* 카드 텍스트 정보 */}
                                                        <div className="ge-card-body">
                                                            <p className="ge-card-brand">{p.brand}</p>
                                                            <h3 className="ge-card-name">{p.name}</h3>
                                                            <div className="ge-card-price">
                                                                {discount > 0 && <span className="ge-card-discount">{discount}%</span>}
                                                                <span className="ge-card-sale">{won(p.sale_price)}</span>
                                                                {discount > 0 && <span className="ge-card-list">{won(p.list_price)}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* 전체 표 리스트 에디터 뷰 */
                            <div className="ge-table-card">
                                <table className="ge-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '96px' }}>순번 / 배치</th>
                                            <th style={{ width: '54px' }}>썸네일</th>
                                            <th>브랜드 / 상품명</th>
                                            <th>판매가 (정가)</th>
                                            <th>뺏지 (원클릭 지정)</th>
                                            <th style={{ width: '90px' }}>노출 상태</th>
                                            <th style={{ width: '64px' }}>삭제</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((p, visIdx) => {
                                            const masterRank = products.findIndex((x) => x.id === p.id) + 1;
                                            const isSelected = !isCreating && selectedId === p.id;
                                            return (
                                                <tr
                                                    key={p.id}
                                                    onClick={() => handleSelectProduct(p)}
                                                    className={`${isSelected ? 'selected' : ''} ${!p.is_active ? 'inactive-row' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <input
                                                                type="number"
                                                                className="ge-rank-input"
                                                                key={`tbl-${p.id}-${masterRank}`}
                                                                defaultValue={masterRank}
                                                                min={1}
                                                                max={products.length}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                                                                        if (!isNaN(val)) handleJumpRank(p.id, val);
                                                                    }
                                                                }}
                                                                onBlur={(e) => {
                                                                    const val = parseInt(e.target.value, 10);
                                                                    if (!isNaN(val) && val !== masterRank) handleJumpRank(p.id, val);
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="ge-move-btn"
                                                                disabled={visIdx === 0}
                                                                onClick={(e) => handleMoveProduct(p.id, 'up', e)}
                                                                title="위로"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="ge-move-btn"
                                                                disabled={visIdx === filteredProducts.length - 1}
                                                                onClick={(e) => handleMoveProduct(p.id, 'down', e)}
                                                                title="아래로"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div
                                                            className="ge-mini-thumb"
                                                            style={{ background: p.image_url ? '#fff' : BRAND_COLORS[p.brand] || '#64748b' }}
                                                        >
                                                            {p.image_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={p.image_url} alt={p.name} />
                                                            ) : (
                                                                p.brand.slice(0, 3)
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                                                            {p.brand} · <span style={{ color: '#94a3b8' }}>{p.category}</span>
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{p.name}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{won(p.sale_price)}</div>
                                                        {p.list_price > p.sale_price && (
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                                                {won(p.list_price)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="ge-inline-badges">
                                                            <button
                                                                type="button"
                                                                className={`ge-inline-badge ${!p.badge ? 'active' : ''}`}
                                                                onClick={(e) => handleQuickBadge(p, null, e)}
                                                            >
                                                                없음
                                                            </button>
                                                            {BADGE_PRESETS.map((b) => (
                                                                <button
                                                                    key={b}
                                                                    type="button"
                                                                    className={`ge-inline-badge ${p.badge === b ? 'active' : ''}`}
                                                                    onClick={(e) => handleQuickBadge(p, b, e)}
                                                                >
                                                                    {b}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className={`ge-active-pill ${p.is_active ? 'on' : 'off'}`}
                                                            onClick={(e) => handleToggleActive(p, e)}
                                                        >
                                                            {p.is_active ? '노출 ON' : '숨김 OFF'}
                                                        </button>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="ge-move-btn"
                                                            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                                                            onClick={() => handleDeleteProduct(p)}
                                                            title="상품 삭제"
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 우측: 상세 편집 / 신규 상품 등록 인스펙터 */}
                    <aside className="ge-inspector">
                        <div className="ge-inspector-header">
                            <h2>{isCreating ? '✨ 새 답례품 상품 등록' : '🛠️ 답례품 상세 에디터'}</h2>
                            {!isCreating && (
                                <button
                                    type="button"
                                    onClick={handleStartCreate}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    + 신규 등록 전환
                                </button>
                            )}
                        </div>

                        <div className="ge-inspector-body">
                            {/* 1:1 실시간 카드 미리보기 */}
                            <div className="ge-live-preview-box">
                                <div className="ge-live-preview-thumb">
                                    {form.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={form.image_url} alt={form.name || '미리보기'} />
                                    ) : (
                                        <div
                                            className="ge-brand-tile"
                                            style={{
                                                background: BRAND_COLORS[form.brand || ''] || '#64748b',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {form.brand || '브랜드'}
                                        </div>
                                    )}
                                    {form.badge && <span className="ge-live-preview-badge">{form.badge}</span>}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                                        실제 고객 카드 미리보기
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>
                                        {form.brand || '브랜드 미입력'}
                                    </div>
                                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1f2937', marginBottom: '6px', lineHeight: 1.35 }}>
                                        {form.name || '상품명을 입력하세요'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        {previewDiscount > 0 && (
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626' }}>
                                                {previewDiscount}%
                                            </span>
                                        )}
                                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#111827' }}>
                                            {won(Number(form.sale_price) || 0)}
                                        </span>
                                        {previewDiscount > 0 && (
                                            <span style={{ fontSize: '11.5px', color: '#9ca3af', textDecoration: 'line-through' }}>
                                                {won(Number(form.list_price) || 0)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 노출 여부 & 신규 등록 위치 */}
                            <div className="ge-field-row" style={{ marginBottom: '14px' }}>
                                <div className="ge-field" style={{ marginBottom: 0 }}>
                                    <label>고객 화면 노출</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, is_active: !(form.is_active ?? true) })}
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            borderRadius: '7px',
                                            border: form.is_active ? '1px solid #86efac' : '1px solid #fecaca',
                                            background: form.is_active ? '#dcfce7' : '#fef2f2',
                                            color: form.is_active ? '#15803d' : '#dc2626',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {form.is_active ? '● 노출 중 (ON)' : '○ 숨김 보관 (OFF)'}
                                    </button>
                                </div>

                                {isCreating ? (
                                    <div className="ge-field" style={{ marginBottom: 0 }}>
                                        <label>등록 시 배치 위치</label>
                                        <select
                                            value={form.insertPos || 'top'}
                                            onChange={(e) => setForm({ ...form, insertPos: e.target.value as 'top' | 'bottom' })}
                                        >
                                            <option value="top">맨 앞(1번)에 배치</option>
                                            <option value="bottom">맨 뒤에 배치</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="ge-field" style={{ marginBottom: 0 }}>
                                        <label>빠른 위치 이동</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', height: '38px' }}>
                                            <button
                                                type="button"
                                                className="ge-move-btn"
                                                style={{ width: '100%', height: '100%' }}
                                                onClick={() => selectedId && handleMoveProduct(selectedId, 'top')}
                                                title="맨 앞으로"
                                            >
                                                맨위
                                            </button>
                                            <button
                                                type="button"
                                                className="ge-move-btn"
                                                style={{ width: '100%', height: '100%' }}
                                                onClick={() => selectedId && handleMoveProduct(selectedId, 'up')}
                                                title="한 칸 앞으로"
                                            >
                                                ◀앞
                                            </button>
                                            <button
                                                type="button"
                                                className="ge-move-btn"
                                                style={{ width: '100%', height: '100%' }}
                                                onClick={() => selectedId && handleMoveProduct(selectedId, 'down')}
                                                title="한 칸 뒤로"
                                            >
                                                뒤▶
                                            </button>
                                            <button
                                                type="button"
                                                className="ge-move-btn"
                                                style={{ width: '100%', height: '100%' }}
                                                onClick={() => selectedId && handleMoveProduct(selectedId, 'bottom')}
                                                title="맨 뒤로"
                                            >
                                                맨뒤
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 뺏지 (Badge) 설정 */}
                            <div className="ge-field">
                                <label>
                                    <span>뺏지 (라벨)</span>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                        프리셋 클릭 또는 직접 입력
                                    </span>
                                </label>
                                <div className="ge-chip-group">
                                    <button
                                        type="button"
                                        className={`ge-chip-btn ${!form.badge ? 'active' : ''}`}
                                        onClick={() => setForm({ ...form, badge: null })}
                                    >
                                        없음
                                    </button>
                                    {BADGE_PRESETS.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            className={`ge-chip-btn ${form.badge === b ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, badge: b })}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={form.badge || ''}
                                    onChange={(e) => setForm({ ...form, badge: e.target.value || null })}
                                    placeholder="직접 입력 (예: 자주선택, 부담없는, 특가 등 — 비우면 뱃지 없음)"
                                />
                            </div>

                            {/* 브랜드 설정 */}
                            <div className="ge-field">
                                <label>
                                    <span>브랜드 *</span>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>클릭 또는 직접 입력</span>
                                </label>
                                <div className="ge-chip-group">
                                    {BRAND_PRESETS.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            className={`ge-brand-chip ${form.brand === b ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, brand: b })}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={form.brand || ''}
                                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                    placeholder="브랜드명 입력 (예: 스타벅스)"
                                />
                            </div>

                            {/* 상품명 & 카테고리 */}
                            <div className="ge-field">
                                <label>상품명 *</label>
                                <input
                                    type="text"
                                    value={form.name || ''}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="예: [부드러운 디저트] 카페 아메리카노 T 2잔 + 카스텔라"
                                />
                            </div>

                            <div className="ge-field">
                                <label>카테고리</label>
                                <select
                                    value={form.category || '커피/음료'}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                >
                                    {CATEGORY_PRESETS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 가격 (정가 / 판매가 / 원클릭 할인율) */}
                            <div className="ge-field">
                                <label>
                                    <span>정가 / 실제 판매가 *</span>
                                    {previewDiscount > 0 && (
                                        <span style={{ color: '#dc2626', fontSize: '11.5px' }}>{previewDiscount}% 할인 표시됨</span>
                                    )}
                                </label>
                                <div className="ge-field-row">
                                    <div>
                                        <small style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                                            정가 (표시 취소선 가격)
                                        </small>
                                        <input
                                            type="number"
                                            value={form.list_price ?? 0}
                                            onChange={(e) => setForm({ ...form, list_price: parseInt(e.target.value, 10) || 0 })}
                                            placeholder="정가"
                                        />
                                    </div>
                                    <div>
                                        <small style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                                            실제 판매가 (결제 금액)
                                        </small>
                                        <input
                                            type="number"
                                            value={form.sale_price ?? 0}
                                            onChange={(e) => setForm({ ...form, sale_price: parseInt(e.target.value, 10) || 0 })}
                                            placeholder="판매가"
                                        />
                                    </div>
                                </div>
                                <div className="ge-discount-bar">
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>정가 대비 자동 계산:</span>
                                    {[
                                        { label: '정가 동일', rate: 0 },
                                        { label: '1% 할인', rate: 0.01 },
                                        { label: '3% 할인', rate: 0.03 },
                                        { label: '5% 할인', rate: 0.05 },
                                        { label: '10% 할인', rate: 0.1 },
                                    ].map((d) => (
                                        <button
                                            key={d.label}
                                            type="button"
                                            className="ge-discount-chip"
                                            onClick={() => {
                                                const base = Number(form.list_price) || Number(form.sale_price) || 10000;
                                                const nextSale =
                                                    d.rate === 0 ? base : Math.round((base * (1 - d.rate)) / 10) * 10;
                                                setForm({ ...form, list_price: base, sale_price: nextSale });
                                            }}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 상품 이미지 업로드 & URL */}
                            <div className="ge-field">
                                <label>
                                    <span>상품 이미지</span>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                        비워두면 브랜드 컬러 타일 표시
                                    </span>
                                </label>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                    <input
                                        type="text"
                                        value={form.image_url || ''}
                                        onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
                                        placeholder="이미지 URL 직접 입력 또는 우측 파일 업로드"
                                    />
                                    <button
                                        type="button"
                                        className="ge-btn-sub"
                                        style={{ whiteSpace: 'nowrap', padding: '0 12px', height: '38px' }}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? '업로드중...' : '파일 업로드'}
                                    </button>
                                    {form.image_url && (
                                        <button
                                            type="button"
                                            className="ge-btn-sub"
                                            style={{ whiteSpace: 'nowrap', padding: '0 10px', height: '38px' }}
                                            onClick={() => setForm({ ...form, image_url: null })}
                                            title="이미지 제거 후 브랜드 타일로 전환"
                                        >
                                            타일로
                                        </button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* 다우기술 상품코드 (선택) */}
                            <div className="ge-field-row">
                                <div className="ge-field" style={{ marginBottom: 0 }}>
                                    <label>쿠폰 유형</label>
                                    <select
                                        value={form.daou_sheet || '물품교환형'}
                                        onChange={(e) => setForm({ ...form, daou_sheet: e.target.value })}
                                    >
                                        <option value="물품교환형">물품교환형</option>
                                        <option value="금액권(잔액관리형)">금액권(잔액관리형)</option>
                                        <option value="기타">기타</option>
                                    </select>
                                </div>
                                <div className="ge-field" style={{ marginBottom: 0 }}>
                                    <label>다우 상품코드</label>
                                    <input
                                        type="text"
                                        value={form.daou_goods_code || ''}
                                        onChange={(e) => setForm({ ...form, daou_goods_code: e.target.value })}
                                        placeholder="연동 시 입력"
                                    />
                                </div>
                            </div>

                            {/* 하단 액션 버튼 */}
                            <div className="ge-actions">
                                <button
                                    type="button"
                                    className="ge-btn-save"
                                    onClick={handleSaveForm}
                                    disabled={saving}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                                        save
                                    </span>
                                    {saving ? '저장 중...' : isCreating ? '새 답례품 등록하기' : '변경사항 저장하기'}
                                </button>

                                {!isCreating && selectedId && (
                                    <>
                                        <button type="button" className="ge-btn-sub" onClick={handleDuplicate}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                                content_copy
                                            </span>
                                            이 상품 복제
                                        </button>
                                        <button type="button" className="ge-btn-danger" onClick={() => handleDeleteProduct()}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                                delete
                                            </span>
                                            상품 삭제
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>

                {toast && (
                    <div className="ge-toast" role="status" aria-live="polite">
                        <span className="dot" />
                        <span>{toast}</span>
                    </div>
                )}
            </main>
        </div>
    );
}
