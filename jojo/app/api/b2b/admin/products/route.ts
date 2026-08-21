import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화 (RLS 우회를 위해 Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for B2B admin API');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// GET: flower_products 및 flower_categories 조회
export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        // flower_products 조회 (sort_order 오름차순, created_at 내림차순)
        const { data: products, error: productsError } = await supabase
            .from('flower_products')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // flower_categories 조회 (sort_order 오름차순)
        const { data: categories, error: categoriesError } = await supabase
            .from('flower_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;

        return NextResponse.json({
            success: true,
            products: products || [],
            categories: categories || []
        });
    } catch (error: any) {
        console.error('B2B 상품/카테고리 조회 API 오류:', error);
        return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// POST: 신규 상품 등록
export async function POST(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            name,
            price,
            discount_price,
            category,
            images,
            description,
            is_active,
            sort_order
        } = body;

        if (!name || price === undefined) {
            return NextResponse.json({ error: '상품명과 가격은 필수 항목입니다.' }, { status: 400 });
        }

        const { data: product, error } = await supabase
            .from('flower_products')
            .insert({
                name,
                price: Number(price),
                discount_price: (discount_price !== null && discount_price !== undefined) ? Number(discount_price) : null,
                category: category || '근조화환',
                images: images || [],
                description: description || '',
                is_active: is_active ?? true,
                sort_order: sort_order !== undefined ? Number(sort_order) : 0
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error('B2B 상품 등록 API 오류:', error);
        return NextResponse.json({ error: '상품을 등록하는데 실패했습니다.' }, { status: 500 });
    }
}

// PATCH: 상품 수정
export async function PATCH(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            id,
            name,
            price,
            discount_price,
            category,
            images,
            description,
            is_active,
            sort_order
        } = body;

        if (!id) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = Number(price);
        if (discount_price !== undefined) {
            updateData.discount_price = (discount_price !== null && discount_price !== undefined) ? Number(discount_price) : null;
        }
        if (category !== undefined) updateData.category = category;
        if (images !== undefined) updateData.images = images;
        if (description !== undefined) updateData.description = description;
        if (is_active !== undefined) updateData.is_active = Boolean(is_active);
        if (sort_order !== undefined) updateData.sort_order = Number(sort_order);
        updateData.updated_at = new Date().toISOString();

        const { data: product, error } = await supabase
            .from('flower_products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error('B2B 상품 수정 API 오류:', error);
        return NextResponse.json({ error: '상품을 수정하는데 실패했습니다.' }, { status: 500 });
    }
}

// DELETE: 상품 삭제
export async function DELETE(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        let id = searchParams.get('id');

        if (!id) {
            try {
                const body = await request.json();
                id = body.id;
            } catch (e) {}
        }

        if (!id) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('flower_products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('B2B 상품 삭제 API 오류:', error);
        return NextResponse.json({ error: '상품을 삭제하는데 실패했습니다.' }, { status: 500 });
    }
}
