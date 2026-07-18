import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const { orderId } = await params;

    if (orderId.startsWith('MG')) {
        return NextResponse.json({
            id: 'mock-id-123',
            order_number: orderId,
            product_name: '근조화환 3단',
            product_price: 100000,
            sender_name: '홍길동',
            sender_phone: '010-1234-5678',
            recipient_name: '김상주',
            funeral_home: '서울대학교병원 장례식장',
            room: '1호실',
            address: '서울 종로구 대학로 101',
            ribbon_text1: '삼가 고인의 명복을 빕니다',
            ribbon_text2: '주식회사 테스트',
            status: 'COMPLETED',
            payment_method: 'card',
            created_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
            bugo_id: 'mock-bugo-id',
            bugo_number: '12345',
            tid: 'mock-tid-12345'
        });
    }

    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
}
