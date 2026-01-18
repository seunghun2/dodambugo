import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import FlowerDetailContent from './FlowerDetailContent';
import './flower-detail.css';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface FlowerProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    discount_price: number | null;
    images: string[];
}

// 서버 컴포넌트 - 상품 데이터를 서버에서 미리 불러옴
export default async function FlowerDetailPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
    const { id, productId } = await params;
    const supabase = getSupabase();

    // 상품 데이터 조회
    const { data: product } = await supabase
        .from('flower_products')
        .select('*')
        .eq('id', productId)
        .single();

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
