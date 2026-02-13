import { NextRequest, NextResponse } from 'next/server';
import { sendDepositBalanceNotification } from '@/lib/slack';

// 이노페이 송금(입금이체) API
// bumaeum02m 가맹점의 예치금 계좌에서 상주 계좌로 입금이체

// 프록시 서버를 통해 이노페이 API 호출 (고정 IP: 49.50.139.204)
const INNOPAY_DEPOSIT_URL = 'http://49.50.139.204/proxy/transfer';
const INNOPAY_MID = 'bumaeum02m';
const INNOPAY_LICENSE_KEY = '7bYbeddYcp6/zom99bje/iNEqLO3HFx2wcWGFgKeSCg95b8kRx9IcQtx3aoL3C6BufEXAD/V7bd6INig0ge0Zw==';

// 은행명 → 이노페이 은행코드 매핑
const BANK_CODE_MAP: Record<string, string> = {
    'KB국민': '004',
    '국민': '004',
    '국민은행': '004',
    '신한': '088',
    '신한은행': '088',
    '우리': '020',
    '우리은행': '020',
    '하나': '081',
    '하나은행': '081',
    'NH농협': '011',
    '농협': '011',
    '농협은행': '011',
    'IBK기업': '003',
    '기업': '003',
    '기업은행': '003',
    'SC제일': '023',
    '제일은행': '023',
    '케이뱅크': '089',
    '카카오뱅크': '090',
    '카카오': '090',
    '토스뱅크': '092',
    '토스': '092',
    '새마을금고': '045',
    '새마을': '045',
    '우체국': '071',
    '부산': '032',
    '부산은행': '032',
    '대구': '031',
    '대구은행': '031',
    '경남': '039',
    '경남은행': '039',
    '수협': '007',
    '수협은행': '007',
    '신협': '048',
    '신협은행': '048',
};

function getBankCode(bankName: string): string | null {
    if (BANK_CODE_MAP[bankName]) return BANK_CODE_MAP[bankName];

    for (const key in BANK_CODE_MAP) {
        if (bankName.includes(key) || key.includes(bankName)) {
            return BANK_CODE_MAP[key];
        }
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            bankName,        // 상주 은행명 (예: 'KB국민')
            accountNo,       // 상주 계좌번호
            accountHolder,   // 상주 예금주명
            amount,          // 송금할 금액 (수수료 제외 원금)
            buyerName,       // 보내는 사람 이름
            bugoId,          // 부고 ID
        } = body;

        // 필수값 검증
        if (!bankName || !accountNo || !accountHolder || !amount) {
            return NextResponse.json(
                { success: false, error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 은행코드 변환
        const bankCode = getBankCode(bankName);
        if (!bankCode) {
            return NextResponse.json(
                { success: false, error: `지원하지 않는 은행입니다: ${bankName}` },
                { status: 400 }
            );
        }

        // 고유 거래번호 생성
        const moid = `CONDTX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 계좌번호에서 하이픈 제거
        const cleanAccountNo = accountNo.replace(/-/g, '');

        console.log('📤 부의금 송금 요청:', {
            bankCode,
            accountNo: cleanAccountNo,
            accountHolder,
            amount,
            buyerName,
            bugoId,
            moid,
        });

        // 요청일시 생성 (YYYYMMDDHHmmss)
        const now = new Date();
        const reqDt = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        // 이노페이 송금(입금이체) API 호출
        const response = await fetch(INNOPAY_DEPOSIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mid: INNOPAY_MID,
                merkey: INNOPAY_LICENSE_KEY,
                moid: moid,
                req_dt: reqDt,
                bankCode: bankCode,
                acntNo: cleanAccountNo,
                acntNm: accountHolder,
                amt: String(amount),
                depAcntNo: '66400001397152',           // 예치금 계좌 (기업은행)
                depAcntNm: '마음부고',                   // 예치금 계좌 예금주
            }),
        });

        const result = await response.json();
        console.log('📥 송금 응답:', result);

        if (result.resultCode === '0000') {
            console.log('✅ 부의금 송금 성공:', {
                tid: result.tid,
                amount,
                to: `${bankName} ${accountHolder}`,
                from: buyerName,
            });

            // 슬랙 예치금 출금 알림
            try {
                // 잔액 조회
                let remainAmt: number | undefined;
                try {
                    const balRes = await fetch('http://49.50.139.204/proxy/balance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mid: INNOPAY_MID,
                            merkey: INNOPAY_LICENSE_KEY,
                            depAcntNo: '66400001397152',
                        }),
                    });
                    const balData = await balRes.json();
                    if (balData.resultCode === '0000') {
                        remainAmt = Number(balData.remainAmt);
                    }
                } catch (e) { /* 잔액 조회 실패해도 송금 결과는 정상 */ }

                await sendDepositBalanceNotification({
                    type: '출금',
                    amount: Number(amount),
                    remainAmt,
                    buyerName,
                    recipientName: accountHolder,
                    bankName,
                    accountNo: cleanAccountNo,
                    bugoNumber: bugoId,
                    description: `${buyerName}→${accountHolder}님에게 송금`,
                });
            } catch (slackErr) {
                console.error('❌ 예치금 출금 슬랙 알림 실패:', slackErr);
            }

            return NextResponse.json({
                success: true,
                data: {
                    tid: result.tid,
                    transDt: result.transDt,
                    moid,
                    amount,
                },
            });
        } else {
            console.error('❌ 부의금 송금 실패:', result);
            return NextResponse.json(
                {
                    success: false,
                    error: result.resultMsg || '송금 처리에 실패했습니다.',
                    code: result.resultCode,
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('❌ 송금 API 오류:', error);
        return NextResponse.json(
            { success: false, error: error.message || '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
