import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendFlowerOrderNotification } from '@/lib/slack';

// 함수 내에서 supabase 클라이언트 생성 (빌드 타임 에러 방지)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 주문 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const bugoId = searchParams.get('bugo_id');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('flower_orders')
            .select('*, bugo:bugo_id(deceased_name, bugo_number)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }
        if (bugoId) {
            query = query.eq('bugo_id', bugoId);
        }

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: data, count });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: 새 주문 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();

        const orderNumber = `MG${Date.now()}`;

        const { data, error } = await supabase
            .from('flower_orders')
            .insert({
                bugo_id: body.bugo_id,
                product_id: body.product_id,
                product_name: body.product_name,
                product_price: body.product_price,
                sender_name: body.sender_name,
                sender_phone: body.sender_phone,
                recipient_name: body.recipient_name,
                funeral_home: body.funeral_home,
                room: body.room,
                address: body.address,
                ribbon_text1: body.ribbon_text1,
                ribbon_text2: body.ribbon_text2,
                payment_method: body.payment_method || 'card',
                status: 'pending',
                order_number: orderNumber,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 🔔 슬랙 알림 전송 (비동기, 실패해도 주문은 성공)
        sendFlowerOrderNotification({
            id: orderNumber,
            deceased_name: body.recipient_name || '미입력',
            sender_name: body.sender_name,
            sender_phone: body.sender_phone,
            product_name: body.product_name,
            price: body.product_price,
            ribbon_text: body.ribbon_text1 ? `${body.ribbon_text1} / ${body.ribbon_text2 || ''}` : undefined,
            funeral_hall: body.funeral_home,
            payment_method: body.payment_method || 'card',
            created_at: new Date().toISOString(),
        }).catch(err => console.error('Slack 알림 실패:', err));

        return NextResponse.json({ order: data, order_number: orderNumber });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH: 주문 상태 업데이트
export async function PATCH(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();
        const { id, status, partner_order_id, partner_data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (status) updateData.status = status;
        if (partner_order_id) updateData.partner_order_id = partner_order_id;
        if (partner_data) updateData.partner_data = partner_data;

        const { data, error } = await supabase
            .from('flower_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ order: data });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
