import { NextRequest, NextResponse } from 'next/server';
import { findBugo, getSupabase, readSession } from '@/lib/gift/auth';
import { isResponse, requireMourner } from '@/lib/gift/guard';
import { isValidMobile, maskPhone, normalizePhone, phoneDedupeKey } from '@/lib/gift/phone';
import { CONDOLENCE_OK, FLOWER_OK } from '@/lib/gift/recipient-source';

export const dynamic = 'force-dynamic';

interface Row {
    ref: string;
    dedupeKey?: string;
    name: string;
    maskedPhone: string;
    summary: string;
    count: number;
    valid: boolean;
    source: 'condolence' | 'flower';
}

// GET: 받는 사람 후보 목록 (조의금 낸 사람 / 화환 보낸 사람 / 통합 조회 / 인원수 조회)
// 전화번호는 마스킹해서 내려주고, 실제 번호는 주문 생성 시 서버가 ref 로 다시 조회한다.
// 단, 조의금과 화환을 둘 다 보낸 동일인이 중복 선택될 때 자동으로 하나로 합쳐지도록 dedupeKey(단방향 해시)를 내려준다.
export async function GET(req: NextRequest) {
    const source = req.nextUrl.searchParams.get('source') || 'all';
    const bugoParam = req.nextUrl.searchParams.get('bugoId');

    // 인원수만 먼저 표시하기 위한 경량 조회 (개인정보 노출 없음)
    if (source === 'count') {
        if (!bugoParam) return NextResponse.json({ count: 0, condolenceCount: 0, flowerCount: 0 });
        const bugo = await findBugo(bugoParam);
        if (!bugo) return NextResponse.json({ count: 0, condolenceCount: 0, flowerCount: 0 });
        const session = readSession(req, bugo.bugo_number);
        const supabase = getSupabase();

        let cq = supabase
            .from('condolence_orders')
            .select('id, buyer_phone, recipient_name')
            .eq('bugo_number', bugo.bugo_number)
            .in('status', CONDOLENCE_OK);
        if (session && !session.o) cq = cq.eq('recipient_name', session.n);

        const [{ data: cData }, { data: fData }] = await Promise.all([
            cq,
            supabase
                .from('flower_orders')
                .select('id, sender_phone')
                .eq('bugo_id', bugo.id)
                .in('status', FLOWER_OK),
        ]);

        const cPhones = new Set<string>();
        const fPhones = new Set<string>();
        const allPhones = new Set<string>();

        for (const o of cData ?? []) {
            const p = normalizePhone(o.buyer_phone);
            const k = p || `c:${o.id}`;
            cPhones.add(k);
            allPhones.add(k);
        }
        for (const o of fData ?? []) {
            const p = normalizePhone(o.sender_phone);
            const k = p || `f:${o.id}`;
            fPhones.add(k);
            allPhones.add(k);
        }

        return NextResponse.json({
            count: allPhones.size,
            condolenceCount: cPhones.size,
            flowerCount: fPhones.size,
        });
    }

    const guarded = await requireMourner(req, bugoParam);
    if (isResponse(guarded)) return guarded;
    const { bugo, session } = guarded;

    const supabase = getSupabase();
    const byPhone = new Map<string, Row & { _amount: number; _flowerNote?: string }>();

    if (source === 'condolence' || source === 'all') {
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
            const key = phone || `id:c:${o.id}`;
            const prev = byPhone.get(key);
            if (prev) {
                prev.count += 1;
                prev._amount += o.amount || 0;
                prev.summary = `조의금 ${prev._amount.toLocaleString('ko-KR')}원 (${prev.count}건)`;
            } else {
                byPhone.set(key, {
                    ref: `c:${o.id}`,
                    dedupeKey: phone ? phoneDedupeKey(phone) : undefined,
                    name: (o.buyer_name || '').trim(),
                    maskedPhone: phone ? maskPhone(phone) : '번호 없음',
                    summary: `조의금 ${(o.amount || 0).toLocaleString('ko-KR')}원`,
                    count: 1,
                    valid: isValidMobile(phone),
                    source: 'condolence',
                    _amount: o.amount || 0,
                });
            }
        }
    }

    if (source === 'flower' || source === 'all') {
        const { data, error } = await supabase
            .from('flower_orders')
            .select('id, sender_name, sender_phone, product_name, created_at')
            .eq('bugo_id', bugo.id)
            .in('status', FLOWER_OK)
            .order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: '목록을 불러오지 못했습니다.' }, { status: 500 });

        for (const o of data ?? []) {
            const phone = normalizePhone(o.sender_phone);
            const key = phone || `id:f:${o.id}`;
            const prev = byPhone.get(key);
            if (prev) {
                // 조의금과 화환을 모두 보낸 동일인이면 요약에 화환 내역도 함께 병기
                const flowerLabel = o.product_name || '근조화환';
                if (prev.source === 'condolence' && !prev.summary.includes(flowerLabel)) {
                    prev.summary = `${prev.summary} · ${flowerLabel}`;
                } else {
                    prev.count += 1;
                }
                continue;
            }
            byPhone.set(key, {
                ref: `f:${o.id}`,
                dedupeKey: phone ? phoneDedupeKey(phone) : undefined,
                name: (o.sender_name || '').trim(),
                maskedPhone: phone ? maskPhone(phone) : '번호 없음',
                summary: o.product_name || '근조화환',
                count: 1,
                valid: isValidMobile(phone),
                source: 'flower',
                _amount: 0,
            });
        }
    }

    if (source !== 'condolence' && source !== 'flower' && source !== 'all') {
        return NextResponse.json({ error: 'source는 condolence, flower, all 중 하나여야 합니다.' }, { status: 400 });
    }

    const items: Row[] = [...byPhone.values()].map((v) => ({
        ref: v.ref,
        dedupeKey: v.dedupeKey,
        name: v.name,
        maskedPhone: v.maskedPhone,
        summary: v.summary,
        count: v.count,
        valid: v.valid,
        source: v.source,
    }));
    return NextResponse.json({ items });
}
