import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabase } from '@/lib/gift/auth';
import GiftSendContent from './GiftSendContent';
import './gift-send.css';

// 상주 개인 작업 화면: 검색엔진 노출 금지, 캐시 금지
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: '답례품과 함께 보내기 | 마음부고',
    robots: { index: false, follow: false },
};

export default async function GiftSendPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;

    // 화면에 필요한 최소 컬럼만 조회한다. (phone_password / mourners 등 연락처 컬럼은 클라이언트로 내려보내지 않음)
    const cols = 'id, bugo_number, deceased_name, mourner_name, religion, thanks_message, thanks_religion, b2b_user_id';
    const q = supabase.from('bugo').select(cols).is('deleted_at', null);
    const { data } = isUUID
        ? await q.eq('id', id).limit(1)
        : await q.eq('bugo_number', id).order('created_at', { ascending: false }).limit(1);
    const bugo = data?.[0];
    if (!bugo) notFound();

    return (
        <GiftSendContent
            bugoId={id}
            bugoUuid={bugo.id}
            bugoNumber={bugo.bugo_number}
            deceasedName={bugo.deceased_name || ''}
            mournerName={bugo.mourner_name || ''}
            religion={bugo.religion || null}
            thanksReligion={bugo.thanks_religion || null}
            thanksMessage={bugo.thanks_message ?? null}
        />
    );
}
