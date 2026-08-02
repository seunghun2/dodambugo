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
    const targetUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_BUGO;
    if (!targetUrl) {
        console.error('❌ Webhook URL이 설정되지 않았습니다.');
        return false;
    }

    try {
        const response = await fetch(targetUrl, {
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
}, isB2B?: boolean): Promise<boolean> {
    const webhookUrl = isB2B
        ? (process.env.SLACK_WEBHOOK_B2B_FLOWER || process.env.SLACK_WEBHOOK_FLOWER || process.env.SLACK_WEBHOOK_URL)
        : (process.env.SLACK_WEBHOOK_FLOWER || process.env.SLACK_WEBHOOK_URL);
    const priceFormatted = new Intl.NumberFormat('ko-KR').format(order.price);
    const brand = isB2B ? '부고온' : '마음부고';
    const domain = isB2B ? 'bugoon.maeumbugo.co.kr' : 'maeumbugo.co.kr';

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

    const text = `[${brand}] 화환 주문이 접수되었습니다. (부고번호: ${order.bugo_number || '-'} / 주문번호: ${order.id})
- 상품명: ${order.product_name}
- 금액: ${priceFormatted}원
- 빈소: ${order.funeral_hall || '미입력'} ${order.room || ''}
- 주소: ${order.address || '-'}
- 리본문구1: ${order.ribbon_text1 || '-'}
- 리본문구2: ${order.ribbon_text2 || '-'}
- 수신자: ${recipientDisplay}
- 주문자: ${order.sender_name}(${order.sender_phone})
- 대표상주: ${chiefMournerDisplay}
- 결제수단: ${order.payment_method || '미정'}
- 부고장: https://${domain}/view/${order.bugo_number || ''}`;

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
}, isB2B?: boolean): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_CONDOLENCE || process.env.SLACK_WEBHOOK_BUGO;
    const brand = isB2B ? '부고온' : '마음부고';
    const domain = isB2B ? 'bugoon.maeumbugo.co.kr' : 'maeumbugo.co.kr';

    const amountFormatted = new Intl.NumberFormat('ko-KR').format(payment.amount);
    const feeFormatted = new Intl.NumberFormat('ko-KR').format(payment.fee);
    const totalFormatted = new Intl.NumberFormat('ko-KR').format(payment.total_amount);

    const text = `[${brand}]
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

  - 부고장: https://${domain}/view/${payment.bugo_number}`;

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

/**
 * B2B 신분증 자동 검증 실패 알림 전송 (#01_04_B2B검증실패)
 */
