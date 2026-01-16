/**
 * Slack 알림 유틸리티
 * 주문 접수 시 슬랙으로 알림을 보내는 함수들
 */

interface SlackMessage {
    text?: string;
    blocks?: any[];
    attachments?: any[];
}

/**
 * 슬랙으로 메시지 전송
 */
export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('❌ SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
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
 * 화환 주문 알림 전송
 */
export async function sendFlowerOrderNotification(order: {
    id: string;
    deceased_name: string;
    sender_name: string;
    sender_phone: string;
    product_name: string;
    price: number;
    ribbon_text?: string;
    funeral_hall?: string;
    payment_method?: string;
    created_at?: string;
}): Promise<boolean> {
    const priceFormatted = new Intl.NumberFormat('ko-KR').format(order.price);
    const orderTime = order.created_at
        ? new Date(order.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        : new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const message: SlackMessage = {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🌸 새 화환 주문이 접수되었습니다!',
                    emoji: true
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*고인:*\n${order.deceased_name}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*상품:*\n${order.product_name}`
                    }
                ]
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*주문자:*\n${order.sender_name}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*연락처:*\n${order.sender_phone}`
                    }
                ]
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*금액:*\n₩${priceFormatted}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*결제방법:*\n${order.payment_method || '미정'}`
                    }
                ]
            },
            ...(order.ribbon_text ? [{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*리본 문구:*\n${order.ribbon_text}`
                }
            }] : []),
            ...(order.funeral_hall ? [{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*장례식장:*\n${order.funeral_hall}`
                }
            }] : []),
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `📅 주문시간: ${orderTime} | 주문번호: ${order.id}`
                    }
                ]
            },
            {
                type: 'divider'
            }
        ]
    };

    return sendSlackMessage(message);
}

/**
 * 간단한 텍스트 알림 전송
 */
export async function sendSimpleNotification(text: string): Promise<boolean> {
    return sendSlackMessage({ text });
}
