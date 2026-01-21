'use server';

import { NextRequest, NextResponse } from 'next/server';

// 이노페이 결제 승인 API
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tid, mid, moid, amt, taxFreeAmt = 0 } = body;

        // 필수 파라미터 확인
        if (!tid || !mid || !moid || !amt) {
            return NextResponse.json(
                { error: '필수 파라미터가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 이노페이 결제 승인 API 호출
        const response = await fetch('https://api.innopay.co.kr/v1/transactions/pay', {
            method: 'POST',
            headers: {
                'Payment-Token': 'paymentToken', // TODO: 실제 토큰으로 변경
                'Merchant-Key': process.env.INNOPAY_MERCHANT_KEY || '', // TODO: 실제 키 설정
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                tid,
                mid,
                moid,
                amt,
                taxFreeAmt,
            }),
        });

        const result = await response.json();

        if (response.ok && result.resultCode === '0000') {
            // 결제 성공
            return NextResponse.json({
                success: true,
                message: '결제가 완료되었습니다.',
                data: result,
            });
        } else {
            // 결제 실패
            return NextResponse.json({
                success: false,
                error: result.resultMsg || '결제 승인에 실패했습니다.',
                data: result,
            }, { status: 400 });
        }
    } catch (error) {
        console.error('결제 승인 오류:', error);
        return NextResponse.json(
            { error: '결제 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
