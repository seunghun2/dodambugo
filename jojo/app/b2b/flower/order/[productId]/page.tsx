import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import OrderContent from './OrderContent';

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getCachedProduct(productNumber: string) {
  const getCached = unstable_cache(
    async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('flower_products')
        .select('*')
        .eq('sort_order', parseInt(productNumber))
        .single();
      return data;
    },
    [`flower-product-${productNumber}`],
    { revalidate: 3600 }
  );
  return getCached();
}

export default async function B2BOrderPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const productData = await getCachedProduct(productId);

  if (!productData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        fontFamily: 'sans-serif',
        gap: '16px'
      }}>
        <h2>상품을 찾을 수 없습니다.</h2>
        <a href="/b2b/flower" style={{
          padding: '10px 20px',
          backgroundColor: '#3A8F47',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>돌아가기</a>
      </div>
    );
  }

  return (
    <OrderContent
      initialProduct={productData}
      productId={productId}
    />
  );
}
