import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    const { orderNumber } = await params;

    if (orderNumber.startsWith('CO')) {
        return NextResponse.json({
            success: true,
            order: {
                id: 1,
                order_number: orderNumber,
                bugo_number: '12345',
                buyer_name: '이순신',
                buyer_phone: '010-9876-5432',
                recipient_name: '김상주',
                amount: 50000,
                fee: 1500,
                total_amount: 51500,
                payment_method: 'CARD',
                status: 'COMPLETED',
                tid: 'mock-tid-condolence',
                bank_name: '국민은행',
                account_no: '123456-78-901234',
                receipt_url: '',
                created_at: new Date().toISOString()
            }
        });
    }

    return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
    );
}
