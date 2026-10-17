import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/gift/auth';
import { isLiveMode } from '@/lib/gift/issuer';

export const dynamic = 'force-dynamic';

// GET: 판매 중인 답례품 목록 (공개 정보만. 다우 상품코드는 내려주지 않음)
// live: false 이면 테스트 모드 (실결제·실발송 없음) — 화면에 안내 배너를 띄운다.
export async function GET() {
    const { data, error } = await getSupabase()
        .from('gift_products')
        .select('id, brand, name, category, list_price, sale_price, image_url, badge')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('[gift/products]', error);
        return NextResponse.json({ error: '상품을 불러오지 못했습니다.' }, { status: 500 });
    }
    return NextResponse.json({ products: data ?? [], live: isLiveMode() }, { headers: { 'Cache-Control': 'no-store' } });
}
