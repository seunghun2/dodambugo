import { NextRequest, NextResponse } from 'next/server';
import { findBugo, isAuthRequired, openSession, readSession, type GiftBugo, type SessionPayload } from './auth';

export type Guarded = { bugo: GiftBugo; session: SessionPayload };

/**
 * 부고 존재 확인 + 상주 세션 확인. 실패하면 바로 반환할 수 있는 NextResponse 를 돌려준다.
 * GIFT_REQUIRE_AUTH 가 켜져 있지 않으면(기본) 상주 확인 없이 통과시킨다.
 */
export async function requireMourner(req: NextRequest, bugoIdOrNumber: string | null): Promise<Guarded | NextResponse> {
    if (!bugoIdOrNumber) return NextResponse.json({ error: 'bugoId가 필요합니다.' }, { status: 400 });
    const bugo = await findBugo(bugoIdOrNumber);
    if (!bugo) return NextResponse.json({ error: '부고를 찾을 수 없습니다.' }, { status: 404 });
    const session = readSession(req, bugo.bugo_number);
    if (session) return { bugo, session };
    if (!isAuthRequired()) return { bugo, session: openSession(bugo) };
    return NextResponse.json({ error: '상주 확인이 필요합니다.', code: 'AUTH_REQUIRED' }, { status: 401 });
}

export const isResponse = (v: Guarded | NextResponse): v is NextResponse => v instanceof NextResponse;
