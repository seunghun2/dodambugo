import { NextRequest, NextResponse } from 'next/server';

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
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
