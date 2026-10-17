// 받는 사람 후보(조의금 낸 사람 / 화환 보낸 사람) 조회 규칙.
// route.ts 는 핸들러 외 export 가 불가능해서 공용 로직을 이 파일에 둔다.

import { getSupabase } from './auth';
import { normalizePhone } from './phone';

// 조의금(condolence) 정산 완료 상태 / 화환(flower) 결제 완료 상태 — 기존 화면(view, condolence history)과 같은 기준
export const CONDOLENCE_OK = ['transferred', 'completed'];
export const FLOWER_OK = ['completed', 'delivered'];

/** 주문 생성 시 서버에서 ref → 실제 전화번호 조회 (권한 범위 검증 포함) */
export async function resolveRefPhone(
    ref: string,
    bugo: { id: string; bugo_number: string },
    session: { o: boolean; n: string }
): Promise<{ name: string; phone: string; source: 'condolence' | 'flower' } | null> {
    const supabase = getSupabase();

    if (ref.startsWith('c:')) {
        const id = Number(ref.slice(2));
        if (!Number.isInteger(id)) return null;
        const { data } = await supabase
            .from('condolence_orders')
            .select('buyer_name, buyer_phone, recipient_name, status, bugo_number')
            .eq('id', id)
            .single();
        if (!data || data.bugo_number !== bugo.bugo_number || !CONDOLENCE_OK.includes(data.status)) return null;
        // 대표상주가 아니면 본인에게 들어온 조의금만
        if (!session.o && data.recipient_name !== session.n) return null;
        return { name: (data.buyer_name || '').trim(), phone: normalizePhone(data.buyer_phone), source: 'condolence' };
    }

    if (ref.startsWith('f:')) {
        const id = ref.slice(2);
        if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
        const { data } = await supabase
            .from('flower_orders')
            .select('sender_name, sender_phone, status, bugo_id')
            .eq('id', id)
            .single();
        if (!data || data.bugo_id !== bugo.id || !FLOWER_OK.includes(data.status)) return null;
        return { name: (data.sender_name || '').trim(), phone: normalizePhone(data.sender_phone), source: 'flower' };
    }

    return null;
}
