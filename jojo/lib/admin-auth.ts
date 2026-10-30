import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// 관리자 전용 JWT 발급 (쿠키 maxAge 1년과 동일하게 365일 설정)
export function signAdminToken(): string {
    return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '365d' });
}

// 관리자 권한 검증 (위조 불가능한 서명 확인 — Referer 및 단순 문자열 우회 원천 차단)
export function verifyAdmin(request: NextRequest): boolean {
    // 1. Authorization Bearer 헤더 검증
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        const token = auth.slice(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
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
            const decoded = jwt.verify(tokenCookie, JWT_SECRET) as any;
            if (decoded?.role === 'admin') return true;
        } catch {}
    }

    return false;
}
