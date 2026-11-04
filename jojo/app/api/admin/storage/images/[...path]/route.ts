import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function handleStorageProxy(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { path } = await context.params;
    if (!path || path.length === 0) {
        return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const method = request.method.toUpperCase();
    const targetUrl = `${SUPABASE_URL}/storage/v1/object/images/${path.join('/')}${request.nextUrl.search}`;

    const forwardHeaders: Record<string, string> = {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    for (const h of ['content-type', 'cache-control', 'x-upsert']) {
        const val = request.headers.get(h);
        if (val) forwardHeaders[h] = val;
    }

    const body = method !== 'GET' && method !== 'HEAD' ? await request.arrayBuffer() : undefined;

    const upstreamRes = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body,
        cache: 'no-store',
    });

    const resBody =
        upstreamRes.status === 204 || method === 'HEAD' ? null : await upstreamRes.arrayBuffer();
    const resHeaders = new Headers();
    const ct = upstreamRes.headers.get('content-type');
    if (ct) resHeaders.set('content-type', ct);

    return new NextResponse(resBody, {
        status: upstreamRes.status,
        headers: resHeaders,
    });
}

export const POST = handleStorageProxy;
export const PUT = handleStorageProxy;
export const DELETE = handleStorageProxy;
