import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabase } from '@/lib/gift/auth';
import { isLiveMode } from '@/lib/gift/issuer';
import GiftSendContent from './GiftSendContent';
import './gift-send.css';

// 상주 개인 작업 화면: 검색엔진 노출 금지, 캐시 금지
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: '답례품과 함께 보내기 | 마음부고',
    robots: { index: false, follow: false },
};

export default async function GiftSendPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ product?: string }>;
}) {
    const { id } = await params;
    const { product } = await searchParams;
    const supabase = getSupabase();

    // 상품 상세(고지)를 거치지 않은 직접 접근은 서버에서 바로 목록으로 보낸다. (클라이언트에서 돌리면 화면이 잠깐 보였다 사라짐)
    const { data: productRow } = product
        ? await supabase
              .from('gift_products')
              .select('id, brand, name, category, list_price, sale_price, image_url, badge')
              .eq('id', product)
              .eq('is_active', true)
              .maybeSingle()
        : { data: null };
    if (!productRow) redirect(`/view/${id}/gift`);

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
            initialProduct={productRow}
            live={isLiveMode()}
            deceasedName={bugo.deceased_name || ''}
            mournerName={bugo.mourner_name || ''}
            religion={bugo.religion || null}
            thanksReligion={bugo.thanks_religion || null}
            thanksMessage={bugo.thanks_message ?? null}
        />
    );
}
