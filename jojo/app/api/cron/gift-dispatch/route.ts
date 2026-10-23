import { NextRequest, NextResponse } from 'next/server';
import { dispatchDueGiftOrders } from '@/lib/gift/dispatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 결제 후 10분 경과한 답례품 주문을 자동 발송 (Vercel Cron, 5분 주기)
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const res = await dispatchDueGiftOrders();
        return NextResponse.json({ ok: true, ...res });
    } catch (e: any) {
        console.error('[cron/gift-dispatch]', e);
        return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 });
    }
}
