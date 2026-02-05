import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 차단할 IP 목록
const BLOCKED_IPS = [
    '183.98.166.235', // 아이리스코퍼레이션
];

export function middleware(request: NextRequest) {
    // 클라이언트 IP 가져오기
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '';

    // 차단 IP 체크
    if (BLOCKED_IPS.includes(ip)) {
        // 차단 페이지로 리다이렉트 또는 403 반환
        return new NextResponse('접근이 제한되었습니다.', { status: 403 });
    }

    return NextResponse.next();
}

// 모든 페이지에 적용 (API, 정적 파일 제외)
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
