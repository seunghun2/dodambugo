import { createClient } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import ViewContent from './ViewContent';
import Link from 'next/link';
import Image from 'next/image';
import './view.css';

// 캐시 비활성화 - 계좌 노출 설정 등 실시간 반영 필요
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 서버 사이드 Supabase 클라이언트
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 부고 조회 (실시간 - 계좌 노출 설정 즉시 반영)
const getBugo = async (id: string) => {
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;

    if (isUUID) {
        const result = await supabase.from('bugo').select('*').eq('id', id).is('deleted_at', null).limit(1);
        return result.data?.[0] || null;
    } else {
        const result = await supabase.from('bugo').select('*').eq('bugo_number', id).is('deleted_at', null).order('created_at', { ascending: false }).limit(1);
        return result.data?.[0] || null;
    }
};

// 캐시된 상품 조회 (30초)
const getCachedProducts = unstable_cache(
    async () => {
        const supabase = getSupabase();
        const result = await supabase.from('flower_products').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        return result.data || [];
    },
    ['flower-products'],
    { revalidate: 30 }
);

// 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;

    let data = null;
    if (isUUID) {
        const result = await supabase.from('bugo').select('deceased_name, funeral_home').eq('id', id).limit(1);
        data = result.data?.[0];
    } else {
        const result = await supabase.from('bugo').select('deceased_name, funeral_home').eq('bugo_number', id).limit(1);
        data = result.data?.[0];
    }

    if (!data) {
        return { title: '부고장을 찾을 수 없습니다 | 부고온' };
    }

    return {
        title: `故 ${data.deceased_name}님 모바일 부고장`,
        description: data.funeral_home ? `${data.funeral_home}` : '',
    };
}

// 스켈레톤 컴포넌트
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

// 데이터 fetch + 렌더링 담당
async function B2BBugoContentLoader({ id }: { id: string }) {
    const bugoData = await getBugo(id);

    if (!bugoData) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <Image src="/images/mourning-ribbon.png" alt="추모" className="error-ribbon" width={80} height={100} />
                    <h2>부고장을 찾을 수 없습니다</h2>
                    <p>요청하신 부고장이 존재하지 않거나 삭제되었습니다.</p>
                    <Link href="/b2b/dashboard" className="btn-home">대시보드로</Link>
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

    const supabase = getSupabase();
    const [ordersResult, productsData] = await Promise.all([
        supabase.from('flower_orders').select('sender_name, ribbon_text1, ribbon_text2').eq('bugo_id', bugoData.id).in('status', ['completed', 'delivered']).order('created_at', { ascending: false }),
        getCachedProducts()
    ]);

    const rawFlowerOrders = ordersResult.data || [];
    
    // 중복 이름 제거
    const flowerOrders: typeof rawFlowerOrders = [];
    const seenNames = new Set<string>();
    
    for (const order of rawFlowerOrders) {
        const displayName = (order.ribbon_text2 || order.sender_name || '').trim();
        if (displayName && !seenNames.has(displayName)) {
            seenNames.add(displayName);
            flowerOrders.push(order);
        }
    }

    const funeralAddress = bugoData.address || bugoData.funeral_home || '';
    const funeralHomeName = bugoData.funeral_home || '';

    const filteredProducts = productsData.filter(product => {
        if (product.exclude_facilities && product.exclude_facilities.length > 0) {
            const isExcludedFacility = product.exclude_facilities.some((facility: string) =>
                funeralHomeName.includes(facility) || facility.includes(funeralHomeName)
            );
            if (isExcludedFacility) return false;
        }

        if (product.exclude_regions && product.exclude_regions.length > 0) {
            const isExcludedRegion = product.exclude_regions.some((region: string) =>
                funeralAddress.includes(region)
            );
            if (isExcludedRegion) return false;
        }

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

// 메인 B2B 부고 뷰 페이지 컴포넌트
export default async function B2BViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <Suspense fallback={<BugoSkeleton />}>
            <B2BBugoContentLoader id={id} />
        </Suspense>
    );
}
