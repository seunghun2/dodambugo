import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { signAdminToken, verifyAdmin } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_LOGIN_FAILS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

function safeComparePassword(input: string, expected: string): boolean {
    const a = Buffer.from(String(input || ''), 'utf8');
    const b = Buffer.from(String(expected || ''), 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
    if (verifyAdmin(request)) {
        return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const isProdDomain = host.includes('maeumbugo.co.kr');
    const res = NextResponse.json({ success: true });
    const clearOpts: any = { path: '/', maxAge: 0 };
    if (isProdDomain) clearOpts.domain = '.maeumbugo.co.kr';
    res.cookies.set('admin_token', '', clearOpts);
    res.cookies.set('admin_ip', '', clearOpts);
    return res;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            console.error('ADMIN_PASSWORD not set in environment variables');
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // 1. 브루트포스 방어: 최근 15분 내 동일 IP의 로그인 실패 횟수 확인
        const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString();
        const { count: recentFails } = await supabase
            .from('suspicious_activity')
            .select('*', { count: 'exact', head: true })
            .eq('ip_address', ip)
            .eq('type', 'admin_login_fail')
            .gte('created_at', windowStart);

        if ((recentFails || 0) >= MAX_LOGIN_FAILS) {
            return NextResponse.json(
                { error: '비밀번호 오류가 누적되어 15분간 로그인이 제한됩니다.' },
                { status: 429 }
            );
        }

        if (safeComparePassword(String(password ?? ''), adminPassword)) {
            if (ip && ip !== 'unknown') {
                await Promise.all([
                    supabase
                        .from('blocked_ips')
                        .update({ is_active: false, reason: '[자동 해제] 어드민 로그인' })
                        .eq('ip_address', ip),
                    supabase
                        .from('suspicious_activity')
                        .delete()
                        .eq('ip_address', ip)
                        .eq('type', 'admin_login_fail'),
                ]);
            }

            const host = request.headers.get('host') || '';
            const isProdDomain = host.includes('maeumbugo.co.kr');
            const adminToken = signAdminToken();

            const response = NextResponse.json({ success: true, token: adminToken });
            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365,
                path: '/',
            };

            if (isProdDomain) {
                cookieOptions.domain = '.maeumbugo.co.kr';
            }

            response.cookies.set('admin_token', adminToken, cookieOptions);
            response.cookies.set('admin_ip', adminToken, cookieOptions);
            return response;
        } else {
            await supabase.from('suspicious_activity').insert({
                ip_address: ip,
                type: 'admin_login_fail',
                detail: '어드민 비밀번호 불일치',
                user_agent: request.headers.get('user-agent') || '',
            });
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
