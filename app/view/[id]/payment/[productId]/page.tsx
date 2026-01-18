import { createClient } from '@supabase/supabase-js';
import PaymentContent from './PaymentContent';
import '@/app/view/[id]/order/[productId]/order.css';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 서버 컴포넌트 - 부고 및 상품 데이터를 서버에서 미리 불러옴
export default async function PaymentPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
    const { id, productId } = await params;
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;

    // 부고 조회
    let bugoData = null;
    if (isUUID) {
        const result = await supabase.from('bugo').select('id, bugo_number, deceased_name').eq('id', id).limit(1);
        bugoData = result.data?.[0] || null;
    } else {
        const result = await supabase.from('bugo').select('id, bugo_number, deceased_name').eq('bugo_number', id).order('created_at', { ascending: false }).limit(1);
        bugoData = result.data?.[0] || null;
    }

    // 상품 조회
    const { data: productData } = await supabase
        .from('flower_products')
        .select('*')
        .eq('id', productId)
        .single();

    if (!productData) {
        return (
            <div className="order-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <a href={`/view/${id}`}>돌아가기</a>
            </div>
        );
    }

    return (
        <PaymentContent
            initialBugo={bugoData}
            initialProduct={productData}
            bugoId={id}
            productId={productId}
        />
    );
}
