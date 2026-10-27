import { NextRequest, NextResponse } from 'next/server';

// Cron Job: 예치금 잔액 모니터링
// 잔액이 150만원 이하일 때 슬랙 알림 발송
// Vercel Cron: 매 시간 실행 권장

const INNOPAY_BALANCE_URL = 'http://49.50.139.204/proxy/balance';
const INNOPAY_MID = 'bumaeum02m';
const INNOPAY_LICENSE_KEY = '7bYbeddYcp6/zom99bje/iNEqLO3HFx2wcWGFgKeSCg95b8kRx9IcQtx3aoL3C6BufEXAD/V7bd6INig0ge0Zw==';
const DEPOSIT_ACCOUNT_NO = '66400001397152';

const ALERT_THRESHOLD = 1500000; // 150만원

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    if (process.env.NODE_ENV === 'development') return true;
    return false;
}

async function sendSlackAlert(remainAmt: string, totDptAmt: string, totWdrAmt: string) {
    const webhookUrl = process.env.SLACK_WEBHOOK_DEPOSIT;
    if (!webhookUrl) {
        console.error('❌ SLACK_WEBHOOK_DEPOSIT 환경변수 없음');
        return;
    }

    const remain = Number(remainAmt).toLocaleString();
    const totalIn = Number(totDptAmt).toLocaleString();
    const totalOut = Number(totWdrAmt).toLocaleString();
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `🚨 *예치금 잔액 부족 알림*`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🚨 예치금 잔액 부족 알림',
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*현재 잔액*\n💰 ${remain}원`,
                        },
                        {
                            type: 'mrkdwn',
                            text: `*기준 금액*\n⚠️ ${ALERT_THRESHOLD.toLocaleString()}원 이하`,
                        },
                    ],
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*총 입금액*\n${totalIn}원`,
                        },
                        {
                            type: 'mrkdwn',
                            text: `*총 출금액*\n${totalOut}원`,
                        },
                    ],
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `📅 ${now} | 계좌: ${DEPOSIT_ACCOUNT_NO}`,
                        },
                    ],
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '⚡ *즉시 예치금을 충전해주세요!* 잔액 부족 시 부의금 즉시 송금이 불가합니다.',
                    },
                },
            ],
        }),
    });
}

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🔍 [Cron] 예치금 잔액 모니터링 시작');

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
        console.log('📥 [Cron] 예치금 잔액 조회 응답:', result);

        if (result.resultCode !== '0000') {
            console.error('❌ [Cron] 잔액 조회 실패:', result.resultMsg);
            return NextResponse.json({
                success: false,
                error: result.resultMsg,
            });
        }

        const remainAmt = Number(result.remainAmt);
        console.log(`💰 [Cron] 현재 잔액: ${remainAmt.toLocaleString()}원 (기준: ${ALERT_THRESHOLD.toLocaleString()}원)`);

        if (remainAmt <= ALERT_THRESHOLD) {
            console.log('🚨 [Cron] 예치금 부족! 슬랙 알림 발송');
            await sendSlackAlert(result.remainAmt, result.totDptAmt, result.totWdrAmt);

            return NextResponse.json({
                success: true,
                alert: true,
                remainAmt,
                message: `⚠️ 잔액 부족: ${remainAmt.toLocaleString()}원 (기준: ${ALERT_THRESHOLD.toLocaleString()}원)`,
            });
        }

        return NextResponse.json({
            success: true,
            alert: false,
            remainAmt,
            message: `✅ 잔액 정상: ${remainAmt.toLocaleString()}원`,
        });
    } catch (error: any) {
        console.error('❌ [Cron] 예치금 모니터링 오류:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
