import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const API_KEY = process.env.SOLAPI_API_KEY || '';
const API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_URL = 'https://api.solapi.com';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    let status = 'success';
    let errorMessage = '';
    let resultData: any = null;

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

        resultData = await response.json();
        console.log('SMS 발송 결과:', resultData);
        
        // SOLAPI는statusCode가 있을 수 있음
        if (resultData.statusCode && resultData.statusCode !== '2000') {
            status = 'fail';
            errorMessage = resultData.errorMessage || 'SOLAPI 에러 발생';
        }
        return resultData;
    } catch (error: any) {
        status = 'fail';
        errorMessage = error.message || String(error);
        console.error('SMS 발송 실패:', error);
        throw error;
    } finally {
        // DB 로그 적재
        try {
            await supabase.from('b2b_notification_logs').insert({
                recipient_phone: to,
                recipient_name: '고객',
                type: 'sms',
                title: 'SMS 단문 문자',
                content: text,
                status,
                error_message: errorMessage || null
            });
        } catch (dbErr) {
            console.error('SMS 로그 DB 적재 실패:', dbErr);
        }
    }
}

// LMS 발송 (긴 문자 - 제목+본문 지원)
export async function sendLMS(to: string, subject: string, text: string) {
    let status = 'success';
    let errorMessage = '';
    let resultData: any = null;

    try {
        const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
                message: {
                    to,
                    from: '01048375076',
                    subject,
                    text,
                    type: 'LMS',
                },
            }),
        });

        resultData = await response.json();
        console.log('LMS 발송 결과:', JSON.stringify(resultData, null, 2));

        if (resultData.statusCode && resultData.statusCode !== '2000') {
            status = 'fail';
            errorMessage = resultData.errorMessage || 'SOLAPI 에러 발생';
        }
        return resultData;
    } catch (error: any) {
        status = 'fail';
        errorMessage = error.message || String(error);
        console.error('LMS 발송 실패:', error);
        throw error;
    } finally {
        // DB 로그 적재
        try {
            await supabase.from('b2b_notification_logs').insert({
                recipient_phone: to,
                recipient_name: '고객',
                type: 'lms',
                title: subject || 'LMS 장문 문자',
                content: text,
                status,
                error_message: errorMessage || null
            });
        } catch (dbErr) {
            console.error('LMS 로그 DB 적재 실패:', dbErr);
        }
    }
}

// B2C 템플릿 ID -> B2B (부고온플러스) 템플릿 ID 매핑 테이블
const B2B_TEMPLATE_MAP: Record<string, string> = {
    // 1. 부고장 생성 완료 (상주용) — 2026-08-20 새 템플릿 교체 (?m= 파라미터 포함 맞춤 링크)
    'KA01TP2602070138097871zexjvolnSU': 'KA01TP26080907213286667y3LSdpjeU', // b2b_부고장 생성
    // 2. 감사장 안내 (상주용)
    'KA01TP2603110816428720O999vVNBCV': 'KA01TP2607142239126854Fj3TBPuX5w', // b2b_감사장 안내
    // 3. 화환 결제 완료 (조문객용)
    'KA01TP2601311316586435pxsJOWuWbz': 'KA01TP260714224254339AmgosqXieKb', // b2b_01-화환 결제 완료
    // 4. 화환 배송 완료 (조문객용)
    'KA01TP260127010157157MBMxvZX3qUI': 'KA01TP260714224500973NWsyRyAxkxx', // b2b_02-화환 배송 완료
    // 5. 부의금 결제 완료 (조문객용)
    'KA01TP260213055510356BnS8IHlKvWB': 'KA01TP260714225649600mHQjrpBtjLH', // b2b_02-부의금 결제 완료_v1
    // 6. 화환 주문 취소 (조문객용)
    'KA01TP260128002330965AMneEQhHRIM': 'KA01TP2607142253139043ovPk2eKyQC', // b2b_04-화환 구매 취소
    // 7. 화환 도착 안내 (조문객용)
    'KA01TP2601280031066633sWAZnmaLjB': 'KA01TP260714225426167lds2anJCOl6', // b2b_06-화환 배송 완료 (도착안내)
    // 8. 부의금 전달 완료 (상주용)
    'KA01TP260213060236557haj4AEvPgIn': 'KA01TP260714225758697mQSmEbJeisa', // b2b_02-부의금 정보 전달_v1
    // 9. 장지 이용후기 요청 (상주용)
    'PENDING_SHARE_REVIEW': 'KA01TP260714225958774NSjzKCXWvdF', // 장지 이용후기(사본)
    'KA01TP260310031832180MIhfBqgYYoB': 'KA01TP260714225958774NSjzKCXWvdF', // 장지 이용후기(사본 - v2)
    // 10. 부의금 전달 완료 (조문객용)
    'KA01TP260128002838240ioiYHpImLDY': 'KA01TP260714224630629Z7tOdxnlNNK', // b2b_03-상품결제 완료
};