export async function sendB2BVerificationFailureNotification(info: {
    partner_name: string;
    company_name: string;
    phone: string;
    expected_name: string;
    parsed_name: string;
    id_card_url: string;
    reason: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_BUGO || process.env.SLACK_WEBHOOK_URL;

    const text = `⚠️ [부고온 B2B] 신분증 자동 검증 실패 (수동 확인 필요)
- 파트너사: ${info.company_name} (대표자: ${info.partner_name})
- 연락처: ${info.phone}
- 가입자 실명: ${info.expected_name}
- 신분증 추출 실명: ${info.parsed_name || '(추출 실패)'}
- 실패 사유: ${info.reason}
- 신분증 파일 경로: ${info.id_card_url}
- 어드민 링크: https://maeumbugo.co.kr/b2b/admin/partners`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * B2B 자동 출금 이체 성공 알림 전송
 */
export async function sendB2BAutoWithdrawalSuccessNotification(info: {
    company_name: string;
    owner_name: string;
    amount: number;
    bank_name: string;
    account_no: string;
    account_holder: string;
    request_id: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_DEPOSIT || process.env.SLACK_WEBHOOK_URL;
    const amountFormatted = info.amount.toLocaleString();

    const text = `✅ [부고온 B2B] 신분증 인증 회원 첫 출금 자동 이체 성공
- 파트너사: ${info.company_name} (대표자: ${info.owner_name})
- 출금액: ${amountFormatted}원
- 송금계좌: ${info.bank_name} ${info.account_no} (예금주: ${info.account_holder})
- 신청 ID: ${info.request_id}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * B2B 자동 출금 이체 실패 알림 전송
 */
export async function sendB2BAutoWithdrawalFailureNotification(info: {
    company_name: string;
    owner_name: string;
    amount: number;
    bank_name: string;
    account_no: string;
    account_holder: string;
    request_id: string;
    reason: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_BUGO || process.env.SLACK_WEBHOOK_URL;
    const amountFormatted = info.amount.toLocaleString();

    const text = `🚨 [부고온 B2B] 신분증 인증 회원 첫 출금 자동 이체 실패 (수동 처리 필요)
- 파트너사: ${info.company_name} (대표자: ${info.owner_name})
- 출금액: ${amountFormatted}원
- 송금계좌: ${info.bank_name} ${info.account_no} (예금주: ${info.account_holder})
- 신청 ID: ${info.request_id}
- 실패 사유: ${info.reason}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * B2B 출금 신청 알림 전송
 */
export async function sendB2BWithdrawalRequestNotification(info: {
    company_name: string;
    owner_name: string;
    amount: number;
    net_amount: number;
    bank_name: string;
    account_no: string;
    account_holder: string;
    partner_type: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_DEPOSIT || process.env.SLACK_WEBHOOK_URL;
    const amountFormatted = info.amount.toLocaleString();
    const netAmountFormatted = info.net_amount.toLocaleString();
    const partnerTypeDisplay = info.partner_type === 'business' ? '사업자' : '개인';

    const text = `[부고온 B2B] 신규 출금 신청이 접수되었습니다. (승인 대기)
- 파트너사: ${info.company_name} (대표자: ${info.owner_name} / ${partnerTypeDisplay})
- 출금신청액: ${amountFormatted}원
- 세후실수령액: ${netAmountFormatted}원
- 송금계좌: ${info.bank_name} ${info.account_no} (예금주: ${info.account_holder})`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * B2B 출금 승인 성공 알림 전송
 */
export async function sendB2BWithdrawalApproveNotification(info: {
    company_name: string;
    owner_name: string;
    amount: number;
    net_amount: number;
    bank_name: string;
    account_no: string;
    account_holder: string;
    request_id: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_DEPOSIT || process.env.SLACK_WEBHOOK_URL;
    const amountFormatted = info.amount.toLocaleString();
    const netAmountFormatted = info.net_amount.toLocaleString();

    const text = `[부고온 B2B] 출금 승인 및 실이체 성공
- 파트너사: ${info.company_name} (대표자: ${info.owner_name})
- 이체금액: ${netAmountFormatted}원 (세전 ${amountFormatted}원)
- 송금계좌: ${info.bank_name} ${info.account_no} (예금주: ${info.account_holder})
- 신청 ID: ${info.request_id}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * B2B 출금 신청 반려 알림 전송
 */
export async function sendB2BWithdrawalRejectNotification(info: {
    company_name: string;
    owner_name: string;
    amount: number;
    bank_name: string;
    account_no: string;
    account_holder: string;
    request_id: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_DEPOSIT || process.env.SLACK_WEBHOOK_URL;
    const amountFormatted = info.amount.toLocaleString();

    const text = `[부고온 B2B] 출금 신청 반려 (예치금 환원 완료)
- 파트너사: ${info.company_name} (대표자: ${info.owner_name})
- 반려액: ${amountFormatted}원
- 송금계좌: ${info.bank_name} ${info.account_no} (예금주: ${info.account_holder})
- 신청 ID: ${info.request_id}`;

    return sendToWebhook(webhookUrl!, { text });
}

/**
 * B2B 신규 파트너 회원가입 알림 전송
 */
export async function sendB2BSignupNotification(info: {
    owner_name: string;
    company_name: string;
    phone: string;
    recommender_name?: string;
    company_type?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_DEPOSIT || process.env.SLACK_WEBHOOK_BUGO;
    const text = `[부고온 B2B] 신규 파트너 회원가입
- 대표자명: ${info.owner_name}
- 상호/소속: ${info.company_name} (${info.company_type || '개인'})
- 연락처: ${info.phone}
- 추천인: ${info.recommender_name || '없음(직접가입)'}`;

    return sendToWebhook(webhookUrl!, { text });
}


