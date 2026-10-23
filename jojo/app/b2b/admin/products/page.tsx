'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    IconPlus,
    IconRefresh,
    IconLoader2,
    IconX,
    IconPhotoPlus,
    IconPhoto,
    IconTrash,
    IconCheck,
    IconAlertCircle,
    IconChevronRight,
    IconSearch
} from '@tabler/icons-react';
import styles from './products.module.css';

interface FlowerProduct {
    id: string;
    name: string;
    price: number;
    b2b_price?: number | null;
    discount_price: number | null;
    category: string;
    images: string[];
    description: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: string;
    name: string;
    sort_order: number;
}

const emptyProduct: Partial<FlowerProduct> = {
    name: '',
    price: 0,
    b2b_price: null,
    discount_price: null,
    category: '',
    images: [],
    description: '',
    is_active: true,
    sort_order: 0,
};

export default function B2BAdminProductsPage() {
    const [products, setProducts] = useState<FlowerProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // 검색 및 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('전체');

    // Drawer / Panel 관련 상태
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<FlowerProduct | null>(null);
    const [editForm, setEditForm] = useState<Partial<FlowerProduct>>(emptyProduct);

    // Toast 알림 상태
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    // categories가 로드되었을 때, 신규 등록 폼의 기본 카테고리 지정
    useEffect(() => {
        if (!editForm.category && categories.length > 0) {
            setEditForm(prev => ({ ...prev, category: categories[0].name }));
        }
    }, [categories, editForm.category]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/admin/products');
            if (!res.ok) {
                throw new Error('상품 정보를 로드하는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setProducts(data.products || []);
                setCategories(data.categories || []);
            } else {
                throw new Error(data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            showToast(err.message || '네트워크 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 필터링된 상품 목록
    const filteredProducts = products.filter(product => {
        const matchesCategory = categoryFilter === '전체' || product.category === categoryFilter;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    const handleOpenCreateDrawer = () => {
        setSelectedProduct(null);
        setEditForm({
            ...emptyProduct,
            category: categories[0]?.name || '근조화환'
        });
        setIsDrawerOpen(true);
    };

    const handleOpenEditDrawer = (product: FlowerProduct) => {
        setSelectedProduct(product);
        setEditForm({
            name: product.name,
            price: product.price,
            discount_price: product.discount_price,
            category: product.category,
            images: product.images || [],
            description: product.description || '',
            is_active: product.is_active,
            sort_order: product.sort_order
        });
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        if (saving || uploading) return; // 작업 중일 때는 닫지 않음
        setIsDrawerOpen(false);
        setSelectedProduct(null);
        setEditForm(emptyProduct);
    };

    // 상품 등록 및 수정 처리
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.name?.trim()) {
            showToast('상품명을 입력해주세요.', 'error');
            return;
        }
        if (editForm.price === undefined || editForm.price === null || isNaN(editForm.price) || editForm.price < 0) {
            showToast('올바른 상품 가격을 입력해주세요.', 'error');
            return;
        }

        setSaving(true);
        try {
            const isCreating = !selectedProduct;
            const url = '/api/b2b/admin/products';
            const method = isCreating ? 'POST' : 'PATCH';

            const payload = {
                ...editForm,
                id: selectedProduct?.id // 수정 모드일 때만 포함됨
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || '저장에 실패했습니다.');
            }

            showToast(isCreating ? '상품이 정상적으로 등록되었습니다.' : '상품이 정상적으로 수정되었습니다.', 'success');
            handleCloseDrawer();
            fetchProducts();
        } catch (err: any) {
            showToast(err.message || '저장 중 오류가 발생했습니다.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // 상품 삭제 처리
    const handleDelete = async () => {
        if (!selectedProduct) return;
        if (!confirm(`정말로 "${selectedProduct.name}" 상품을 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/b2b/admin/products?id=${selectedProduct.id}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || '삭제에 실패했습니다.');
            }

            showToast('상품이 정상적으로 삭제되었습니다.', 'success');
            handleCloseDrawer();
            fetchProducts();
        } catch (err: any) {
            showToast(err.message || '삭제 중 오류가 발생했습니다.', 'error');
        }
    };

    // 다중 이미지 업로드 처리
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages = [...(editForm.images || [])];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || 'png' : 'png';
                const fileName = `product_${Date.now()}_${i}.${fileExt}`;
                const filePath = `products/${fileName}`;

                // Supabase Storage에 업로드 (bucket: 'images')
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Storage Upload error:', uploadError);
                    if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
                        showToast('Supabase Storage에 "images" 버킷이 활성화되어 있지 않습니다.', 'error');
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

            setEditForm(prev => ({ ...prev, images: newImages }));
            showToast('이미지 업로드가 완료되었습니다.', 'success');
        } catch (err: any) {
            console.error('Image upload failed:', err);
            showToast('이미지 업로드 실패: ' + (err.message || '알 수 없는 오류'), 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // 업로드된 이미지 목록에서 특정 이미지 제외
    const handleRemoveImage = (index: number) => {
        const newImages = [...(editForm.images || [])];
        newImages.splice(index, 1);
        setEditForm(prev => ({ ...prev, images: newImages }));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    return (
        <div className={styles.container}>
            {/* 토스트 팝업 */}
            {toast && (
                <div className={styles.toastContainer}>
                    <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                        {toast.type === 'success' ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* 타이틀 영역 */}
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 상품 관리</h1>
                <p className={styles.subtitle}>B2B 파트너에게 제공되는 꽃배달 상품군을 관리합니다.</p>
            </div>

            {/* 상단 액션바 */}
            <div className={styles.actionBar}>
                <div className={styles.totalCount}>
                    총 <strong>{filteredProducts.length}</strong>개 상품
                </div>
                <div className={styles.actionButtons}>
                    <button onClick={handleOpenCreateDrawer} className={styles.btnPrimary}>
                        <IconPlus size={16} />
                        상품 등록
                    </button>
                    <button onClick={fetchProducts} className={styles.btnSecondary}>
                        <IconRefresh size={16} />
                        새로고침
                    </button>
                </div>
            </div>

            {/* 필터바 */}
            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="상품명 또는 설명 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select
                        className={styles.selectInput}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="전체">모든 카테고리</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <button type="submit" style={{ display: 'none' }} />
                </form>
            </div>

            {/* 상품 테이블 */}
            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.loadingArea}>
                        <IconLoader2 className={styles.spinning} size={32} />
                        <p>상품 목록을 불러오는 중...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                        등록된 상품이 없거나 검색 결과가 일치하지 않습니다.
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>이미지</th>
                                    <th>상품명</th>
                                    <th>카테고리</th>
                                    <th>B2C 가격</th>
                                    <th>B2B 가격</th>
                                    <th>할인 가격</th>
                                    <th style={{ width: '100px' }}>정렬 순서</th>
                                    <th style={{ width: '100px' }}>노출 상태</th>
                                    <th style={{ width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} onClick={() => handleOpenEditDrawer(product)}>
                                        <td>
                                            <div className={styles.thumbnailWrapper}>
                                                {product.images?.[0] ? (
                                                    <img 
                                                        src={product.images[0]} 
                                                        alt={product.name} 
                                                        className={styles.thumbnail}
                                                    />
                                                ) : (
                                                    <IconPhoto size={20} />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.productName}>{product.name}</div>
                                        </td>
                                        <td>{product.category}</td>
                                        <td>
                                            <span className={styles.priceNormal}>{formatPrice(product.price)}원</span>
                                        </td>
                                        <td>
                                            <span className={styles.priceNormal} style={{ color: '#2563eb', fontWeight: 600 }}>
                                                {product.b2b_price ? formatPrice(product.b2b_price) + '원' : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            {product.discount_price ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className={styles.priceDiscount}>{formatPrice(product.discount_price)}원</span>
                                                    <span className={styles.priceOriginal}>{formatPrice(product.price)}원</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>-</span>
                                            )}
                                        </td>
                                        <td>{product.sort_order}</td>
                                        <td>
                                            <span className={`${styles.badge} ${product.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                                                {product.is_active ? '노출' : '숨김'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <IconChevronRight size={18} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sliding Drawer/Panel Overlay */}
            {isDrawerOpen && (
                <div className={styles.drawerOverlay} onClick={handleCloseDrawer}>
                    <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <h2 className={styles.drawerTitle}>
                                {selectedProduct ? '상품 수정' : '신규 상품 등록'}
                            </h2>
                            <button onClick={handleCloseDrawer} className={styles.btnClose}>
                                <IconX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 69px)' }}>
                            <div className={styles.drawerContent}>
                                {/* 상품명 */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>상품명 *</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="상품명을 입력하세요"
                                        required
                                    />
                                </div>

                                {/* 가격 및 할인가격 */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>B2C 가격 (원) *</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={editForm.price !== undefined ? editForm.price : ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>B2B 가격 (원)</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={editForm.b2b_price !== null && editForm.b2b_price !== undefined ? editForm.b2b_price : ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, b2b_price: e.target.value ? parseInt(e.target.value) : null }))}
                                            placeholder="미입력 시 B2C가 적용"
                                            min="0"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>할인 가격 (원)</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={editForm.discount_price !== null && editForm.discount_price !== undefined ? editForm.discount_price : ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, discount_price: e.target.value ? parseInt(e.target.value) : null }))}
                                            placeholder="할인 적용 안함"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* 카테고리 */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>카테고리 *</label>
                                    <select
                                        className={styles.select}
                                        value={editForm.category || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        required
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 상품 설명 */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>상품 설명</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={editForm.description || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="상품 상세 설명을 입력하세요"
                                    />
                                </div>

                                {/* 정렬 순서 */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>정렬 순서</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={editForm.sort_order !== undefined ? editForm.sort_order : 0}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                        placeholder="0"
                                    />
                                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                                        숫자가 작을수록 화면에 먼저 보입니다.
                                    </span>
                                </div>

                                {/* 노출 상태 */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>노출 설정</label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={editForm.is_active ?? true}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        <span>사용자 화면에 이 상품을 노출합니다.</span>
                                    </label>
                                </div>

                                {/* 이미지 업로드 */}
                                <div className={styles.uploadSection}>
                                    <label className={styles.label}>상품 이미지</label>
                                    <div className={styles.imageGrid}>
                                        {(editForm.images || []).map((imgUrl, idx) => (
                                            <div key={idx} className={styles.imagePreview}>
                                                <img src={imgUrl} alt={`업로드 이미지 ${idx + 1}`} className={styles.previewImg} />
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveImage(idx)} 
                                                    className={styles.btnRemoveImg}
                                                    title="이미지 삭제"
                                                >
                                                    <IconX size={12} />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            className={styles.btnUploadCard}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <IconLoader2 className={`${styles.spinning} ${styles.uploadIcon}`} size={20} />
                                            ) : (
                                                <IconPhotoPlus className={styles.uploadIcon} size={20} />
                                            )}
                                            <span className={styles.uploadText}>
                                                {uploading ? '업로드 중' : '이미지 추가'}
                                            </span>
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
                            </div>

                            <div className={styles.drawerFooter}>
                                <div className={styles.footerLeft}>
                                    {selectedProduct && (
                                        <button 
                                            type="button" 
                                            onClick={handleDelete} 
                                            className={styles.btnDeleteProduct}
                                        >
                                            <IconTrash size={16} />
                                            삭제
                                        </button>
                                    )}
                                </div>
                                <div className={styles.footerRight}>
                                    <button 
                                        type="button" 
                                        onClick={handleCloseDrawer} 
                                        className={styles.btnSecondary}
                                        disabled={saving}
                                    >
                                        취소
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={styles.btnPrimary}
                                        disabled={saving || uploading}
                                    >
                                        {saving ? (
                                            <>
                                                <IconLoader2 className={styles.spinning} size={16} />
                                                저장 중...
                                            </>
                                        ) : (
                                            '저장하기'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
