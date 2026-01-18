import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ViewContent from './ViewContent';
import Link from 'next/link';
import './view.css';

// 서버 사이드 Supabase 클라이언트
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: { params: { id: string } }) {
    const supabase = getSupabase();
    const id = params.id;
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
        return { title: '부고장을 찾을 수 없습니다 | 마음부고' };
    }

    return {
        title: `故 ${data.deceased_name}님 부고장 | 마음부고`,
        description: data.funeral_home ? `${data.funeral_home}` : '',
    };
}

// 서버 컴포넌트 - 데이터를 서버에서 미리 불러옴
export default async function ViewPage({ params }: { params: { id: string } }) {
    const supabase = getSupabase();
    const id = params.id;
    const isUUID = id.includes('-') && id.length > 10;

    // 부고 데이터 조회
    let bugoData = null;
    if (isUUID) {
        const result = await supabase.from('bugo').select('*').eq('id', id).limit(1);
        bugoData = result.data?.[0] || null;
    } else {
        const result = await supabase.from('bugo').select('*').eq('bugo_number', id).order('created_at', { ascending: false }).limit(1);
        bugoData = result.data?.[0] || null;
    }

    // 부고를 찾을 수 없는 경우
    if (!bugoData) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <img src="/images/mourning-ribbon.png" alt="추모" className="error-ribbon" />
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

    // 화환 주문 & 상품 병렬 조회
    const [ordersResult, productsResult] = await Promise.all([
        supabase.from('flower_orders').select('sender_name, ribbon_text1, ribbon_text2').eq('bugo_id', bugoData.id).order('created_at', { ascending: false }),
        supabase.from('flower_products').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);

    const flowerOrders = ordersResult.data || [];

    // 화환 상품 필터링
    const productsData = productsResult.data || [];
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
