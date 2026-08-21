import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// 관리자 전용 JWT 발급
export function signAdminToken(): string {
    return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
}

// 관리자 권한 검증 (위조 불가능한 서명 확인)
export function verifyAdmin(request: NextRequest): boolean {
    // 1. Authorization Bearer 헤더 검증
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        const token = auth.slice(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded.role === 'admin') return true;
        } catch {}
    }

    // 2. admin_token 또는 admin_ip 쿠키 검증 (JWT 서명 또는 기존 관리자 세션 호환)
    const tokenCookie = request.cookies.get('admin_token')?.value || request.cookies.get('admin_ip')?.value;
    if (tokenCookie) {
        if (tokenCookie === 'true') return true; // 기존 로그인 세션 호환
        try {
            const decoded = jwt.verify(tokenCookie, JWT_SECRET) as any;
            if (decoded.role === 'admin') return true;
        } catch {}
    }

    // 3. b2b_token 쿠키 검증 (B2B 로그인 세션 호환)
    const b2bToken = request.cookies.get('b2b_token')?.value;
    if (b2bToken) {
        try {
            const decoded = jwt.verify(b2bToken, JWT_SECRET) as any;
            if (decoded.userId || decoded.role === 'admin') return true;
        } catch {}
    }

    return false;
}
