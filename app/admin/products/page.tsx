'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FlowerProduct {
    id: string;
    name: string;
    price: number;
    discount_price: number | null;
    category: string;
    images: string[];
    description: string | null;
    is_active: boolean;
    include_regions: string[];
    exclude_regions: string[];
    exclude_facilities: string[];
    sort_order: number;
    regional_prices: Record<string, number>;
    special_surcharges: Record<string, number>;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: string;
    name: string;
    sort_order: number;
}

const REGIONS = [
    '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

const DEFAULT_REGIONAL_PRICES: Record<string, number> = {
    '서울': 0, '경기': 0, '인천': 0, '부산': 0, '대구': 0, '광주': 0, '대전': 0, '울산': 0, '세종': 0,
    '강원': 0, '충북': 0, '충남': 0, '전북': 0, '전남': 0, '경북': 0, '경남': 0, '제주': 0
};

const emptyProduct: Partial<FlowerProduct> = {
    name: '',
    price: 0,
    discount_price: null,
    category: '근조화환',
    images: [],
    description: '',
    is_active: true,
    include_regions: [],
    exclude_regions: [],
    exclude_facilities: [],
    sort_order: 0,
    regional_prices: { ...DEFAULT_REGIONAL_PRICES },
    special_surcharges: {},
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<FlowerProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<FlowerProduct | null>(null);
    const [editForm, setEditForm] = useState<Partial<FlowerProduct>>(emptyProduct);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('전체');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('flower_products')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('flower_categories')
            .select('*')
            .order('sort_order');
        setCategories(data || []);
    };

    const filteredProducts = products.filter(p =>
        categoryFilter === '전체' || p.category === categoryFilter
    );

    const handleSelectProduct = (product: FlowerProduct) => {
        setSelectedProduct(product);
        setEditForm(product);
        setIsCreating(false);
    };

    const handleCreateNew = () => {
        setSelectedProduct(null);
        setEditForm(emptyProduct);
        setIsCreating(true);
    };

    const handleSave = async () => {
        if (!editForm.name || !editForm.price) {
            alert('상품명과 가격은 필수입니다.');
            return;
        }

        setSaving(true);

        try {
            if (isCreating) {
                const { error } = await supabase
                    .from('flower_products')
                    .insert({
                        name: editForm.name,
                        price: editForm.price,
                        discount_price: editForm.discount_price || null,
                        category: editForm.category,
                        images: editForm.images || [],
                        description: editForm.description || '',
                        is_active: editForm.is_active ?? true,
                        include_regions: editForm.include_regions || [],
                        exclude_regions: editForm.exclude_regions || [],
                        exclude_facilities: editForm.exclude_facilities || [],
                        sort_order: editForm.sort_order || 0,
                        regional_prices: editForm.regional_prices || DEFAULT_REGIONAL_PRICES,
                        special_surcharges: editForm.special_surcharges || {},
                    });

                if (error) throw error;
                alert('상품이 등록되었습니다.');
            } else if (selectedProduct) {
                const { error } = await supabase
                    .from('flower_products')
                    .update({
                        name: editForm.name,
                        price: editForm.price,
                        discount_price: editForm.discount_price || null,
                        category: editForm.category,
                        images: editForm.images || [],
                        description: editForm.description || '',
                        is_active: editForm.is_active,
                        include_regions: editForm.include_regions || [],
                        exclude_regions: editForm.exclude_regions || [],
                        exclude_facilities: editForm.exclude_facilities || [],
                        sort_order: editForm.sort_order || 0,
                        regional_prices: editForm.regional_prices || DEFAULT_REGIONAL_PRICES,
                        special_surcharges: editForm.special_surcharges || {},
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', selectedProduct.id);

                if (error) throw error;
                alert('상품이 수정되었습니다.');
            }

            fetchProducts();
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

        const { error } = await supabase
            .from('flower_products')
            .delete()
            .eq('id', selectedProduct.id);

        if (error) {
            alert('삭제 오류: ' + error.message);
        } else {
            alert('삭제되었습니다.');
            setSelectedProduct(null);
            setEditForm(emptyProduct);
            fetchProducts();
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages = [...(editForm.images || [])];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `product_${Date.now()}_${i}.${fileExt}`;
                const filePath = `products/${fileName}`;

                // Supabase Storage에 업로드
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    // Storage 버킷이 없으면 안내
                    if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
                        alert('Supabase Storage에 "images" 버킷을 먼저 생성해주세요.\n\nStorage > New Bucket > "images" (public)');
                        break;
                    }
                    throw uploadError;
                }

                // Public URL 가져오기
                const { data: urlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                if (urlData?.publicUrl) {
                    newImages.push(urlData.publicUrl);
                }
            }

            setEditForm({ ...editForm, images: newImages });
        } catch (err: any) {
            console.error('Image upload failed:', err);
            alert('이미지 업로드 실패: ' + (err.message || '알 수 없는 오류'));
        } finally {
            setUploading(false);
            // 파일 인풋 초기화
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...(editForm.images || [])];
        newImages.splice(index, 1);
        setEditForm({ ...editForm, images: newImages });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    return (
        <div className="admin-pc">
            {/* 사이드바 */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <Link href="/">마음부고</Link>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/admin/bugo" className="nav-item">
                        <span className="material-symbols-outlined">description</span>
                        <span>부고장 관리</span>
                    </Link>
                    <Link href="/admin/flower-orders" className="nav-item">
                        <span className="material-symbols-outlined">local_florist</span>
                        <span>화환 주문</span>
                    </Link>
                    <Link href="/admin/facilities" className="nav-item">
                        <span className="material-symbols-outlined">apartment</span>
                        <span>장례식장 정보</span>
                    </Link>
                    <Link href="/admin/products" className="nav-item active">
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span>상품 등록</span>
                    </Link>
                    <Link href="/admin/inquiries" className="nav-item">
                        <span className="material-symbols-outlined">mail</span>
                        <span>문의 관리</span>
                    </Link>
                </nav>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>상품 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {filteredProducts.length}건</span>
                        <button onClick={handleCreateNew} className="btn-primary">
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
                    {/* 상품 목록 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>상품 목록</span>
                            <div className="category-filter">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="전체">전체</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : (
                            <div className="inquiry-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px' }}>이미지</th>
                                            <th>상품명</th>
                                            <th>카테고리</th>
                                            <th>가격</th>
                                            <th>할인가</th>
                                            <th>상태</th>
                                            <th>등록일</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    등록된 상품이 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className={selectedProduct?.id === product.id ? 'selected' : ''}
                                                    onClick={() => handleSelectProduct(product)}
                                                >
                                                    <td>
                                                        <div className="product-thumb">
                                                            {product.images?.[0] ? (
                                                                <img src={product.images[0]} alt={product.name} />
                                                            ) : (
                                                                <span className="material-symbols-outlined">image</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="name-cell">{product.name}</td>
                                                    <td>{product.category}</td>
                                                    <td className="number-cell">{formatPrice(product.price)}원</td>
                                                    <td className="number-cell">
                                                        {product.discount_price ? formatPrice(product.discount_price) + '원' : '-'}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                                                            {product.is_active ? '노출' : '숨김'}
                                                        </span>
                                                    </td>
                                                    <td className="date-cell">{formatDate(product.created_at)}</td>
                                                    <td className="arrow-cell">
                                                        <span className="material-symbols-outlined">chevron_right</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 상품 상세/등록 패널 */}
                    <div className="detail-panel">
                        {(selectedProduct || isCreating) ? (
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
                                        <div className="form-group">
                                            <label>상품명 *</label>
                                            <input
                                                type="text"
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="상품명 입력"
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>가격 *</label>
                                                <input
                                                    type="number"
                                                    value={editForm.price || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>할인가격</label>
                                                <input
                                                    type="number"
                                                    value={editForm.discount_price || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, discount_price: parseInt(e.target.value) || null })}
                                                    placeholder="할인 없음"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>카테고리</label>
                                            <select
                                                value={editForm.category || '근조화환'}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>상품 설명</label>
                                            <textarea
                                                value={editForm.description || ''}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                placeholder="상품 설명 입력"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>노출 상태</label>
                                            <div className="toggle-group">
                                                <label className="toggle-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.is_active ?? true}
                                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                                    />
                                                    <span className="toggle-text">
                                                        {editForm.is_active ? '노출 중' : '숨김 처리'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>정렬 순서</label>
                                            <input
                                                type="number"
                                                value={editForm.sort_order || 0}
                                                onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                                                placeholder="0"
                                            />
                                            <small>숫자가 작을수록 먼저 표시됩니다</small>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label>상품 이미지</label>
                                        <div className="image-upload-area">
                                            {editForm.images?.map((img, i) => (
                                                <div key={i} className="image-preview">
                                                    <img src={img} alt={`이미지 ${i + 1}`} />
                                                    <button onClick={() => removeImage(i)} className="btn-remove-img">
                                                        <span className="material-symbols-outlined">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="btn-add-image"
                                                disabled={uploading}
                                            >
                                                {uploading ? (
                                                    <>
                                                        <span className="material-symbols-outlined spinning">progress_activity</span>
                                                        업로드중...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined">add_photo_alternate</span>
                                                        이미지 추가
                                                    </>
                                                )}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label>시/도별 추가금</label>
                                        <small>기본가격에 더해지는 지역별 추가금 (0이면 기본가 적용)</small>
                                        <div className="regional-price-grid">
                                            {REGIONS.map(region => (
                                                <div key={region} className="regional-price-item">
                                                    <span className="region-name">{region}</span>
                                                    <div className="price-input-wrap">
                                                        <span>+</span>
                                                        <input
                                                            type="number"
                                                            value={(editForm.regional_prices || {})[region] || 0}
                                                            onChange={(e) => setEditForm({
                                                                ...editForm,
                                                                regional_prices: {
                                                                    ...(editForm.regional_prices || DEFAULT_REGIONAL_PRICES),
                                                                    [region]: parseInt(e.target.value) || 0
                                                                }
                                                            })}
                                                            placeholder="0"
                                                        />
                                                        <span>원</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label>특수지역 추가금</label>
                                        <small>산간/도서 지역별 추가금 (시군구 키워드 입력)</small>

                                        <div className="special-surcharge-input">
                                            <input
                                                type="text"
                                                id="special-area-input"
                                                placeholder="예: 울릉군, 영월군"
                                            />
                                            <input
                                                type="number"
                                                id="special-price-input"
                                                placeholder="추가금"
                                                style={{ width: '100px' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn-tag-add"
                                                onClick={() => {
                                                    const areaInput = document.getElementById('special-area-input') as HTMLInputElement;
                                                    const priceInput = document.getElementById('special-price-input') as HTMLInputElement;
                                                    const area = areaInput?.value.trim();
                                                    const price = parseInt(priceInput?.value) || 0;
                                                    if (area && price > 0) {
                                                        setEditForm({
                                                            ...editForm,
                                                            special_surcharges: {
                                                                ...(editForm.special_surcharges || {}),
                                                                [area]: price
                                                            }
                                                        });
                                                        areaInput.value = '';
                                                        priceInput.value = '';
                                                    }
                                                }}
                                            >
                                                등록
                                            </button>
                                        </div>

                                        {Object.keys(editForm.special_surcharges || {}).length > 0 && (
                                            <div className="tag-list special">
                                                {Object.entries(editForm.special_surcharges || {}).map(([area, price]) => (
                                                    <span key={area} className="tag special">
                                                        {area} +{(price as number).toLocaleString()}원
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newSurcharges = { ...(editForm.special_surcharges || {}) };
                                                                delete newSurcharges[area];
                                                                setEditForm({ ...editForm, special_surcharges: newSurcharges });
                                                            }}
                                                        >×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <label>노출 지역 설정</label>
                                        <small>비어있으면 전국 노출</small>

                                        {/* 노출 지역 */}
                                        <div className="form-group tag-input-group">
                                            <label>노출 지역</label>
                                            <div className="input-with-btn">
                                                <input
                                                    type="text"
                                                    id="include-region-input"
                                                    placeholder="예: 서울"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const input = e.target as HTMLInputElement;
                                                            const value = input.value.trim();
                                                            if (value && !(editForm.include_regions || []).includes(value)) {
                                                                setEditForm({
                                                                    ...editForm,
                                                                    include_regions: [...(editForm.include_regions || []), value]
                                                                });
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-tag-add"
                                                    onClick={() => {
                                                        const input = document.getElementById('include-region-input') as HTMLInputElement;
                                                        const value = input?.value.trim();
                                                        if (value && !(editForm.include_regions || []).includes(value)) {
                                                            setEditForm({
                                                                ...editForm,
                                                                include_regions: [...(editForm.include_regions || []), value]
                                                            });
                                                            input.value = '';
                                                        }
                                                    }}
                                                >
                                                    등록
                                                </button>
                                            </div>
                                            {(editForm.include_regions || []).length > 0 && (
                                                <div className="tag-list">
                                                    {(editForm.include_regions || []).map((region, i) => (
                                                        <span key={i} className="tag include">
                                                            {region}
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditForm({
                                                                    ...editForm,
                                                                    include_regions: (editForm.include_regions || []).filter((_, idx) => idx !== i)
                                                                })}
                                                            >×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 제외 지역 */}
                                        <div className="form-group tag-input-group">
                                            <label>제외 지역</label>
                                            <div className="input-with-btn">
                                                <input
                                                    type="text"
                                                    id="exclude-region-input"
                                                    placeholder="예: 제주"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const input = e.target as HTMLInputElement;
                                                            const value = input.value.trim();
                                                            if (value && !(editForm.exclude_regions || []).includes(value)) {
                                                                setEditForm({
                                                                    ...editForm,
                                                                    exclude_regions: [...(editForm.exclude_regions || []), value]
                                                                });
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-tag-add"
                                                    onClick={() => {
                                                        const input = document.getElementById('exclude-region-input') as HTMLInputElement;
                                                        const value = input?.value.trim();
                                                        if (value && !(editForm.exclude_regions || []).includes(value)) {
                                                            setEditForm({
                                                                ...editForm,
                                                                exclude_regions: [...(editForm.exclude_regions || []), value]
                                                            });
                                                            input.value = '';
                                                        }
                                                    }}
                                                >
                                                    등록
                                                </button>
                                            </div>
                                            {(editForm.exclude_regions || []).length > 0 && (
                                                <div className="tag-list">
                                                    {(editForm.exclude_regions || []).map((region, i) => (
                                                        <span key={i} className="tag exclude">
                                                            {region}
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditForm({
                                                                    ...editForm,
                                                                    exclude_regions: (editForm.exclude_regions || []).filter((_, idx) => idx !== i)
                                                                })}
                                                            >×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 제외 장례식장 */}
                                        <div className="form-group tag-input-group">
                                            <label>제외 장례식장</label>
                                            <div className="input-with-btn">
                                                <input
                                                    type="text"
                                                    id="exclude-facility-input"
                                                    placeholder="장례식장명 입력"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const input = e.target as HTMLInputElement;
                                                            const value = input.value.trim();
                                                            if (value && !(editForm.exclude_facilities || []).includes(value)) {
                                                                setEditForm({
                                                                    ...editForm,
                                                                    exclude_facilities: [...(editForm.exclude_facilities || []), value]
                                                                });
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-tag-add"
                                                    onClick={() => {
                                                        const input = document.getElementById('exclude-facility-input') as HTMLInputElement;
                                                        const value = input?.value.trim();
                                                        if (value && !(editForm.exclude_facilities || []).includes(value)) {
                                                            setEditForm({
                                                                ...editForm,
                                                                exclude_facilities: [...(editForm.exclude_facilities || []), value]
                                                            });
                                                            input.value = '';
                                                        }
                                                    }}
                                                >
                                                    등록
                                                </button>
                                            </div>
                                            {(editForm.exclude_facilities || []).length > 0 && (
                                                <div className="tag-list">
                                                    {(editForm.exclude_facilities || []).map((facility, i) => (
                                                        <span key={i} className="tag facility">
                                                            {facility}
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditForm({
                                                                    ...editForm,
                                                                    exclude_facilities: (editForm.exclude_facilities || []).filter((_, idx) => idx !== i)
                                                                })}
                                                            >×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-actions">
                                        <button
                                            onClick={handleSave}
                                            className="btn-action primary"
                                            disabled={saving}
                                        >
                                            <span className="material-symbols-outlined">save</span>
                                            {saving ? '저장 중...' : (isCreating ? '등록하기' : '저장하기')}
                                        </button>
                                        {!isCreating && selectedProduct && (
                                            <button
                                                onClick={() => window.open(`/view/test/flower/${selectedProduct.id}`, '_blank')}
                                                className="btn-action preview"
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
                                <span className="material-symbols-outlined">inventory_2</span>
                                <p>상품을 선택하거나<br />새 상품을 등록하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #f59e0b;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    background: #d97706;
                }
                .category-filter select {
                    padding: 6px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .product-thumb {
                    width: 50px;
                    height: 50px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .product-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .product-thumb .material-symbols-outlined {
                    color: #94a3b8;
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .status-badge.active {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .status-badge.inactive {
                    background: #fef2f2;
                    color: #dc2626;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 6px;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .form-group small {
                    display: block;
                    font-size: 12px;
                    color: #94a3b8;
                    margin-top: 4px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .toggle-group {
                    display: flex;
                    gap: 12px;
                }
                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .image-upload-area {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 8px;
                }
                .image-preview {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .image-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .btn-remove-img {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 20px;
                    height: 20px;
                    background: rgba(0,0,0,0.6);
                    color: #fff;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .btn-remove-img .material-symbols-outlined {
                    font-size: 14px;
                }
                .btn-add-image {
                    width: 80px;
                    height: 80px;
                    border: 2px dashed #e2e8f0;
                    border-radius: 8px;
                    background: transparent;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    cursor: pointer;
                    color: #94a3b8;
                    font-size: 11px;
                }
                .btn-add-image:hover {
                    border-color: #f59e0b;
                    color: #f59e0b;
                }
                .input-with-btn {
                    display: flex;
                    gap: 8px;
                }
                .input-with-btn input {
                    flex: 1;
                }
                .btn-tag-add {
                    padding: 8px 16px;
                    background: #3b82f6;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .btn-tag-add:hover {
                    background: #2563eb;
                }
                .tag-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 8px;
                }
                .tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 16px;
                    font-size: 13px;
                }
                .tag.include {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .tag.exclude {
                    background: #fee2e2;
                    color: #dc2626;
                }
                .tag.facility {
                    background: #fef3c7;
                    color: #d97706;
                }
                .tag button {
                    width: 16px;
                    height: 16px;
                    background: rgba(0,0,0,0.2);
                    border: none;
                    border-radius: 50%;
                    color: currentColor;
                    font-size: 12px;
                    line-height: 1;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .tag button:hover {
                    background: rgba(0,0,0,0.3);
                }
                .tag-input-group {
                    margin-bottom: 16px;
                }
                .btn-action.preview {
                    background: #3b82f6;
                    color: #fff;
                }
                .btn-action.preview:hover {
                    background: #2563eb;
                }
                .regional-price-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-top: 12px;
                }
                .regional-price-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 8px 10px;
                    background: #f8fafc;
                    border-radius: 6px;
                }
                .region-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: #374151;
                    min-width: 40px;
                }
                .price-input-wrap {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 13px;
                    color: #6b7280;
                }
                .price-input-wrap input {
                    width: 70px;
                    padding: 4px 6px;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 13px;
                    text-align: right;
                }
                .price-input-wrap input:focus {
                    outline: none;
                    border-color: #f59e0b;
                }
                .special-surcharge-input {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .special-surcharge-input input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .special-surcharge-input input:focus {
                    outline: none;
                    border-color: #f59e0b;
                }
                .tag-list.special {
                    margin-top: 12px;
                }
                .tag.special {
                    background: #fef3c7;
                    color: #b45309;
                    border: 1px solid #fcd34d;
                }
            `}</style>
        </div>
    );
}
