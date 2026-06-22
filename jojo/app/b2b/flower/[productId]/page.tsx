'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FlowerDetailContent from './FlowerDetailContent';
import styles from './detail.module.css';

interface FlowerProduct {
  id: string;
  sort_order: number;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  images: string[];
}

export default function B2BFlowerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<FlowerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('b2b_token');
    const userData = localStorage.getItem('b2b_user');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }

    const fetchProduct = async () => {
      try {
        const productNumber = parseInt(productId);
        if (isNaN(productNumber)) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('flower_products')
          .select('*')
          .eq('sort_order', productNumber)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('B2B 화환 상세 정보 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [router, productId, mounted]);

  if (!mounted || loading) {
    return (
      <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>상품 상세 정보를 불러오는 중입니다</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>상품을 찾을 수 없습니다</h2>
          <button className={styles.errorBtn} onClick={() => router.push('/b2b/flower')}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <FlowerDetailContent product={product} />;
}
