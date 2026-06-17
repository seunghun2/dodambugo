/**
 * Slack 알림 유틸리티
 * 부고드림 스타일 텍스트 포맷
 */

interface SlackMessage {
    text: string;
}

/**
 * 슬랙으로 메시지 전송 (특정 webhook URL로)
 */
async function sendToWebhook(webhookUrl: string, message: SlackMessage): Promise<boolean> {
    if (!webhookUrl) {
        console.error('❌ Webhook URL이 설정되지 않았습니다.');
        return false;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            console.error('❌ Slack 메시지 전송 실패:', response.statusText);
            return false;
        }

        console.log('✅ Slack 메시지 전송 성공');
        return true;
    } catch (error) {
        console.error('❌ Slack 메시지 전송 에러:', error);
        return false;
    }
}

/**
 * 부고 알림 전송 (#01_01_부고알림)
 * 부고드림 스타일
 */
export async function sendBugoNotification(bugo: {
    bugo_number: string;
    deceased_name: string;
    mourner_name?: string;
    funeral_type?: string;
    funeral_home?: string;
    room_number?: string;
    funeral_date?: string;
    funeral_time?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_BUGO;

    const funeralLocation = (bugo.funeral_type === '가족장' || bugo.funeral_type === '무빈소장례')
        ? bugo.funeral_type
        : `${bugo.funeral_home || '미입력'} ${bugo.room_number || ''}`;

    const text = `[마음부고] 부고장이 등록되었습니다. (부고번호: ${bugo.bugo_number})
- 장례 종류: ${bugo.funeral_type || '일반 장례'}
- 고인: ${bugo.deceased_name || '미입력'}
- 상주: ${bugo.mourner_name || '미입력'}
- 장례식장: ${funeralLocation}
- 발인일시: ${bugo.funeral_date || '미정'} ${bugo.funeral_time || ''}
- 부고장: https://maeumbugo.co.kr/view/${bugo.bugo_number}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * 화환 주문 알림 전송 (#01_02_화환구매)
 * 부고드림 스타일
 */
export async function sendFlowerOrderNotification(order: {
    id: string;
    bugo_number?: string;
    deceased_name: string;
    sender_name: string;
    sender_phone: string;
    recipient_name?: string;
    recipient_phone?: string;
    product_name: string;
    price: number;
    ribbon_text1?: string;
    ribbon_text2?: string;
    funeral_hall?: string;
    room?: string;
    address?: string;
    payment_method?: string;
    chief_mourner_name?: string;
    chief_mourner_phone?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_FLOWER || process.env.SLACK_WEBHOOK_URL;
    const priceFormatted = new Intl.NumberFormat('ko-KR').format(order.price);

    // 수신자 표시: 연락처 있으면 포함
    const recipientDisplay = order.recipient_name
        ? order.recipient_phone
            ? `${order.recipient_name}(${order.recipient_phone})`
            : order.recipient_name
        : order.deceased_name;

    // 대표상주 표시: 연락처 있으면 포함
    const chiefMournerDisplay = order.chief_mourner_name
        ? order.chief_mourner_phone
            ? `${order.chief_mourner_name}(${order.chief_mourner_phone})`
            : order.chief_mourner_name
        : '-';

    const text = `[마음부고] 화환 주문이 접수되었습니다. (부고번호: ${order.bugo_number || '-'} / 주문번호: ${order.id})
- 상품명: ${order.product_name}
- 금액: ${priceFormatted}원
- 빈소: ${order.funeral_hall || '미입력'} ${order.room || ''}
- 주소: ${order.address || '-'}
- 리본문구1: ${order.ribbon_text1 || '-'}
- 리본문구2: ${order.ribbon_text2 || '-'}
- 수신자: ${recipientDisplay}
- 주문자: ${order.sender_name}(${order.sender_phone})
- 대표상주: ${chiefMournerDisplay}
- 결제수단: ${order.payment_method || '미정'}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * 간단한 텍스트 알림 전송 (기본 webhook)
 */
export async function sendSimpleNotification(text: string): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_BUGO || process.env.SLACK_WEBHOOK_URL;
    return sendToWebhook(webhookUrl!, { text });
}

/**
 * 부의금 결제 알림 전송 (#01_03_부의금결제)
 */
export async function sendCondolenceNotification(payment: {
    order_number: string;
    bugo_number: string;
    deceased_name?: string;
    buyer_name: string;
    buyer_phone: string;
    recipient_name: string;
    amount: number;
    fee: number;
    total_amount: number;
    payment_method?: string;
    funeral_home?: string;
    bank_name?: string;
    account_no?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_CONDOLENCE || process.env.SLACK_WEBHOOK_BUGO;

    const amountFormatted = new Intl.NumberFormat('ko-KR').format(payment.amount);
    const feeFormatted = new Intl.NumberFormat('ko-KR').format(payment.fee);
    const totalFormatted = new Intl.NumberFormat('ko-KR').format(payment.total_amount);

    const text = `[마음부고]
부의금 결제가 완료되었습니다.
(주문번호: ${payment.order_number})
  - 구매자: ${payment.buyer_name}
  - 연락처: ${payment.buyer_phone}
  - 받는 분에게 표시: ${payment.recipient_name}(${payment.buyer_name})

  - 입금금액: ${amountFormatted}원
  - 수수료: ${feeFormatted}원
  - 총결제금액: ${totalFormatted}원

  - PG사: 이노페이
  - 결제수단: ${payment.payment_method || '카드결제'}

  - 입금은행: ${payment.bank_name || '-'}
  - 예금주: ${payment.recipient_name || '-'}
  - 계좌번호: ${payment.account_no || '-'}

  - 부고장: https://maeumbugo.co.kr/view/${payment.bugo_number}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * 예치금 잔액 변동 알림 전송
 */
export async function sendDepositBalanceNotification(info: {
    type: '입금' | '출금';
    amount: number;
    remainAmt?: number;
    buyerName?: string;
    recipientName?: string;
    bugoNumber?: string;
    bankName?: string;
    accountNo?: string;
    description?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_DEPOSIT || process.env.SLACK_WEBHOOK_CONDOLENCE || process.env.SLACK_WEBHOOK_BUGO;

    const amountFormatted = new Intl.NumberFormat('ko-KR').format(info.amount);
    const remainFormatted = info.remainAmt != null
        ? new Intl.NumberFormat('ko-KR').format(info.remainAmt)
        : '조회 필요';

    const emoji = info.type === '입금' ? '💰' : '💸';
    const sign = info.type === '입금' ? '+' : '-';

    let text = `${emoji} [마음부고] 예치금 ${info.type} (${sign}${amountFormatted}원)\n`;
    text += `  - 잔액: ${remainFormatted}원\n`;

    if (info.buyerName) text += `  - 구매자: ${info.buyerName}\n`;
    if (info.recipientName) text += `  - 받는분: ${info.recipientName}\n`;
    if (info.bankName && info.accountNo) text += `  - 송금계좌: ${info.bankName} ${info.accountNo}\n`;
    if (info.bugoNumber) text += `  - 부고번호: ${info.bugoNumber}\n`;
    if (info.description) text += `  - 비고: ${info.description}\n`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * 장지 후기 알림 전송 (#99_99_장지이용후기)
 */
export async function sendBurialReviewNotification(review: {
    bugo_number: string;
    burial_place: string;
    mourner_name?: string;
    mourner_phone?: string;
    rating: number;
    review_text?: string;
    photo_count?: number;
    consent_agreed?: boolean;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_REVIEW || process.env.SLACK_WEBHOOK_BUGO;

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const reviewPreview = review.review_text
        ? review.review_text.length > 100
            ? review.review_text.substring(0, 100) + '...'
            : review.review_text
        : '(소감 없음)';

    const text = `[마음부고] 장지 후기가 등록되었습니다.
- 장지: ${review.burial_place}
- 별점: ${stars} (${review.rating}점)
- 상주: ${review.mourner_name || '-'}
- 연락처: ${review.mourner_phone || '-'}
- 소감: ${reviewPreview}
- 사진: ${review.photo_count || 0}장
- 활용 동의: ${review.consent_agreed ? '✅' : '❌'}
- 부고번호: ${review.bugo_number}`;

    return sendToWebhook(webhookUrl!, { text });
}
