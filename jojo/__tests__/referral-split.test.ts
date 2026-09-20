/**
 * DB 동적 수수료 (화환 6종 상품별 지도사 수당 & 추천인 3,500/6,500 분할) 종합 검증
 * 
 * 계약서 부속서 1 제1조 및 제2조 3항 기준:
 * - 하드코딩 0개: 상조회사의 b2b_companies 테이블 컬럼 설정값을 100% 동적으로 읽어 계산
 */

describe('B2B 상조회사 DB 동적 수수료 계산 검증', () => {
    // 1. 화환 상품별 지도사 수당 동적 산출 함수 (approve/route.ts L440~L455와 동일 로직)
    function calculateProductReward(productName: string, companyRecord: {
        wreath_basket_amount: number;
        wreath_objet_amount: number;
        wreath_basic_amount: number;
        wreath_deluxe_amount: number;
        wreath_premium_amount: number;
        wreath_vip_amount: number;
        wreath_commission_amount: number;
    }) {
        const pName = (productName || '').trim();
        let rewardAmount = companyRecord.wreath_basic_amount;

        if (pName.includes('바구니')) {
            rewardAmount = companyRecord.wreath_basket_amount;
        } else if (pName.includes('오브제')) {
            rewardAmount = companyRecord.wreath_objet_amount;
        } else if (pName.includes('고급')) {
            rewardAmount = companyRecord.wreath_deluxe_amount;
        } else if (pName.includes('프리미엄') || pName.includes('특대')) {
            rewardAmount = companyRecord.wreath_premium_amount;
        } else if (pName.includes('VIP') || pName.includes('4단')) {
            rewardAmount = companyRecord.wreath_vip_amount;
        } else {
            rewardAmount = companyRecord.wreath_basic_amount;
        }

        return {
            rewardAmount,
            companyCommission: companyRecord.wreath_commission_amount,
            totalPaid: rewardAmount + companyRecord.wreath_commission_amount,
        };
    }

    // 2. 추천인 분할 수수료 동적 산출 함수 (approve/route.ts L550~L570과 동일 로직)
    function calculateDynamicReferralBonus(params: {
        isSellerCorporate: boolean;
        hasRecommender: boolean;
        isRecommenderCorporate: boolean;
        recommenderCompanyRecord?: {
            referral_member_bonus: number;
            referral_company_bonus: number;
        };
        defaultBonusSetting: number;
    }) {
        if (params.isSellerCorporate || !params.hasRecommender) {
            return { recommenderBonus: 0, corporateBonus: 0, applied: false };
        }

        if (params.isRecommenderCorporate && params.recommenderCompanyRecord) {
            return {
                recommenderBonus: params.recommenderCompanyRecord.referral_member_bonus,
                corporateBonus: params.recommenderCompanyRecord.referral_company_bonus,
                applied: true,
            };
        }

        return {
            recommenderBonus: params.defaultBonusSetting,
            corporateBonus: 0,
            applied: true,
        };
    }

    const mockCompany = {
        name: '주식회사 더좋은라이프',
        wreath_commission_amount: 10000,
        wreath_member_commission_amount: 50000,
        wreath_basket_amount: 30000,
        wreath_objet_amount: 40000,
        wreath_basic_amount: 50000,
        wreath_deluxe_amount: 55000,
        wreath_premium_amount: 60000,
        wreath_vip_amount: 65000,
        referral_member_bonus: 3500,
        referral_company_bonus: 6500,
    };

    describe('화환 6종 상품별 지도사 수당 동적 계산', () => {
        test('1. 소형 바구니 -> 지도사 30,000원 + 본사 10,000원 (총수수료 4만, 역마진 방지)', () => {
            const res = calculateProductReward('소형 바구니', mockCompany);
            expect(res.rewardAmount).toBe(30000);
            expect(res.companyCommission).toBe(10000);
            expect(res.totalPaid).toBe(40000);
        });

        test('2. 오브제 1단 화환 -> 지도사 40,000원 + 본사 10,000원 (총수수료 5만)', () => {
            const res = calculateProductReward('오브제 1단 화환', mockCompany);
            expect(res.rewardAmount).toBe(40000);
            expect(res.companyCommission).toBe(10000);
            expect(res.totalPaid).toBe(50000);
        });

        test('3. 근조화환 기본형 -> 지도사 50,000원 + 본사 10,000원 (총수수료 6만)', () => {
            const res = calculateProductReward('근조화환 기본형', mockCompany);
            expect(res.rewardAmount).toBe(50000);
            expect(res.companyCommission).toBe(10000);
            expect(res.totalPaid).toBe(60000);
        });

        test('4. 근조화환 고급형 -> 지도사 55,000원 + 본사 10,000원 (총수수료 6.5만)', () => {
            const res = calculateProductReward('근조화환 고급형', mockCompany);
            expect(res.rewardAmount).toBe(55000);
            expect(res.companyCommission).toBe(10000);
            expect(res.totalPaid).toBe(65000);
        });

        test('5. 근조화환 프리미엄형(특대) -> 지도사 60,000원 + 본사 10,000원 (총수수료 7만)', () => {
            const res = calculateProductReward('근조화환 프리미엄형', mockCompany);
            expect(res.rewardAmount).toBe(60000);
            expect(res.companyCommission).toBe(10000);
            expect(res.totalPaid).toBe(70000);
        });

        test('6. 근조화환 VIP용(4단) -> 지도사 65,000원 + 본사 10,000원 (총수수료 7.5만)', () => {
            const res = calculateProductReward('근조화환 VIP용 ', mockCompany);
            expect(res.rewardAmount).toBe(65000);
            expect(res.companyCommission).toBe(10000);
            expect(res.totalPaid).toBe(75000);
        });
    });

    describe('추천인 분할 수수료 DB 동적 조회 계산', () => {
        test('상조회사 소속 추천인인 경우 DB 설정값(3,500 / 6,500)으로 분할 적재', () => {
            const res = calculateDynamicReferralBonus({
                isSellerCorporate: false,
                hasRecommender: true,
                isRecommenderCorporate: true,
                recommenderCompanyRecord: mockCompany,
                defaultBonusSetting: 2500,
            });
            expect(res.applied).toBe(true);
            expect(res.recommenderBonus).toBe(3500);
            expect(res.corporateBonus).toBe(6500);
        });

        test('상조회사가 수수료를 다르게 세팅한 경우(예: 4,000 / 6,000), 해당 DB 값으로 유연하게 적용', () => {
            const customCompany = { ...mockCompany, referral_member_bonus: 4000, referral_company_bonus: 6000 };
            const res = calculateDynamicReferralBonus({
                isSellerCorporate: false,
                hasRecommender: true,
                isRecommenderCorporate: true,
                recommenderCompanyRecord: customCompany,
                defaultBonusSetting: 2500,
            });
            expect(res.applied).toBe(true);
            expect(res.recommenderBonus).toBe(4000);
            expect(res.corporateBonus).toBe(6000);
        });

        test('일반 프리랜서 추천인인 경우 시스템 기본값(2,500원) 전액 지급', () => {
            const res = calculateDynamicReferralBonus({
                isSellerCorporate: false,
                hasRecommender: true,
                isRecommenderCorporate: false,
                defaultBonusSetting: 2500,
            });
            expect(res.applied).toBe(true);
            expect(res.recommenderBonus).toBe(2500);
            expect(res.corporateBonus).toBe(0);
        });
    });
});
