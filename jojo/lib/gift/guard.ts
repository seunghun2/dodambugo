import { NextRequest, NextResponse } from 'next/server';
import { findBugo, readSession, type GiftBugo } from './auth';

export type Guarded = { bugo: GiftBugo; session: NonNullable<ReturnType<typeof readSession>> };

/** 부고 존재 + 상주 세션 쿠키 확인. 실패하면 바로 반환할 수 있는 NextResponse 를 돌려준다. */
export async function requireMourner(req: NextRequest, bugoIdOrNumber: string | null): Promise<Guarded | NextResponse> {
    if (!bugoIdOrNumber) return NextResponse.json({ error: 'bugoId가 필요합니다.' }, { status: 400 });
    const bugo = await findBugo(bugoIdOrNumber);
    if (!bugo) return NextResponse.json({ error: '부고를 찾을 수 없습니다.' }, { status: 404 });
    const session = readSession(req, bugo.bugo_number);
    if (!session) return NextResponse.json({ error: '상주 확인이 필요합니다.', code: 'AUTH_REQUIRED' }, { status: 401 });
    return { bugo, session };
}

export const isResponse = (v: Guarded | NextResponse): v is NextResponse => v instanceof NextResponse;
