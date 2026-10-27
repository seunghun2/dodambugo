'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './flower.module.css';

interface FlowerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  b2b_price?: number | null;
  discount_price: number | null;
  images: string[];
  sort_order: number;
}

export default function FlowerListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<FlowerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('b2b_token');
    const userData = localStorage.getItem('b2b_user');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('flower_products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('화환 상품 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>화환 상품 정보를 불러오는 중입니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>화환 보내기</span>
        <div className={styles.headerRightPlaceholder} />
      </header>

      {/* 안내 배너 */}
      <div className={styles.banner}>
        주문하실 상품을 선택해 주세요 (지역별 배송비 상이)
      </div>

      {/* 상품 리스트 */}
      <div className={styles.listContainer}>
        {products.length === 0 ? (
          <div className={styles.emptyState}>
            등록된 화환 상품이 없습니다.
          </div>
        ) : (
          products.map((product) => {
            const b2bBase = product.b2b_price || product.price;
            const displayPrice = product.discount_price !== null ? product.discount_price : b2bBase;
            const hasDiscount = product.discount_price !== null && product.discount_price < b2bBase;

            return (
              <div
                key={product.id}
                className={styles.productCard}
                onClick={() => router.push(`/b2b/flower/order/${product.sort_order}`)}
              >
                <div className={styles.productImage}>
                  <img
                    src={product.images?.[0] || '/images/flower-wreath.png'}
                    alt={product.name}
                  />
                  <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/b2b/flower/${product.sort_order}`);
                    }}
                    title="상세보기"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productDesc}>{product.description}</p>
                  <div className={styles.priceContainer}>
                    <span className={styles.salePrice}>
                      {displayPrice.toLocaleString()}원 ~
                    </span>
                    {hasDiscount && (
                      <span className={styles.originalPrice}>
                        {product.price.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
