import { NextRequest, NextResponse } from 'next/server';
import {
    GIFT_COOKIE,
    clientIp,
    createSessionToken,
    findBugo,
    isLockedOut,
    readSession,
    recordAuthFailure,
    sessionCookieOptions,
    verifyMourner,
} from '@/lib/gift/auth';

export const dynamic = 'force-dynamic';

// GET: 현재 상주 인증 상태
export async function GET(req: NextRequest) {
    const bugoId = req.nextUrl.searchParams.get('bugoId');
    if (!bugoId) return NextResponse.json({ authenticated: false });
    const bugo = await findBugo(bugoId);
    if (!bugo) return NextResponse.json({ authenticated: false });
    const s = readSession(req, bugo.bugo_number);
    return NextResponse.json({ authenticated: !!s, name: s?.n ?? null, isOwner: s?.o ?? false });
}

// POST: 상주 확인 (이름 + 연락처 뒷 4자리)
export async function POST(req: NextRequest) {
    try {
        const { bugoId, name, last4 } = await req.json();
        if (!bugoId || !name || !last4) {
            return NextResponse.json({ error: '이름과 연락처 뒷 4자리를 입력해주세요.' }, { status: 400 });
        }

        const bugo = await findBugo(String(bugoId));
        if (!bugo) return NextResponse.json({ error: '부고를 찾을 수 없습니다.' }, { status: 404 });

        const ip = clientIp(req);
        if (await isLockedOut(ip, bugo.bugo_number)) {
            return NextResponse.json(
                { error: '확인 시도가 너무 많습니다. 15분 뒤에 다시 시도해주세요.' },
                { status: 429 }
            );
        }

        const result = verifyMourner(bugo, String(name), String(last4));
        if (!result.ok) {
            await recordAuthFailure(req, bugo.bugo_number);
            return NextResponse.json({ error: '입력하신 정보가 일치하지 않습니다.' }, { status: 401 });
        }

        const res = NextResponse.json({ success: true, name: result.name, isOwner: result.isOwner });
        res.cookies.set(GIFT_COOKIE, createSessionToken(bugo, result.name, result.isOwner), sessionCookieOptions);
        return res;
    } catch (e) {
        console.error('[gift/auth]', e);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE: 로그아웃
export async function DELETE() {
    const res = NextResponse.json({ success: true });
    res.cookies.set(GIFT_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
    return res;
}
