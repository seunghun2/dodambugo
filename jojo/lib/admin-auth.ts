import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// 관리자 토큰 전용 서명 키 (B2B 파트너 JWT와 분리 — 코드에 공개된 기본키로는 관리자 토큰을 위조할 수 없음)
// 운영에서 ADMIN_JWT_SECRET이 없으면 기본키로 폴백하지 않고 관리자 인증을 거부(fail-closed)
function getAdminSecret(): string | null {
    if (process.env.ADMIN_JWT_SECRET) return process.env.ADMIN_JWT_SECRET;
    if (process.env.NODE_ENV !== 'production') return JWT_SECRET; // 로컬 개발 편의용
    return null;
}

// 관리자 전용 JWT 발급 (쿠키 maxAge 1년과 동일하게 365일 설정)
export function signAdminToken(): string {
    const secret = getAdminSecret();
    if (!secret) throw new Error('ADMIN_JWT_SECRET is not configured');
    return jwt.sign({ role: 'admin' }, secret, { expiresIn: '365d' });
}

// 관리자 권한 검증 (위조 불가능한 서명 확인 — Referer 및 단순 문자열 우회 원천 차단)
export function verifyAdmin(request: NextRequest): boolean {
    const secret = getAdminSecret();
    if (!secret) return false;

    // 1. Authorization Bearer 헤더 검증
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        const token = auth.slice(7);
        try {
            const decoded = jwt.verify(token, secret) as any;
            if (decoded?.role === 'admin') return true;
        } catch {}
    }

    // 2. admin_token 및 admin_ip 쿠키 각각 서명 검증
    const candidates = [
        request.cookies.get('admin_token')?.value,
        request.cookies.get('admin_ip')?.value,
    ].filter(Boolean) as string[];

    for (const tokenCookie of candidates) {
        try {
            const decoded = jwt.verify(tokenCookie, secret) as any;
            if (decoded?.role === 'admin') return true;
        } catch {}
    }

    return false;
}
