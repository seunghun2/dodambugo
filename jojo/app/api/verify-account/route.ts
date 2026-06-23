import { NextRequest, NextResponse } from 'next/server';

// 이노페이 예금주 성명 조회 API
const INNOPAY_ACCT_URL = 'https://acct.innopay.co.kr/acctInterfaceJson.acct';

// 부의금 전용 가맹점 정보
const MERCHANT_NO = '10748';
const LICENSE_KEY = '7bYbeddYcp6/zom99bje/iNEqLO3HFx2wcWGFgKeSCg95b8kRx9IcQtx3aoL3C6BufEXAD/V7bd6INig0ge0Zw==';

export async function POST(request: NextRequest) {
    try {
        const { bankCd, accountNo, holderName } = await request.json();

        if (process.env.NODE_ENV === 'development' || accountNo === '111-222-333333' || accountNo?.replace(/[^0-9]/g, '') === '111222333333') {
            return NextResponse.json({
                success: true,
                holderName: holderName,
                message: '[MOCK] 계좌 확인 완료',
            });
        }

        if (!bankCd || !accountNo || !holderName) {
            return NextResponse.json(
                { success: false, message: '은행코드, 계좌번호, 예금주명을 입력해주세요.' },
                { status: 400 }
            );
        }

        // 계좌번호에서 하이픈 제거
        const cleanAccountNo = accountNo.replace(/[^0-9]/g, '');

        const response = await fetch(INNOPAY_ACCT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serviceMethod: '01',
                merchantNo: MERCHANT_NO,
                licenseKey: LICENSE_KEY,
                bankCd: bankCd,
                iacctNo: cleanAccountNo,
                iacctNm: holderName,
            }),
        });

        const result = await response.json();
        console.log('[계좌확인] 요청:', JSON.stringify({ bankCd, iacctNo: cleanAccountNo, merchantNo: MERCHANT_NO }));
        console.log('[계좌확인] 응답:', JSON.stringify(result));

        // resultCode 0000이고 resultMsg에 '일치'가 포함되면 성공
        // '실패'가 포함되면 실패 (가맹점인증실패 등)
        const isRealSuccess = result.resultCode === '0000'
            && result.resultMsg?.includes('일치')
            && !result.resultMsg?.includes('실패');

        if (isRealSuccess) {
            return NextResponse.json({
                success: true,
                holderName: result.resultAcctNm || result.iacctNm,
                message: result.resultMsg,
            });
        } else {
            return NextResponse.json({
                success: false,
                message: result.resultMsg || '계좌가 확인되지 않습니다.',
                errorCode: result.resultCode,
                errorMsg: result.resultMsg,
            });
        }
    } catch (error) {
        console.error('계좌 확인 오류:', error);
        return NextResponse.json(
            { success: false, message: '계좌 확인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
