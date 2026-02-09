import { NextRequest, NextResponse } from 'next/server';

// 2.10 예치금 잔액 조회 요청
// URL: https://acct.innopay.co.kr/AcctOutRemainSearch.acct
// 총 입금액, 총 출금액, 현재 잔액 조회

const INNOPAY_BALANCE_URL = 'https://acct.innopay.co.kr/AcctOutRemainSearch.acct';
const INNOPAY_MID = 'bumaeum02m';
const INNOPAY_LICENSE_KEY = '7bYbeddYcp6/zom99bje/iNEqLO3HFx2wcWGFgKeSCg95b8kRx9IcQtx3aoL3C6BufEXAD/V7bd6INig0ge0Zw==';
const DEPOSIT_ACCOUNT_NO = '66400001397152';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 예치금 잔액 조회 요청');

        const response = await fetch(INNOPAY_BALANCE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mid: INNOPAY_MID,
                merkey: INNOPAY_LICENSE_KEY,
                depAcntNo: DEPOSIT_ACCOUNT_NO,
            }),
        });

        const result = await response.json();
        console.log('📥 예치금 잔액 조회 응답:', result);

        if (result.resultCode === '0000') {
            return NextResponse.json({
                success: true,
                data: {
                    depAcntNo: result.depAcntNo,
                    totDptAmt: result.totDptAmt,      // 총 입금액
                    totWdrAmt: result.totWdrAmt,      // 총 출금액
                    remainAmt: result.remainAmt,      // 현재 잔액
                    transDt: result.transDt,          // 조회 일시
                },
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.resultMsg,
                code: result.resultCode,
            });
        }
    } catch (error: any) {
        console.error('❌ 잔액 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
