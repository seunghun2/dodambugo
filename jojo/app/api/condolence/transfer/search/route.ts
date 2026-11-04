import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

// 이노페이 송금(입금이체) 결과 조회 API
// 송금 요청 후 응답을 못 받았거나 타임아웃 시 사용

const INNOPAY_SEARCH_URL = 'https://acct.innopay.co.kr/AcctOutTransSearch.acct';
const INNOPAY_MID = 'bumaeum02m';
const INNOPAY_LICENSE_KEY = process.env.INNOPAY_TRANSFER_LICENSE_KEY!;

export async function POST(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { tid, tranDt } = body;

        if (!tid || !tranDt) {
            return NextResponse.json(
                { success: false, error: 'tid와 tranDt가 필요합니다.' },
                { status: 400 }
            );
        }

        console.log('🔍 송금 결과 조회 요청:', { tid, tranDt });

        const response = await fetch(INNOPAY_SEARCH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mid: INNOPAY_MID,
                merkey: INNOPAY_LICENSE_KEY,
                tid: tid,
                tranDt: tranDt,
            }),
        });

        const result = await response.json();
        console.log('📥 송금 결과 조회 응답:', result);

        return NextResponse.json({
            success: result.resultCode === '0000',
            data: result,
        });
    } catch (error: any) {
        console.error('❌ 송금 결과 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: error.message || '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
