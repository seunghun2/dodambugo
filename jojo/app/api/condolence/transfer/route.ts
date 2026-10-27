import { NextRequest, NextResponse } from 'next/server';

// ⛔ 이 route는 더 이상 사용하지 않음
// 송금은 approve/route.ts에서 직접 이노페이 프록시(49.50.139.204)로 처리
// 이 route를 호출하면 이중 송금이 발생하므로 완전 차단

export async function POST(request: NextRequest) {
    console.warn('⛔ /api/condolence/transfer 호출됨 - 차단됨 (approve에서 이미 처리)', {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
    });
    return NextResponse.json({
        success: true,
        message: '송금은 approve route에서 이미 처리되었습니다.',
        skipped: true
    });
}
