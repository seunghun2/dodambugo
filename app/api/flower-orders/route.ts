import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendFlowerOrderNotification } from '@/lib/slack';
import { sendAlimtalk } from '@/lib/solapi';

// 알림톡 템플릿 ID
const ALIMTALK_TEMPLATES = {
    FLOWER_PAYMENT_COMPLETE: 'KA01TP2601311316586435pxsJOWuWbz',  // 화환 결제완료
    FLOWER_DELIVERY_COMPLETE: 'KA01TP260127010157157MBMxvZX3qUI', // 화환 배송완료
};

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
            .select('*')
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
                product_id: body.product_id, // sort_order 값 (정수)
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

        // 🔔 슬랙/알림톡은 결제 완료 후 approve API에서 발송

        return NextResponse.json({ order: data, order_number: orderNumber, id: data.id });
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
            .select('*')
            .single();

        if (error) {
            console.error('주문 상태 업데이트 에러:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 📱 배송완료 알림톡 발송 (주문자에게) - 별도 API로 이동됨
        // delivery-notify API에서 처리


        return NextResponse.json({ order: data });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
