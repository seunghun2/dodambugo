import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import FlowerDetailContent from '@/app/view/[id]/flower/[productId]/FlowerDetailContent';
import '@/app/view/[id]/flower/[productId]/flower-detail.css';

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

export default async function B2BFlowerDetailPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
    const { id, productId } = await params;
    const product = await getCachedProduct(productId);

    if (!product) {
        return (
            <div className="flower-detail-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <a href={`/b2b/view/${id}`}>돌아가기</a>
            </div>
        );
    }

    return <FlowerDetailContent initialProduct={product} bugoId={id} />;
}
