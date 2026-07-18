/**
 * 부고온플러스 B2B 알림톡 10개 전체 템플릿 매핑 & 실발송 검증 테스트 스크립트
 * 실행: npx tsx scripts/test-b2b-alimtalk.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const TEST_PHONE = '01064262393'; // 테스트 전화번호

const B2C_TEMPLATES = {
    // 1. 부고장 생성
    FUNERAL_CREATE: 'KA01TP2602070138097871zexjvolnSU',
    FUNERAL_CREATE_ADDITIONAL: 'KA01TP2602121532276099rVDeNpBxvE',
    
    // 2. 감사장 안내 (상주용)
    THANKS_GUIDE: 'KA01TP2603110816428720O999vVNBCV',
    
    // 3. 화환 결제 완료 (조문객용)
    FLOWER_PAYMENT: 'KA01TP2601311316586435pxsJOWuWbz',
    
    // 4. 화환 배송 완료 (조문객용)
    FLOWER_DELIVERY: 'KA01TP260127010157157MBMxvZX3qUI',
    
    // 5. 부의금 결제 완료 (조문객용)
    CONDOLENCE_PAYMENT: 'KA01TP260213055510356BnS8IHlKvWB',
    
    // 6. 화환 구매 취소 (조문객용)
    FLOWER_CANCEL: 'KA01TP260128002330965AMneEQhHRIM',
    
    // 7. 화환 배송 완료 (도착안내)
    FLOWER_ARRIVED: 'KA01TP2601280031066633sWAZnmaLjB',
    
    // 8. 부의금 전달 완료 (상주용)
    CONDOLENCE_DELIVERED: 'KA01TP260213060236557haj4AEvPgIn',
    
    // 9. 장지 이용후기 (상주용)
    REVIEW_REQUEST: 'KA01TP260310031832180MIhfBqgYYoB',
    
    // 10. 상품결제 완료 (부의금 전달완료 조문객용)
    CONDOLENCE_SENDER: 'KA01TP260128002838240ioiYHpImLDY',
};

async function testB2BAlimtalk(templateName: string, b2cId: string, variables: any) {
    console.log(`\n📲 B2B 알림톡 발송 테스트: [${templateName}]`);
    try {
        const { sendAlimtalk } = await import('../lib/solapi');
        const res = await sendAlimtalk(
            TEST_PHONE,
            b2cId,
            variables,
            undefined,
            true // isB2B = true
        );
        console.log(`✅ [${templateName}] 발송 결과:`, JSON.stringify(res, null, 2));
    } catch (err) {
        console.error(`❌ [${templateName}] 발송 실패:`, err);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const templateNo = args[0];

    if (!templateNo) {
        console.log('💡 사용법: npx tsx scripts/test-b2b-alimtalk.ts [템플릿번호(1~10)]');
        console.log('예: npx tsx scripts/test-b2b-alimtalk.ts 5  (5번 부의금 결제 완료 발송)');
        console.log('--------------------------------------------------');
        console.log('1: 부고장 생성 완료 (상주용)');
        console.log('2: 감사장 안내 (상주용)');
        console.log('3: 화환 결제 완료 (조문객용)');
        console.log('4: 화환 배송 완료 (조문객용)');
        console.log('5: 부의금 결제 완료 (조문객용)');
        console.log('6: 화환 구매 취소 (조문객용)');
        console.log('7: 화환 배송 완료 - 도착안내 (조문객용)');
        console.log('8: 부의금 전달 완료 (상주용)');
        console.log('9: 장지 이용후기 요청 (상주용)');
        console.log('10: 부의금 전달완료 (조문객용)');
        return;
    }

    console.log(`🚀 부고온플러스 B2B 알림톡 [${templateNo}번] 테스트 시작`);
    console.log(`📞 수신 번호: ${TEST_PHONE}`);
    console.log('='.repeat(60));

    switch (templateNo) {
        case '1':
            // 1. 부고장 생성 (대표상주)
            await testB2BAlimtalk('1. 부고장 생성 완료 (상주용)', B2C_TEMPLATES.FUNERAL_CREATE, {
                '고인명': '홍길동',
                '장례식장': '부고온장례식장 101호',
                '발인일시': '2026-07-20 10:00',
                '부고번호': '2607142235',
            });
            break;
        case '1-2':
            // 1-2. 부고장 생성 (추가상주)
            await testB2BAlimtalk('1-2. 부고장 생성 완료 (추가상주)', B2C_TEMPLATES.FUNERAL_CREATE_ADDITIONAL, {
                '고인명': '홍길동',
                '장례식장': '부고온장례식장 101호',
                '발인일시': '2026-07-20 10:00',
                '부고번호': '2607142235',
            });
            break;
        case '2':
            // 2. 감사장 안내
            await testB2BAlimtalk('2. 감사장 안내 (상주용)', B2C_TEMPLATES.THANKS_GUIDE, {
                '상주명': '이몽룡',
                '고인명': '홍길동',
                '부고ID': '2607142235',
            });
            break;
        case '3':
            // 3. 화환 결제 완료
            await testB2BAlimtalk('3. 화환 결제 완료 (조문객용)', B2C_TEMPLATES.FLOWER_PAYMENT, {
                '상품명': '프리미엄형 화환',
                '금액': '169,000',
                '주문번호': `MG${Date.now()}`,
                '받는분': '이몽룡',
                '장례식장': '부고온장례식장 101호',
            });
            break;
        case '4':
            // 4. 화환 배송 완료
            await testB2BAlimtalk('4. 화환 배송 완료 (조문객용)', B2C_TEMPLATES.FLOWER_DELIVERY, {
                '상품명': '프리미엄형 화환',
                '받는분': '이몽룡',
                '장례식장': '부고온장례식장 101호',
                '주문번호': `MG${Date.now()}`,
                '고인명': '홍길동',
            });
            break;
        case '5':
            // 5. 부의금 결제 완료 (Mock 번호를 실제 DB 스펙인 CO로 변경)
            await testB2BAlimtalk('5. 부의금 결제 완료 (조문객용)', B2C_TEMPLATES.CONDOLENCE_PAYMENT, {
                '부의금액': '100,000',
                '결제금액': '108,600',
                '상주명': '이몽룡',
                '주문번호': `CO${Date.now()}`,
            });
            break;
        case '6':
            // 6. 화환 구매 취소
            await testB2BAlimtalk('6. 화환 구매 취소 (조문객용)', B2C_TEMPLATES.FLOWER_CANCEL, {
                '주문자명': '성춘향',
                '환불금액': '169,000',
                '결제수단': '신용카드',
            });
            break;
        case '7':
            // 7. 화환 배송 완료 (도착안내)
            await testB2BAlimtalk('7. 화환 배송 완료 - 도착안내 (조문객용)', B2C_TEMPLATES.FLOWER_ARRIVED, {
                '#{상품명}': '프리미엄형 화환',
                '#{주문자명}': '성춘향',
                '#{주소}': '부고온장례식장 101호',
            });
            break;
        case '8':
            // 8. 부의금 전달 완료 (상주용)
            await testB2BAlimtalk('8. 부의금 전달 완료 (상주용)', B2C_TEMPLATES.CONDOLENCE_DELIVERED, {
                '수신자명': '이몽룡',
                '보내는분': '성춘향',
                '부의금액': '100,000',
                '은행명': '신한은행',
                '계좌번호': '110-123-456789',
            });
            break;
        case '9':
            // 9. 장지 이용후기 (상주용)
            await testB2BAlimtalk('9. 장지 이용후기 요청 (상주용)', B2C_TEMPLATES.REVIEW_REQUEST, {
                '상주명': '이몽룡',
                '고인명': '홍길동',
                '장지명': '용인공원묘원',
                '리뷰링크': 'review_code_test',
            });
            break;
        case '10':
            // 10. 상품결제 완료 (조문객용)
            await testB2BAlimtalk('10. 부의금 전달완료 (조문객용)', B2C_TEMPLATES.CONDOLENCE_SENDER, {
                '#{상품명}': '부의금 전달 서비스',
                '#{금액}': '100,000',
                '#{주문번호}': `CO${Date.now()}`,
                '#{받는분}': '이몽룡',
                '#{장례식장}': '부고온장례식장 101호',
            });
            break;
        default:
            console.log('❌ 존재하지 않는 템플릿 번호입니다.');
    }
}

main();
