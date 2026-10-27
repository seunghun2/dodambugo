import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저 클라이언트(supabase-js)에서 접근 허용된 테이블 목록
const CLIENT_ALLOWED_TABLES = new Set([
    'bugo',
    'guestbook',
    'inquiries',
    'facilities',
    'flower_products',
    'flower_categories',
    'condolence_config',
    'condolence_amounts',
    'condolence_orders',
    'gift_products',
    'blocked_phones',
    'ritual_shares',
    'facility_corrections',
    'burial_reviews',
]);

async function handleProxy(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path } = await context.params;
    const table = path?.[0] || '';
    const method = request.method.toUpperCase();
    const isAdmin = verifyAdmin(request);
    const searchParams = request.nextUrl.searchParams;

    if (!table) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // 1. 어드민이 아니면 허용된 테이블만 접근 가능
    if (!isAdmin && !CLIENT_ALLOWED_TABLES.has(table)) {
        return NextResponse.json({ error: 'Forbidden table' }, { status: 403 });
    }

    let rawBody: string | undefined = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
        rawBody = await request.text();
    }

    // 2. 핵심 테이블(bugo) 보안 정책 강제
    if (table === 'bugo' && !isAdmin) {
        const hasSingleId =
            (searchParams.get('id') || '').startsWith('eq.') ||
            (searchParams.get('bugo_number') || '').startsWith('eq.');
        const hasB2BUserFilter = (searchParams.get('b2b_user_id') || '').startsWith('eq.');

        if (method === 'GET' || method === 'HEAD') {
            // 홈 검색(or 조건 + 비민감 컬럼만 조회) 여부 확인
            const selectParam = (searchParams.get('select') || '*').toLowerCase();
            const isSafePublicSearch =
                searchParams.has('or') &&
                !selectParam.includes('*') &&
                !selectParam.includes('account_info') &&
                !selectParam.includes('phone_password') &&
                !selectParam.includes('applicant_phone') &&
                !selectParam.includes('owner_token');

            if (!hasSingleId && !hasB2BUserFilter && !isSafePublicSearch) {
                return NextResponse.json(
                    { error: 'Forbidden: 전체 부고 목록 일괄 조회는 차단되어 있습니다.' },
                    { status: 403 }
                );
            }
        } else if (method === 'PATCH') {
            // 단건 지정 없는 일괄 UPDATE 원천 차단
            if (!hasSingleId) {
                return NextResponse.json(
                    { error: 'Forbidden: 단건 지정 없는 부고 수정은 차단되어 있습니다.' },
                    { status: 403 }
                );
            }

            // 계좌번호(account_info)나 상주목록(mourners)을 변경하려는 경우 정당한 수정 폼 요청인지 검증
            if (rawBody) {
                try {
                    const parsed = JSON.parse(rawBody);
                    const keys = Object.keys(parsed || {});
                    const isSimpleCounterOrSoftDelete =
                        keys.length === 1 &&
                        (keys[0] === 'view_count' ||
                            keys[0] === 'share_count' ||
                            keys[0] === 'deleted_at');

                    if (!isSimpleCounterOrSoftDelete) {
                        const referer = request.headers.get('referer') || '';
                        const isFromEditPage =
                            referer.includes('/create') ||
                            referer.includes('/b2b/create') ||
                            referer.includes('/b2b/manage') ||
                            referer.includes('/b2b/ritual');

                        // 수정 페이지 외에서 임의로 계좌/상주 정보만 덮어쓰는 API 직접 호출 차단
                        if (
                            !isFromEditPage ||
                            (!parsed.deceased_name && !parsed.mourner_name && !parsed.mourners)
                        ) {
                            return NextResponse.json(
                                { error: 'Forbidden: 비정상적인 부고 수정 요청입니다.' },
                                { status: 403 }
                            );
                        }
                    }
                } catch {
                    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
                }
            }
        } else if (method === 'DELETE') {
            // 단건 + B2B 본인 부고 삭제 외에는 하드 삭제 차단
            if (!hasSingleId || !hasB2BUserFilter) {
                return NextResponse.json(
                    { error: 'Forbidden: 부고 영구 삭제 권한이 없습니다.' },
                    { status: 403 }
                );
            }
        }
    }

    // 3. condolence_orders 테이블은 클라이언트에서 SELECT만 허용 (쓰기/수정/삭제 차단)
    if (table === 'condolence_orders' && !isAdmin && method !== 'GET' && method !== 'HEAD') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Supabase PostgREST로 안전하게 프록시 전달 (서버 전용 service_role 키 사용)
    const targetUrl = `${SUPABASE_URL}/rest/v1/${path.join('/')}${request.nextUrl.search}`;
    const forwardHeaders: Record<string, string> = {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    const contentType = request.headers.get('content-type');
    if (contentType) forwardHeaders['Content-Type'] = contentType;

    const prefer = request.headers.get('prefer');
    if (prefer) forwardHeaders['Prefer'] = prefer;

    const accept = request.headers.get('accept');
    if (accept) forwardHeaders['Accept'] = accept;

    const acceptProfile = request.headers.get('accept-profile');
    if (acceptProfile) forwardHeaders['Accept-Profile'] = acceptProfile;

    const contentProfile = request.headers.get('content-profile');
    if (contentProfile) forwardHeaders['Content-Profile'] = contentProfile;

    const range = request.headers.get('range');
    if (range) forwardHeaders['Range'] = range;

    const upstreamRes = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body: rawBody,
        cache: 'no-store',
    });

    const resBody = await upstreamRes.arrayBuffer();
    const resHeaders = new Headers();
    const copyHeaderNames = ['content-type', 'content-range', 'preference-applied'];
    for (const h of copyHeaderNames) {
        const val = upstreamRes.headers.get(h);
        if (val) resHeaders.set(h, val);
    }

    return new NextResponse(resBody, {
        status: upstreamRes.status,
        headers: resHeaders,
    });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
