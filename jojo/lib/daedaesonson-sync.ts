/**
 * 대대손손(daedaesonson.com) 장지 리뷰 자동 동기화 모듈
 *
 * 마음부고에서 장지 후기 등록 시 대대손손 Facility DB와 자동 매칭하여
 * 대대손손 Review 테이블에 동기화합니다.
 *
 * - 비동기 fire-and-forget 방식 (마음부고 사용자 응답 차단 없음)
 * - 매칭 신뢰도 75% 미만은 동기화하지 않음 (오매칭 방지)
 * - 블랙리스트 키워드 및 일정/시간 텍스트 자동 필터링
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── 대대손손 Supabase 클라이언트 (싱글톤) ──
let _daedaeClient: SupabaseClient | null = null;
function getDaedaeSupabase(): SupabaseClient | null {
    if (_daedaeClient) return _daedaeClient;

    const url = process.env.DAEDAE_SUPABASE_URL;
    const key = process.env.DAEDAE_SUPABASE_SERVICE_KEY;
    if (!url || !key) {
        console.warn('[daedae-sync] DAEDAE_SUPABASE_URL / DAEDAE_SUPABASE_SERVICE_KEY 환경변수 미설정 — 동기화 비활성');
        return null;
    }
    _daedaeClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return _daedaeClient;
}

// ── 별칭 사전 (마음부고 통칭 → 대대손손 시설 ID) ──
// 실제 burial_reviews 데이터에서 발견된 빈출 별칭을 수동 등록
const ALIAS_MAP: Record<string, string> = {
    // 서울시립승화원 (벽제 소재) — 가장 빈출 별칭
    '벽제승화원': 'park-1479',
    '벽제화장장': 'park-1479',
    '서울승화원': 'park-1479',
    // 울산하늘공원 — '하늘공원'이 다른 시설과 겹침 방지
    '울산하늘공원': 'park-0729',
    // 자하연 (팔당) — 단독 '자하연'은 팔당이 대표
    '팔당자하연': 'park-0145',
    '자하연': 'park-0145',
    // 대전추모공원 — 봉인당/영락원 등 다양한 부속 시설
    '대전추모공원': 'park-0675',
};

// ── 블랙리스트: 이 키워드만 있으면 매칭 시도 안 함 ──
const BLACKLIST = [
    '선영', '선산', '자택', '미정', '추후결정', '협의중',
    '화장', '봉안', '안치', '해양장', '바다', '수목장',
    '가족묘', '유택동산', '화장후봉안', '화장후',
];

// ── 지역명만 있는 입력은 매칭 불가 (오매칭 방지) ──
const REGION_ONLY = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

// ── 정규화 ──
function normalize(s: string): string {
    return (s || '')
        .replace(/\(.*?\)/g, '')        // 괄호 내용 제거
        .replace(/\[.*?\]/g, '')
        .replace(/[ㆍ·・\-–—_]/g, '')   // 중점·대시 제거
        .replace(/[^가-힣a-zA-Z0-9]/g, '') // 특수문자·공백 제거
        .toLowerCase();
}

// ── 날짜/시간 텍스트 제거 ──
// "4월 5일(일) 14:20 영락공원에서 화장" → "영락공원에서"
function stripDatetime(s: string): string {
    return s
        .replace(/\d{1,2}월\s*\d{1,2}일/g, '')
        .replace(/\([월화수목금토일요]\)/g, '')
        .replace(/\d{1,2}[:\uc2dc]\d{0,2}/g, '')
        .replace(/\d{1,2}일\s*[월화수목금토일요]/g, '')
        .replace(/에서\s*(화장|봉안|안치|매장)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ── Bigram 유사도 (Dice's Coefficient) ──
function similarity(a: string, b: string): number {
    const s1 = normalize(a);
    const s2 = normalize(b);

    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    // 포함 관계 가산점
    if (s1.includes(s2) || s2.includes(s1)) {
        const shorter = Math.min(s1.length, s2.length);
        const longer = Math.max(s1.length, s2.length);
        return 0.8 + (shorter / longer) * 0.2;
    }

    const bigrams = (str: string) => {
        const set = new Set<string>();
        for (let i = 0; i < str.length - 1; i++) set.add(str.slice(i, i + 2));
        return set;
    };

    const b1 = bigrams(s1);
    const b2 = bigrams(s2);
    let inter = 0;
    Array.from(b1).forEach(bg => { if (b2.has(bg)) inter++; });
    return (2.0 * inter) / (b1.size + b2.size);
}

// ── 시설 캐시 (프로세스 라이프사이클 동안 유지) ──
interface FacilityRow {
    id: string;
    name: string;
    address: string;
    category: string;
}
let _facilityCache: FacilityRow[] | null = null;
let _facilityCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1시간

async function getAllFacilities(sb: SupabaseClient): Promise<FacilityRow[]> {
    const now = Date.now();
    if (_facilityCache && now - _facilityCacheTime < CACHE_TTL) return _facilityCache;

    // Supabase 기본 limit 1000 → 페이지 분할 조회
    const { data: p1 } = await sb.from('Facility').select('id, name, address, category').range(0, 999);
    const { data: p2 } = await sb.from('Facility').select('id, name, address, category').range(1000, 1999);
    _facilityCache = [...(p1 || []), ...(p2 || [])];
    _facilityCacheTime = now;
    return _facilityCache;
}

// ── 핵심: 장지명 자동 매칭 ──
async function matchFacility(
    burialPlace: string,
    sb: SupabaseClient
): Promise<{ facilityId: string; facilityName: string; score: number } | null> {
    const raw = (burialPlace || '').trim();
    if (!raw || raw.length < 2) return null;

    // 1) 별칭 사전 우선 검색 (블랙리스트/지역 체크보다 앞서야 함)
    const norm = normalize(raw);
    for (const [alias, facilityId] of Object.entries(ALIAS_MAP)) {
        const normAlias = normalize(alias);
        if (norm === normAlias || norm.includes(normAlias)) {
            const facilities = await getAllFacilities(sb);
            const fac = facilities.find(f => f.id === facilityId);
            return fac
                ? { facilityId: fac.id, facilityName: fac.name, score: 1.0 }
                : null;
        }
    }

    // 2) 블랙리스트 검사 — 전체가 블랙리스트 단어뿐이면 스킵
    const isBlacklisted = BLACKLIST.some(kw => {
        const nkw = normalize(kw);
        return norm === nkw || (norm.length <= nkw.length + 2 && norm.includes(nkw));
    });
    if (isBlacklisted) return null;

    // 2b) 지역명만 있는 경우 스킵 (예: '부산 기장군')
    const regionOnly = REGION_ONLY.some(r => {
        const nr = normalize(r);
        return norm.startsWith(nr) && norm.length <= nr.length + 4;
    });
    if (regionOnly) return null;

    // 3) 날짜/시간 제거
    const cleaned = stripDatetime(raw);
    if (normalize(cleaned).length < 2) return null;

    // 4) 전체 시설 대비 유사도 매칭
    const facilities = await getAllFacilities(sb);
    let best: FacilityRow | null = null;
    let bestScore = 0;

    for (const fac of facilities) {
        const score = similarity(cleaned, fac.name);
        if (score > bestScore) {
            bestScore = score;
            best = fac;
        }
    }

    // 75% 이상만 자동 매칭 승인
    if (best && bestScore >= 0.75) {
        return { facilityId: best.id, facilityName: best.name, score: bestScore };
    }

    return null;
}

// ── 메인 동기화 함수 ──
interface SyncParams {
    burialPlace: string;
    mournerName?: string;
    rating: number;
    reviewText?: string;
    photos?: string[];
    bugoNumber: string;
}

export async function syncReviewToDaedaesonson(params: SyncParams): Promise<void> {
    const sb = getDaedaeSupabase();
    if (!sb) return; // 환경변수 미설정 시 무시

    const { burialPlace, mournerName, rating, reviewText, photos, bugoNumber } = params;

    // 1) 시설 매칭
    const match = await matchFacility(burialPlace, sb);
    if (!match) {
        console.log(`[daedae-sync] 미매칭 스킵: "${burialPlace}" (bugo:${bugoNumber})`);
        return;
    }

    console.log(`[daedae-sync] 매칭 성공: "${burialPlace}" → ${match.facilityName} (${match.facilityId}, ${Math.round(match.score * 100)}%)`);

    // 2) 중복 체크 (동일 부고번호 + 동일 시설)
    const { data: existing } = await sb
        .from('Review')
        .select('id')
        .eq('facilityId', match.facilityId)
        .eq('source', 'maeumbugo')
        .ilike('content', `%bugo:${bugoNumber}%`)
        .maybeSingle();

    if (existing) {
        console.log(`[daedae-sync] 이미 동기화됨 (bugo:${bugoNumber} → ${match.facilityId})`);
        return;
    }

    // 3) 리뷰 INSERT
    const author = mournerName ? `${mournerName.charAt(0)}${'*'.repeat(mournerName.length - 1)}` : '마음부고 이용자';
    const content = [
        reviewText || '(후기 본문 없음)',
        `\n[bugo:${bugoNumber}]`, // 중복 방지용 태그 (비노출)
    ].join('');

    const { error: insertErr } = await sb.from('Review').insert({
        facilityId: match.facilityId,
        author,
        content,
        rating: Number(rating),
        password: null,
        photos: photos || [],
        likes: 0,
        userId: null,
        source: 'maeumbugo',
        sourceUrl: null,
        sourceDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    });

    if (insertErr) {
        console.error('[daedae-sync] Review INSERT 실패:', insertErr);
        return;
    }

    // 4) Facility reviewCount + 평균 rating 재계산
    const { data: allReviews } = await sb
        .from('Review')
        .select('rating')
        .eq('facilityId', match.facilityId);

    if (allReviews && allReviews.length > 0) {
        const avgRating = parseFloat(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        );
        await sb
            .from('Facility')
            .update({ reviewCount: allReviews.length, rating: avgRating })
            .eq('id', match.facilityId);
    }

    console.log(`[daedae-sync] 동기화 완료: bugo:${bugoNumber} → ${match.facilityName} (⭐${rating})`);
}
