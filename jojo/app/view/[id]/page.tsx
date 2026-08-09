import { createClient } from '@supabase/supabase-js';
import { Suspense, cache } from 'react';
import { redirect } from 'next/navigation';
import ViewContent from './ViewContent';
import Link from 'next/link';
import Image from 'next/image';
import './view.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 서버 사이드 Supabase 클라이언트
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 부고 조회 (React cache로 같은 요청 내 중복 쿼리 방지)
const getBugo = cache(async (id: string) => {
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;

    if (isUUID) {
        const result = await supabase.from('bugo').select('*').eq('id', id).is('deleted_at', null).limit(1);
        return result.data?.[0] || null;
    } else {
        const result = await supabase.from('bugo').select('*').eq('bugo_number', id).is('deleted_at', null).order('created_at', { ascending: false }).limit(1);
        return result.data?.[0] || null;
    }
});

// 상품 조회 (캐시 없음 - 실시간)
const getProducts = async () => {
    const supabase = getSupabase();
    const result = await supabase.from('flower_products').select('*').eq('is_active', true).order('sort_order', { ascending: true });
    return result.data || [];
};

// 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // React cache()로 getBugo 재사용 — BugoContentLoader와 동일 요청 내 DB 1번만 조회
    const data = await getBugo(id);

    if (!data) {
        return { title: '부고장을 찾을 수 없습니다 | 마음부고' };
    }

    return {
        title: `故 ${data.deceased_name}님 부고장 | 마음부고`,
        description: data.funeral_home ? `${data.funeral_home}` : '',
    };
}

// 스켈레톤 컴포넌트 (Suspense fallback용)
function BugoSkeleton() {
    return (
        <div className="view-container">
            <div className="skeleton-header" />
            <section className="section deceased-section" style={{ padding: '24px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton-box skeleton-title" />
                    <div className="skeleton-box skeleton-text-lg" />
                    <div className="skeleton-box skeleton-text-md" />
                </div>
            </section>
            <section className="section" style={{ padding: '20px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '12px' }}>
                            <div className="skeleton-box skeleton-label" />
                            <div className="skeleton-box skeleton-value" />
                        </div>
                    ))}
                </div>
            </section>
            <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
                <div className="skeleton-box skeleton-button" />
            </div>
        </div>
    );
}

// 데이터 fetch + 렌더링 담당 (async server component)
async function BugoContentLoader({ id, searchParams }: { id: string; searchParams: URLSearchParams }) {
    // 캐시된 부고 데이터 조회 (60초 캐시)
    const bugoData = await getBugo(id);

    // B2B 부고장인 경우 B2B 전용 뷰 경로로 즉시 리다이렉트 (쿼리 파라미터 유지)
    if (bugoData && bugoData.b2b_user_id) {
        const qs = searchParams.toString();
        redirect(`/b2b/view/${id}${qs ? `?${qs}` : ''}`);
    }

    // 부고를 찾을 수 없는 경우
    if (!bugoData) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <Image src="/images/mourning-ribbon.png" alt="추모" className="error-ribbon" width={80} height={100} />
                    <h2>부고장을 찾을 수 없습니다</h2>
                    <p>요청하신 부고장이 존재하지 않거나 삭제되었습니다.</p>
                    <Link href="/" className="btn-home">홈으로</Link>
                </div>
            </div>
        );
    }

    // JSON 파싱
    if (bugoData.mourners && typeof bugoData.mourners === 'string') {
        try { bugoData.mourners = JSON.parse(bugoData.mourners); } catch (e) { }
    }
    if (bugoData.account_info && typeof bugoData.account_info === 'string') {
        try { bugoData.account_info = JSON.parse(bugoData.account_info); } catch (e) { }
    }

    // 화환 주문 & 상품 병렬 조회 (상품은 캐시 사용)
    const supabase = getSupabase();
    const [ordersResult, productsData] = await Promise.all([
        supabase.from('flower_orders').select('sender_name, ribbon_text1, ribbon_text2').eq('bugo_id', bugoData.id).in('status', ['completed', 'delivered']).order('created_at', { ascending: false }),
        getProducts()
    ]);

    const rawFlowerOrders = ordersResult.data || [];
    
    // 중복 이름 제거 (동일한 표시 이름이 여러 개일 경우 가장 최근 1건만 노출)
    const flowerOrders: typeof rawFlowerOrders = [];
    const seenNames = new Set<string>();
    
    for (const order of rawFlowerOrders) {
        const displayName = (order.ribbon_text2 || order.sender_name || '').trim();
        if (displayName && !seenNames.has(displayName)) {
            seenNames.add(displayName);
            flowerOrders.push(order);
        }
    }

    // 화환 상품 필터링
    const funeralAddress = bugoData.address || bugoData.funeral_home || '';
    const funeralHomeName = bugoData.funeral_home || '';

    const filteredProducts = productsData.filter(product => {
        // 제외 장례식장 체크
        if (product.exclude_facilities && product.exclude_facilities.length > 0) {
            const isExcludedFacility = product.exclude_facilities.some((facility: string) =>
                funeralHomeName.includes(facility) || facility.includes(funeralHomeName)
            );
            if (isExcludedFacility) return false;
        }

        // 제외 지역 체크
        if (product.exclude_regions && product.exclude_regions.length > 0) {
            const isExcludedRegion = product.exclude_regions.some((region: string) =>
                funeralAddress.includes(region)
            );
            if (isExcludedRegion) return false;
        }

        // 노출 지역 체크 (비어있으면 전국 노출)
        if (product.include_regions && product.include_regions.length > 0) {
            const isIncludedRegion = product.include_regions.some((region: string) =>
                funeralAddress.includes(region)
            );
            if (!isIncludedRegion) return false;
        }

        return true;
    });

    return (
        <ViewContent
            initialBugo={bugoData}
            initialFlowerOrders={flowerOrders}
            initialFlowerProducts={filteredProducts}
        />
    );
}

// 메인 페이지 컴포넌트 - Suspense로 Streaming 적용
export default async function ViewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params;
    const sp = await searchParams;
    const urlSearchParams = new URLSearchParams();
    Object.entries(sp).forEach(([key, val]) => {
        if (typeof val === 'string') urlSearchParams.set(key, val);
    });

    return (
        <Suspense fallback={<BugoSkeleton />}>
            <BugoContentLoader id={id} searchParams={urlSearchParams} />
        </Suspense>
    );
}
