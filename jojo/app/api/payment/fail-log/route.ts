import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 결제 실패 사유 기록 (콜백 페이지에서 호출)
 * - stage: pg_result(PG가 실패 반환) | missing_token(토큰/tid 누락) | approve(승인 API 실패/예외)
 * - 화환 주문이면 슬랙(#화환 채널)으로 즉시 알림 → 주문자에게 직접 연락해 구제 가능
 */

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cut = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : null);

const STAGE_LABEL: Record<string, string> = {
    pg_result: 'PG 실패 반환',
    missing_token: '토큰 누락',
    approve: '승인 실패',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const stage = cut(body.stage, 30);
        if (!stage || !STAGE_LABEL[stage]) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        const orderId = typeof body.orderId === 'string' && UUID_RE.test(body.orderId) ? body.orderId : null;
        const ua = request.headers.get('user-agent') || '';
        const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;

        const row = {
            bugo_id: cut(body.bugoId, 40),
            order_id: orderId,
            moid: cut(body.moid, 80),
            stage,
            result_code: cut(body.code, 40),
            result_msg: cut(body.msg, 500),
            pay_method: cut(body.payMethod, 20),
            amt: cut(body.amt, 20),
            user_agent: ua.slice(0, 400),
            ip,
        };

        const supabase = getSupabase();
        const { error } = await supabase.from('payment_fail_logs').insert(row);
        if (error) console.error('payment_fail_logs insert 실패:', error.message);

        // 화환 주문이면 슬랙 알림 (pending 상태일 때만)
        if (orderId) {
            const { data: order } = await supabase
                .from('flower_orders')
                .select('bugo_id, product_name, product_price, sender_name, sender_phone, funeral_home, status')
                .eq('id', orderId)
                .maybeSingle();

            const webhook = process.env.SLACK_WEBHOOK_FLOWER || process.env.SLACK_WEBHOOK_URL;
            if (order && order.status === 'pending' && webhook) {
                const browser = /KAKAOTALK/i.test(ua) ? '카카오톡' : /SamsungBrowser/i.test(ua) ? '삼성인터넷'
                    : /NAVER/i.test(ua) ? '네이버앱' : /CriOS|Chrome/i.test(ua) ? '크롬'
                    : /Safari/i.test(ua) ? '사파리' : '기타';
                const text = [
                    `[결제실패] ${STAGE_LABEL[stage]}`,
                    `- 상품: ${order.product_name} / ${Number(order.product_price || 0).toLocaleString()}원`,
                    `- 주문자: ${order.sender_name}(${order.sender_phone})`,
                    `- 빈소: ${order.funeral_home || '-'}`,
                    `- 사유: [${row.result_code || '-'}] ${row.result_msg || '-'}`,
                    `- 결제수단: ${row.pay_method || '-'} / 브라우저: ${browser}`,
                    `- 부고장: https://maeumbugo.co.kr/view/${order.bugo_id}`,
                ].join('\n');
                await fetch(webhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                }).catch(() => {});
            }
        }

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('fail-log 오류:', e?.message);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
