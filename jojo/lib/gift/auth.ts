// 답례품 보내기 서버 인증 (상주 확인)
//
// 기존 /view/[id]/condolence/history 의 상주 인증(이름 + 연락처 뒷 4자리)과 같은 기준을 쓰되,
// 기존처럼 브라우저에서 phone_password 를 내려받아 비교하지 않고 서버에서만 비교한다.
// 통과하면 서명된 httpOnly 쿠키를 발급한다. (받는 사람 전화번호·조의금 내역·주문 생성에 필요)

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export const GIFT_COOKIE = 'gift_auth';
const SESSION_SECONDS = 60 * 60 * 2; // 2시간
const FAIL_LIMIT_PER_IP = 5; // 15분 내 같은 IP+부고 실패 한도
const FAIL_LIMIT_PER_BUGO = 20; // 15분 내 같은 부고 전체 실패 한도 (분산 대입 방어)
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const FAIL_TYPE = 'gift_auth_fail';

export function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export interface GiftBugo {
    id: string;
    bugo_number: string;
    deceased_name: string | null;
    mourner_name: string | null;
    phone_password: string | null;
    applicant_phone?: string | null;
    mourners: unknown;
    religion: string | null;
    thanks_message: unknown;
    thanks_religion: string | null;
    b2b_user_id: string | null;
}

const BUGO_COLUMNS =
    'id, bugo_number, deceased_name, mourner_name, phone_password, applicant_phone, mourners, religion, thanks_message, thanks_religion, b2b_user_id';

/** UUID 또는 부고번호로 부고 조회 (삭제된 부고 제외) */
export async function findBugo(idOrNumber: string): Promise<GiftBugo | null> {
    const supabase = getSupabase();
    const isUUID = idOrNumber.includes('-') && idOrNumber.length > 10;
    const q = supabase.from('bugo').select(BUGO_COLUMNS).is('deleted_at', null);
    const { data } = isUUID
        ? await q.eq('id', idOrNumber).limit(1)
        : await q.eq('bugo_number', idOrNumber).order('created_at', { ascending: false }).limit(1);
    return (data?.[0] as GiftBugo) || null;
}

function parseMourners(raw: unknown): Array<{ name?: string; contact?: string }> {
    let v = raw;
    if (typeof v === 'string') {
        try {
            v = JSON.parse(v);
        } catch {
            return [];
        }
    }
    return Array.isArray(v) ? v : [];
}

const digits = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '');

/** 상주 이름 또는 대표상주 연락처에서 휴대폰 번호(숫자 10~11자리) 추출 */
export function resolveMournerPhone(bugo: GiftBugo, mournerName?: string | null): string {
    const targetName = (mournerName || '').trim();
    if (targetName) {
        const hit = parseMourners(bugo.mourners).find(
            (m) => (m.name || '').trim() === targetName && digits(m.contact).startsWith('010')
        );
        if (hit) return digits(hit.contact);
    }
    const primary = digits(bugo.applicant_phone) || digits(bugo.phone_password);
    if (primary.startsWith('010') && (primary.length === 10 || primary.length === 11)) {
        return primary;
    }
    const firstMourner = parseMourners(bugo.mourners).find((m) => digits(m.contact).startsWith('010'));
    return firstMourner ? digits(firstMourner.contact) : '';
}

/** 상주(대표/추가) 본인 확인. 일치하면 이름과 대표상주 여부 반환 */
export function verifyMourner(
    bugo: GiftBugo,
    name: string,
    last4: string
): { ok: boolean; isOwner: boolean; name: string } {
    const n = name.trim();
    const l4 = digits(last4);
    if (!n || l4.length !== 4) return { ok: false, isOwner: false, name: n };

    if (n === (bugo.mourner_name || '').trim() && digits(bugo.phone_password).slice(-4) === l4) {
        return { ok: true, isOwner: true, name: n };
    }
    const hit = parseMourners(bugo.mourners).find(
        (m) => (m.name || '').trim() === n && digits(m.contact).length >= 4 && digits(m.contact).slice(-4) === l4
    );
    return hit ? { ok: true, isOwner: false, name: n } : { ok: false, isOwner: false, name: n };
}

// ---------- 서명된 세션 쿠키 ----------

function signingKey(): Buffer {
    const secret = process.env.GIFT_AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!secret) throw new Error('GIFT_AUTH_SECRET 또는 SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.');
    return crypto.createHash('sha256').update('gift-auth:' + secret).digest();
}

export interface SessionPayload {
    b: string; // bugo_number
    n: string; // 인증한 상주 이름
    o: boolean; // 대표상주 여부
    exp: number; // 만료(epoch sec)
}

/**
 * 상주 확인(이름+뒷4자리) 요구 여부.
 * 기본은 열려 있음(조의금/화환 목록을 바로 보여줌). 실결제를 붙이기 전에 GIFT_REQUIRE_AUTH=true 로 다시 잠글 수 있다.
 */
export function isAuthRequired(): boolean {
    return process.env.GIFT_REQUIRE_AUTH === 'true';
}

/** 인증이 필요 없는 모드에서 쓰는 세션: 대표상주 권한으로 취급 */
export function openSession(bugo: Pick<GiftBugo, 'bugo_number' | 'mourner_name'>): SessionPayload {
    return { b: bugo.bugo_number, n: (bugo.mourner_name || '상주').trim(), o: true, exp: Math.floor(Date.now() / 1000) + 60 };
}

export function createSessionToken(bugo: GiftBugo, name: string, isOwner: boolean): string {
    const payload: SessionPayload = {
        b: bugo.bugo_number,
        n: name,
        o: isOwner,
        exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url');
    return `${body}.${sig}`;
}

export function readSession(req: NextRequest, bugoNumber: string): SessionPayload | null {
    const raw = req.cookies.get(GIFT_COOKIE)?.value;
    if (!raw) return null;
    const [body, sig] = raw.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
        if (p.exp < Math.floor(Date.now() / 1000)) return null;
        if (p.b !== bugoNumber) return null; // 다른 부고용 쿠키로 접근 불가
        return p;
    } catch {
        return null;
    }
}

export const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_SECONDS,
};

// ---------- 실패 횟수 제한 (DB 기반: 서버리스 인스턴스가 바뀌어도 유지) ----------

export function clientIp(req: NextRequest): string {
    return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function isLockedOut(ip: string, bugoNumber: string): Promise<boolean> {
    const since = new Date(Date.now() - FAIL_WINDOW_MS).toISOString();
    const supabase = getSupabase();
    const [byIp, byBugo] = await Promise.all([
        supabase
            .from('suspicious_activity')
            .select('id', { count: 'exact', head: true })
            .eq('type', FAIL_TYPE)
            .eq('ip_address', ip)
            .eq('detail', bugoNumber)
            .gte('created_at', since),
        supabase
            .from('suspicious_activity')
            .select('id', { count: 'exact', head: true })
            .eq('type', FAIL_TYPE)
            .eq('detail', bugoNumber)
            .gte('created_at', since),
    ]);
    return (byIp.count ?? 0) >= FAIL_LIMIT_PER_IP || (byBugo.count ?? 0) >= FAIL_LIMIT_PER_BUGO;
}

export async function recordAuthFailure(req: NextRequest, bugoNumber: string) {
    await getSupabase()
        .from('suspicious_activity')
        .insert({
            ip_address: clientIp(req),
            type: FAIL_TYPE,
            detail: bugoNumber,
            user_agent: req.headers.get('user-agent')?.slice(0, 300) || null,
        });
}
