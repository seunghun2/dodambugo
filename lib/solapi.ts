import crypto from 'crypto';

const API_KEY = process.env.SOLAPI_API_KEY || '';
const API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_URL = 'https://api.solapi.com';

// Solapi 인증 헤더 생성
function getAuthHeader() {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString('hex');
    const signature = crypto
        .createHmac('sha256', API_SECRET)
        .update(date + salt)
        .digest('hex');

    return {
        'Authorization': `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
    };
}

// SMS 발송 (알림톡 실패 시 대체)
export async function sendSMS(to: string, text: string) {
    try {
        const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
                message: {
                    to,
                    from: '01048375076', // 마음부고 발신번호
                    text,
                },
            }),
        });

        const data = await response.json();
        console.log('SMS 발송 결과:', data);
        return data;
    } catch (error) {
        console.error('SMS 발송 실패:', error);
        throw error;
    }
}

// 알림톡 발송 (예약 발송 지원)
export async function sendAlimtalk(
    to: string,
    templateId: string,
    variables: Record<string, string>,
    scheduledDate?: Date  // 예약 발송 시간 (선택)
) {
    try {
        // SOLAPI는 변수 키에 #{} 래퍼가 필요함
        const wrappedVariables: Record<string, string> = {};
        for (const [key, value] of Object.entries(variables)) {
            // 이미 #{} 형태면 그대로, 아니면 래핑
            const wrappedKey = key.startsWith('#{') ? key : `#{${key}}`;
            wrappedVariables[wrappedKey] = value;
        }

        const messageBody: Record<string, unknown> = {
            message: {
                to,
                from: '01048375076', // 마음부고 발신번호
                kakaoOptions: {
                    pfId: 'KA01PF260116055354175OcsXglgUTBt', // 마음부고 카카오채널
                    templateId,
                    variables: wrappedVariables,
                    // 알림톡 실패 시 SMS 대체 발송
                    resendType: 'SMS',
                },
            },
        };

        // 예약 발송 시간 설정 (message 바깥에!)
        if (scheduledDate) {
            messageBody.scheduledDate = scheduledDate.toISOString();
            console.log('📅 예약 발송 설정:', scheduledDate.toISOString());
        }

        const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(messageBody),
        });

        const data = await response.json();
        console.log('알림톡 발송 결과:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('알림톡 발송 실패:', error);
        throw error;
    }
}

// 화환 주문 알림 (신청자에게)
export async function sendFlowerOrderNotification(
    applicantPhone: string,
    orderInfo: {
        senderName: string;
        productName: string;
        price: number;
        deceasedName: string;
        funeralHome: string;
    }
) {
    const message = `[마음부고] 화환 주문 알림

🌸 화환이 주문되었습니다.

■ 주문 정보
• 보내시는 분: ${orderInfo.senderName}
• 상품명: ${orderInfo.productName}
• 금액: ${orderInfo.price.toLocaleString()}원

■ 부고 정보
• 고인명: ${orderInfo.deceasedName}
• 장례식장: ${orderInfo.funeralHome}

문의: 마음부고`;

    // 일단 SMS로 발송 (알림톡 템플릿 승인 전까지)
    return sendSMS(applicantPhone, message);
}
