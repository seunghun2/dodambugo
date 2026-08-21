import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signAdminToken } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        // 환경변수에서 관리자 비밀번호 확인
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('ADMIN_PASSWORD not set in environment variables');
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        if (password === adminPassword) {
            // 로그인 성공 → IP 차단 해제
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || request.headers.get('x-real-ip')
                || '';

            if (ip) {
                // blocked_ips에서 해제
                await supabase
                    .from('blocked_ips')
                    .update({ is_active: false, reason: '[자동 해제] 어드민 로그인' })
                    .eq('ip_address', ip);
            }

            // 응답에 암호화된 관리자 JWT 토큰 쿠키 설정
            const host = request.headers.get('host') || '';
            const isProdDomain = host.includes('maeumbugo.co.kr');
            const adminToken = signAdminToken();

            const response = NextResponse.json({ success: true, token: adminToken });
            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365, // 1년
                path: '/',
            };

            if (isProdDomain) {
                cookieOptions.domain = '.maeumbugo.co.kr';
            }

            response.cookies.set('admin_token', adminToken, cookieOptions);
            response.cookies.set('admin_ip', adminToken, cookieOptions);
            return response;
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
