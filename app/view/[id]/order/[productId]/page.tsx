import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import OrderContent from './OrderContent';
import './order.css';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 캐시된 부고 조회 (5분)
const getCachedBugo = unstable_cache(
    async (bugoId: string, isUUID: boolean) => {
        const supabase = getSupabase();
        if (isUUID) {
            const { data } = await supabase
                .from('bugo')
                .select('id, bugo_number, deceased_name, funeral_home, room_number, address, mourners, mourner_name')
                .eq('id', bugoId)
                .limit(1);
            return data?.[0] || null;
        } else {
            const { data } = await supabase
                .from('bugo')
                .select('id, bugo_number, deceased_name, funeral_home, room_number, address, mourners, mourner_name')
                .eq('bugo_number', bugoId)
                .order('created_at', { ascending: false })
                .limit(1);
            return data?.[0] || null;
        }
    },
    ['bugo-order'],
    { revalidate: 300 } // 5분 캐시
);

// 캐시된 상품 조회 (1시간)
const getCachedProduct = unstable_cache(
    async (productNumber: string) => {
        const supabase = getSupabase();
        const { data } = await supabase
            .from('flower_products')
            .select('*')
            .eq('sort_order', parseInt(productNumber))
            .single();
        return data;
    },
    ['flower-product-order'],
    { revalidate: 3600 } // 1시간 캐시
);

// 서버 컴포넌트 - 캐시된 데이터 사용
export default async function OrderPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
    const { id, productId } = await params;
    const isUUID = id.includes('-') && id.length > 10;

    // 병렬 캐시 조회
    const [bugoData, productData] = await Promise.all([
        getCachedBugo(id, isUUID),
        getCachedProduct(productId)
    ]);

    if (!productData) {
        return (
            <div className="order-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <a href={`/view/${id}`}>돌아가기</a>
            </div>
        );
    }

    return (
        <OrderContent
            initialBugo={bugoData}
            initialProduct={productData}
            bugoId={id}
            productId={productId}
        />
    );
}
