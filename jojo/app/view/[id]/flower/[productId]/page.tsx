import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import FlowerDetailContent from './FlowerDetailContent';
import './flower-detail.css';

// 서버 사이드 Supabase 클라이언트
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 캐시된 상품 조회 (1시간) - 캐시 키 동적 생성
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
        { revalidate: 3600 } // 1시간 캐시
    );
    return getCached();
}

// 서버 컴포넌트 - 상품 데이터를 서버에서 미리 불러옴
export default async function FlowerDetailPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
    const { id, productId } = await params;

    // 캐시된 상품 데이터 조회
    const product = await getCachedProduct(productId);

    if (!product) {
        return (
            <div className="flower-detail-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <a href={`/view/${id}`}>돌아가기</a>
            </div>
        );
    }

    return <FlowerDetailContent initialProduct={product} bugoId={id} />;
}
