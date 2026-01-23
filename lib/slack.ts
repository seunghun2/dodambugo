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
    funeral_home?: string;
    room_number?: string;
    funeral_date?: string;
    funeral_time?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_BUGO;

    const text = `[마음부고] 부고장이 등록되었습니다. (부고번호: ${bugo.bugo_number})
- 고인: ${bugo.deceased_name || '미입력'}
- 상주: ${bugo.mourner_name || '미입력'}
- 장례식장: ${bugo.funeral_home || '미입력'} ${bugo.room_number || ''}
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
    product_name: string;
    price: number;
    ribbon_text1?: string;
    ribbon_text2?: string;
    funeral_hall?: string;
    room?: string;
    payment_method?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_FLOWER;
    const priceFormatted = new Intl.NumberFormat('ko-KR').format(order.price);

    const text = `[마음부고] 화환 주문이 접수되었습니다. (부고번호: ${order.bugo_number || '-'} / 주문번호: ${order.id})
- 상품명: ${order.product_name}
- 금액: ${priceFormatted}원
- 빈소: ${order.funeral_hall || '미입력'} ${order.room || ''}
- 리본문구1: ${order.ribbon_text1 || '-'}
- 리본문구2: ${order.ribbon_text2 || '-'}
- 수신자: ${order.recipient_name || order.deceased_name}
- 주문자: ${order.sender_name}(${order.sender_phone})
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
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_CONDOLENCE || process.env.SLACK_WEBHOOK_BUGO;

    const amountFormatted = new Intl.NumberFormat('ko-KR').format(payment.amount);
    const feeFormatted = new Intl.NumberFormat('ko-KR').format(payment.fee);
    const totalFormatted = new Intl.NumberFormat('ko-KR').format(payment.total_amount);

    const text = `[마음부고] 💰 부의금이 접수되었습니다. (부고번호: ${payment.bugo_number} / 주문번호: ${payment.order_number})
- 고인: ${payment.deceased_name || '미입력'}
- 장례식장: ${payment.funeral_home || '미입력'}
- 부의금액: ${amountFormatted}원
- 수수료: ${feeFormatted}원
- 결제금액: ${totalFormatted}원
- 입금자명: ${payment.recipient_name}
- 결제자: ${payment.buyer_name}(${payment.buyer_phone})
- 결제수단: ${payment.payment_method || '카드'}
- 부고장: https://maeumbugo.co.kr/view/${payment.bugo_number}`;

    return sendToWebhook(webhookUrl!, { text });
}
