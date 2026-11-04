import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 주문 조회에 필요한 컬럼만 선택 (buyer_phone, receipt_url 등 불필요한 개인정보 제외)
const ORDER_COLUMNS =
    'id, order_number, moid, bugo_number, buyer_name, recipient_name, amount, fee, total_amount, payment_method, tid, bank_name, account_no, created_at';

// 계좌번호는 뒤 4자리만 노출
function maskAccountNo(accountNo?: string | null) {
    if (!accountNo) return accountNo ?? null;
    const digits = String(accountNo).replace(/\s/g, '');
    if (digits.length <= 4) return digits;
    return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

// 클라이언트에 내려줄 필드만 화이트리스트로 반환 (내부 식별자 moid/id 제외)
function toPublicOrder(order: any) {
    return {
        order_number: order.order_number,
        bugo_number: order.bugo_number,
        buyer_name: order.buyer_name,
        recipient_name: order.recipient_name,
        amount: order.amount,
        fee: order.fee,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        tid: order.tid,
        bank_name: order.bank_name,
        account_no: maskAccountNo(order.account_no),
        created_at: order.created_at,
    };
}

// 부의금 주문번호로 주문 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    const { orderNumber } = await params;

    if (!orderNumber) {
        return NextResponse.json({ error: '주문번호가 필요합니다.' }, { status: 400 });
    }

    try {
        if (orderNumber.startsWith('DO')) {
            // B2B DO 주문번호 → B2B 순번으로 조회 (DO000001, DO000002...)
            const doNum = parseInt(orderNumber.replace('DO', ''), 10);
            if (isNaN(doNum) || doNum < 1) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }

            // moid가 BCOND_로 시작하는 주문 또는 source가 b2b인 주문
            const { data: allOrders } = await supabase
                .from('condolence_orders')
                .select(ORDER_COLUMNS)
                .order('id', { ascending: true });

            const b2bOrders = (allOrders || []).filter(
                (o: any) => o.moid?.startsWith('BCOND_') || o.source === 'b2b'
            );

            const targetOrder: any = b2bOrders[doNum - 1];
            if (!targetOrder) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            targetOrder.order_number = 'DO' + String(doNum).padStart(6, '0');
            return NextResponse.json({ success: true, order: toPublicOrder(targetOrder) });

        } else if (orderNumber.startsWith('BCOND_')) {
            // B2B moid로 직접 조회시에도 DO 순번 계산하여 반환
            const { data: allOrders } = await supabase
                .from('condolence_orders')
                .select(ORDER_COLUMNS)
                .order('id', { ascending: true });

            const b2bOrders = (allOrders || []).filter(
                (o: any) => o.moid?.startsWith('BCOND_') || o.source === 'b2b'
            );

            const targetIdx = b2bOrders.findIndex((o: any) => o.moid === orderNumber);
            if (targetIdx === -1) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }

            const targetOrder: any = b2bOrders[targetIdx];
            targetOrder.order_number = 'DO' + String(targetIdx + 1).padStart(6, '0');
            return NextResponse.json({ success: true, order: toPublicOrder(targetOrder) });

        } else if (orderNumber.startsWith('CO')) {
            const { data, error } = await supabase
                .from('condolence_orders')
                .select(ORDER_COLUMNS)
                .eq('order_number', orderNumber)
                .single();
            if (error || !data) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, order: toPublicOrder(data) });

        } else if (orderNumber.startsWith('COND_')) {
            const { data, error } = await supabase
                .from('condolence_orders')
                .select(ORDER_COLUMNS)
                .eq('moid', orderNumber)
                .single();
            if (error || !data) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, order: toPublicOrder(data) });

        } else {
            const { data, error } = await supabase
                .from('condolence_orders')
                .select(ORDER_COLUMNS)
                .eq('id', orderNumber)
                .single();
            if (error || !data) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, order: toPublicOrder(data) });
        }
    } catch (err) {
        console.error('부의금 주문 조회 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
