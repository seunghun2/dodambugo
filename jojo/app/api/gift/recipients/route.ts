import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/gift/auth';
import { isResponse, requireMourner } from '@/lib/gift/guard';
import { isValidMobile, maskPhone, normalizePhone } from '@/lib/gift/phone';
import { CONDOLENCE_OK, FLOWER_OK } from '@/lib/gift/recipient-source';

export const dynamic = 'force-dynamic';

interface Row {
    ref: string;
    name: string;
    maskedPhone: string;
    summary: string;
    count: number;
    valid: boolean;
}

// GET: 받는 사람 후보 목록 (조의금 낸 사람 / 화환 보낸 사람)
// 전화번호는 마스킹해서 내려주고, 실제 번호는 주문 생성 시 서버가 ref 로 다시 조회한다.
export async function GET(req: NextRequest) {
    const guarded = await requireMourner(req, req.nextUrl.searchParams.get('bugoId'));
    if (isResponse(guarded)) return guarded;
    const { bugo, session } = guarded;

    const source = req.nextUrl.searchParams.get('source');
    const supabase = getSupabase();
    const byPhone = new Map<string, Row & { _amount: number }>();

    if (source === 'condolence') {
        let q = supabase
            .from('condolence_orders')
            .select('id, buyer_name, buyer_phone, amount, recipient_name, created_at')
            .eq('bugo_number', bugo.bugo_number)
            .in('status', CONDOLENCE_OK)
            .order('created_at', { ascending: false });
        // 대표상주가 아니면 본인에게 들어온 조의금만 (기존 조의금 내역 화면과 동일한 기준)
        if (!session.o) q = q.eq('recipient_name', session.n);
        const { data, error } = await q;
        if (error) return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 500 });

        for (const o of data ?? []) {
            const phone = normalizePhone(o.buyer_phone);
            const key = phone || `id:${o.id}`;
            const prev = byPhone.get(key);
            if (prev) {
                prev.count += 1;
                prev._amount += o.amount || 0;
                prev.summary = `조의금 ${prev._amount.toLocaleString('ko-KR')}원 (${prev.count}건)`;
            } else {
                byPhone.set(key, {
                    ref: `c:${o.id}`,
                    name: (o.buyer_name || '').trim(),
                    maskedPhone: phone ? maskPhone(phone) : '번호 없음',
                    summary: `조의금 ${(o.amount || 0).toLocaleString('ko-KR')}원`,
                    count: 1,
                    valid: isValidMobile(phone),
                    _amount: o.amount || 0,
                });
            }
        }
    } else if (source === 'flower') {
        const { data, error } = await supabase
            .from('flower_orders')
            .select('id, sender_name, sender_phone, product_name, created_at')
            .eq('bugo_id', bugo.id)
            .in('status', FLOWER_OK)
            .order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 500 });

        for (const o of data ?? []) {
            const phone = normalizePhone(o.sender_phone);
            const key = phone || `id:${o.id}`;
            const prev = byPhone.get(key);
            if (prev) {
                prev.count += 1;
                continue;
            }
            byPhone.set(key, {
                ref: `f:${o.id}`,
                name: (o.sender_name || '').trim(),
                maskedPhone: phone ? maskPhone(phone) : '번호 없음',
                summary: o.product_name || '근조화환',
                count: 1,
                valid: isValidMobile(phone),
                _amount: 0,
            });
        }
    } else {
        return NextResponse.json({ error: 'source는 condolence 또는 flower 여야 합니다.' }, { status: 400 });
    }

    const items: Row[] = [...byPhone.values()].map((v) => ({
        ref: v.ref,
        name: v.name,
        maskedPhone: v.maskedPhone,
        summary: v.summary,
        count: v.count,
        valid: v.valid,
    }));
    return NextResponse.json({ items });
}
