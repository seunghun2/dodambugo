import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/gift/auth';

export const dynamic = 'force-dynamic';

// GET: 전체 답례품 상품 목록 (노출 + 숨김 모두, 다우 상품코드 포함)
export async function GET(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getSupabase();
    const { data, error } = await sb
        .from('gift_products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[admin/gift-products GET]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST: 신규 답례품 등록
export async function POST(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const brand = String(body.brand || '').trim();
        const name = String(body.name || '').trim();
        const category = String(body.category || '기타').trim() || '기타';
        const list_price = Math.max(0, Number(body.list_price) || 0);
        const sale_price = Math.max(0, Number(body.sale_price) || 0);
        const image_url = body.image_url ? String(body.image_url).trim() : null;
        const badge = body.badge ? String(body.badge).trim() : null;
        const daou_sheet = body.daou_sheet ? String(body.daou_sheet).trim() : null;
        const daou_goods_code = body.daou_goods_code ? String(body.daou_goods_code).trim() : null;
        const is_active = body.is_active !== undefined ? Boolean(body.is_active) : true;

        if (!brand || !name) {
            return NextResponse.json({ error: '브랜드와 상품명은 필수입니다.' }, { status: 400 });
        }
        if (sale_price <= 0) {
            return NextResponse.json({ error: '판매가는 0원보다 커야 합니다.' }, { status: 400 });
        }

        const sb = getSupabase();
        let sort_order = typeof body.sort_order === 'number' ? body.sort_order : null;

        if (sort_order === null) {
            const { data: maxRow } = await sb
                .from('gift_products')
                .select('sort_order')
                .order('sort_order', { ascending: false })
                .limit(1)
                .maybeSingle();
            sort_order = ((maxRow?.sort_order as number) || 0) + 10;
        }

        const { data, error } = await sb
            .from('gift_products')
            .insert({
                brand,
                name,
                category,
                list_price: list_price || sale_price,
                sale_price,
                image_url,
                badge,
                daou_sheet,
                daou_goods_code,
                sort_order,
                is_active,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: '동일한 브랜드에 같은 상품명이 이미 등록되어 있습니다.' }, { status: 409 });
            }
            console.error('[admin/gift-products POST]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ product: data });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}

// PATCH: 단건 수정 또는 일괄 순서/상태/뱃지 변경
export async function PATCH(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const sb = getSupabase();
        const now = new Date().toISOString();

        // 1) 일괄 업데이트 (위치 배치 / 일괄 노출 / 일괄 뱃지)
        if (Array.isArray(body.bulk)) {
            const items: Array<{
                id: string;
                sort_order?: number;
                is_active?: boolean;
                badge?: string | null;
            }> = body.bulk;

            await Promise.all(
                items.map((item) => {
                    const patch: Record<string, any> = { updated_at: now };
                    if (typeof item.sort_order === 'number') patch.sort_order = item.sort_order;
                    if (typeof item.is_active === 'boolean') patch.is_active = item.is_active;
                    if (item.badge !== undefined) patch.badge = item.badge ? String(item.badge).trim() : null;
                    return sb.from('gift_products').update(patch).eq('id', item.id);
                })
            );

            return NextResponse.json({ ok: true, count: items.length });
        }

        // 2) 단건 업데이트
        const id = body.id;
        if (!id) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const patch: Record<string, any> = { updated_at: now };
        if (body.brand !== undefined) patch.brand = String(body.brand).trim();
        if (body.name !== undefined) patch.name = String(body.name).trim();
        if (body.category !== undefined) patch.category = String(body.category).trim() || '기타';
        if (body.list_price !== undefined) patch.list_price = Math.max(0, Number(body.list_price) || 0);
        if (body.sale_price !== undefined) patch.sale_price = Math.max(0, Number(body.sale_price) || 0);
        if (body.image_url !== undefined) patch.image_url = body.image_url ? String(body.image_url).trim() : null;
        if (body.badge !== undefined) patch.badge = body.badge ? String(body.badge).trim() : null;
        if (body.daou_sheet !== undefined) patch.daou_sheet = body.daou_sheet ? String(body.daou_sheet).trim() : null;
        if (body.daou_goods_code !== undefined) patch.daou_goods_code = body.daou_goods_code ? String(body.daou_goods_code).trim() : null;
        if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order;
        if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

        const { data, error } = await sb
            .from('gift_products')
            .update(patch)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: '동일한 브랜드에 같은 상품명이 이미 존재합니다.' }, { status: 409 });
            }
            console.error('[admin/gift-products PATCH]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ product: data });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}

// DELETE: 답례품 상품 삭제 (기존 주문의 스냅샷은 유지하고 product_id 참조만 해제 후 삭제)
export async function DELETE(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        let id = url.searchParams.get('id');
        if (!id) {
            const body = await request.json().catch(() => ({}));
            id = body.id;
        }
        if (!id) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const sb = getSupabase();

        // 주문 이력 스냅샷(product_name, unit_price)은 보존하되 FK 참조만 null 처리
        await sb.from('gift_orders').update({ product_id: null }).eq('product_id', id);

        const { error } = await sb.from('gift_products').delete().eq('id', id);
        if (error) {
            console.error('[admin/gift-products DELETE]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}
