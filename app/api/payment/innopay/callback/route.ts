'use server';

import { NextRequest, NextResponse } from 'next/server';

// 이노페이 결제 결과 콜백 (returnUrl)
// 결제창에서 인증 완료 후 리다이렉트되는 URL
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // 이노페이에서 전달받는 파라미터
        const resultCode = formData.get('resultCode') as string;
        const resultMsg = formData.get('resultMsg') as string;
        const tid = formData.get('tid') as string;
        const mid = formData.get('mid') as string;
        const moid = formData.get('moid') as string;
        const amt = formData.get('amt') as string;
        const payMethod = formData.get('payMethod') as string;

        console.log('이노페이 콜백:', { resultCode, resultMsg, tid, moid, amt });

        if (resultCode === '0000') {
            // 인증 성공 → 결제 승인 API 호출
            const approveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/innopay/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tid,
                    mid,
                    moid,
                    amt: parseInt(amt),
                }),
            });

            const approveResult = await approveResponse.json();

            if (approveResult.success) {
                // 결제 성공 → 완료 페이지로 리다이렉트
                // moid에서 bugoId 추출 (예: MBG20260121_bugoId_productId)
                return NextResponse.redirect(
                    new URL(`/order/complete?moid=${moid}&success=true`, request.url)
                );
            } else {
                // 결제 승인 실패
                return NextResponse.redirect(
                    new URL(`/order/complete?moid=${moid}&success=false&msg=${encodeURIComponent(approveResult.error)}`, request.url)
                );
            }
        } else {
            // 인증 실패
            return NextResponse.redirect(
                new URL(`/order/complete?success=false&msg=${encodeURIComponent(resultMsg)}`, request.url)
            );
        }
    } catch (error) {
        console.error('콜백 처리 오류:', error);
        return NextResponse.redirect(
            new URL('/order/complete?success=false&msg=처리중오류', request.url)
        );
    }
}

// GET 요청도 처리 (일부 PG는 GET으로 리다이렉트)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const resultCode = searchParams.get('resultCode');
    const resultMsg = searchParams.get('resultMsg');
    const tid = searchParams.get('tid');
    const moid = searchParams.get('moid');

    console.log('이노페이 콜백 (GET):', { resultCode, resultMsg, tid, moid });

    if (resultCode === '0000') {
        return NextResponse.redirect(
            new URL(`/order/complete?moid=${moid}&success=true`, request.url)
        );
    } else {
        return NextResponse.redirect(
            new URL(`/order/complete?success=false&msg=${encodeURIComponent(resultMsg || '결제실패')}`, request.url)
        );
    }
}