// 알림톡 발송 (예약 발송 지원)
export async function sendAlimtalk(
    to: string,
    templateId: string,
    variables: Record<string, string>,
    scheduledDate?: string,  // 예약 발송 시간 (UTC, "YYYY-MM-DD HH:mm:ss" 형식. KST 13시 = UTC 04시)
    isB2B?: boolean // B2B 여부
) {
    let status = 'success';
    let errorMessage = '';
    
    // B2B에 해당하는 pfId 및 templateId로 전환
    const pfId = isB2B 
        ? 'KA01PF260714222225783GytoRVdhXf4' // 부고온플러스 카카오채널
        : 'KA01PF260116055354175OcsXglgUTBt'; // 마음부고 카카오채널
        
    const finalTemplateId = isB2B 
        ? (B2B_TEMPLATE_MAP[templateId] || templateId)
        : templateId;

    const contentText = `[알림톡 템플릿: ${finalTemplateId}] 변수: ${JSON.stringify(variables)}`;

    try {
        // SOLAPI는 변수 키에 #{} 래퍼가 필요함
        const wrappedVariables: Record<string, string> = {};
        for (const [key, value] of Object.entries(variables)) {
            let processedValue = value;
            
            // 도착 안내 템플릿 고정 문구에 '화환이'가 있으므로, 상품명이 '화환'으로 끝날 경우 중복 방지를 위해 자름
            const isArrivalTemplate = finalTemplateId === 'KA01TP2601280031066633sWAZnmaLjB' || finalTemplateId === 'KA01TP260714225426167lds2anJCOl6';
            if (isArrivalTemplate && (key === '상품명' || key === '#{상품명}') && value && value.endsWith('화환')) {
                processedValue = value.replace(/\s*화환$/, '').trim();
            }

            const wrappedKey = key.startsWith('#{') ? key : `#{${key}}`;
            wrappedVariables[wrappedKey] = processedValue;
        }

        const message = {
            to,
            from: '01048375076', // 발신번호는 동일
            kakaoOptions: {
                pfId,
                templateId: finalTemplateId,
                variables: wrappedVariables,
            },
        };

        // 예약 발송일 경우 그룹 방식 사용
        if (scheduledDate) {
            // 1. 그룹 생성
            const groupRes = await fetch(`${SOLAPI_URL}/messages/v4/groups`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({}),
            });
            const groupData = await groupRes.json();
            const groupId = groupData.groupId;
            console.log('📦 그룹 생성:', groupId);

            // 2. 메시지 추가
            await fetch(`${SOLAPI_URL}/messages/v4/groups/${groupId}/messages`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({ messages: [message] }),
            });
            console.log('📝 메시지 추가 완료');

            // 3. 예약 발송 설정 (Solapi는 UTC 기준)
            const scheduleRes = await fetch(`${SOLAPI_URL}/messages/v4/groups/${groupId}/schedule`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ scheduledDate }),
            });
            const scheduleData = await scheduleRes.json();
            console.log('📅 예약 발송 설정:', scheduledDate, scheduleData);

            if (scheduleData.statusCode && scheduleData.statusCode !== '2000') {
                status = 'fail';
                errorMessage = scheduleData.errorMessage || '예약 발송 등록 실패';
            }
            return scheduleData;
        }

        // 즉시 발송
        const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ message }),
        });

        const data = await response.json();
        console.log('알림톡 발송 결과:', JSON.stringify(data, null, 2));

        if (data.statusCode && data.statusCode !== '2000') {
            status = 'fail';
            errorMessage = data.errorMessage || '알림톡 발송 실패';
        }
        return data;
    } catch (error: any) {
        status = 'fail';
        errorMessage = error.message || String(error);
        console.error('알림톡 발송 실패:', error);
        throw error;
    } finally {
        // DB 로그 적재
        try {
            await supabase.from('b2b_notification_logs').insert({
                recipient_phone: to,
                recipient_name: variables?.name || variables?.deceased || '고객',
                type: 'alimtalk',
                title: `알림톡 (${templateId})`,
                content: contentText,
                status,
                error_message: errorMessage || null
            });
        } catch (dbErr) {
            console.error('알림톡 로그 DB 적재 실패:', dbErr);
        }
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
