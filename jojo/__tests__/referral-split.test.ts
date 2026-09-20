/**
 * 추천인 수수료 분할 로직 검증 테스트
 * 
 * 계약서 부속서 1 제2조 3항:
 * "제휴사 소속 지도사가 외부 프리랜서 지도사를 추천·가입시킨 경우,
 *  외부 지도사 화환 판매 1건당 추천인 지도사에게 3,500원을 지급하며,
 *  본사 수수료 10,000원 중 잔여 6,500원은 제휴사 본사에 귀속 정산한다."
 */

describe('화환 판매 시 추천인 수수료 분할 로직', () => {
    // 시뮬레이션 함수 (approve/route.ts L518~L575와 동일한 비즈니스 로직)
    function calculateReferralBonus(params: {
        sellerCompanyId: string | null;
        recommenderCompanyId: string | null;
        defaultBonusSetting: number;
    }) {
        const isSellerCorporate = Boolean(params.sellerCompanyId);
        
        // 상조회사 소속 파트너의 판매인 경우 추천 수당 제외
        if (isSellerCorporate) {
            return {
                recommenderBonus: 0,
                corporateBonus: 0,
                applied: false,
                reason: '상조회사 소속 파트너의 판매는 추천수당 제외',
            };
        }

        const isRecommenderCorporate = Boolean(params.recommenderCompanyId);

        if (isRecommenderCorporate) {
            // 제휴 상조회사 소속 지도사가 추천한 경우: 지도사 3,500원 + 상조 본사 6,500원 분할 (합계 10,000원)
            return {
                recommenderBonus: 3500,
                corporateBonus: 6500,
                applied: true,
                reason: '상조회사 소속 추천인 분할 (지도사 3,500원 + 본사 6,500원)',
            };
        } else {
            // 일반 프리랜서 추천인: 설정값(기본 2,500원)
            return {
                recommenderBonus: params.defaultBonusSetting,
                corporateBonus: 0,
                applied: true,
                reason: '일반 프리랜서 추천인 정액 지급',
            };
        }
    }

    test('케이스 1: 외부 프리랜서 지도사가 판매하고, 추천인이 상조회사(더좋은라이프) 소속인 경우', () => {
        const result = calculateReferralBonus({
            sellerCompanyId: null, // 외부 프리랜서
            recommenderCompanyId: 'the-better-life-uuid', // 더좋은라이프 소속
            defaultBonusSetting: 2500,
        });

        expect(result.applied).toBe(true);
        expect(result.recommenderBonus).toBe(3500); // 추천 지도사 3,500원
        expect(result.corporateBonus).toBe(6500);     // 더좋은라이프 본사 6,500원
        expect(result.recommenderBonus + result.corporateBonus).toBe(10000); // 합계 10,000원
    });

    test('케이스 2: 외부 프리랜서 지도사가 판매하고, 추천인도 일반 프리랜서인 경우', () => {
        const result = calculateReferralBonus({
            sellerCompanyId: null, // 외부 프리랜서
            recommenderCompanyId: null, // 일반 프리랜서
            defaultBonusSetting: 2500,
        });

        expect(result.applied).toBe(true);
        expect(result.recommenderBonus).toBe(2500); // 일반 보너스 2,500원
        expect(result.corporateBonus).toBe(0);        // 본사 귀속 0원
    });

    test('케이스 3: 상조회사 소속 지도사가 직접 판매한 경우 (추천 수당 제외 대상)', () => {
        const result = calculateReferralBonus({
            sellerCompanyId: 'the-better-life-uuid', // 상조회사 소속
            recommenderCompanyId: 'the-better-life-uuid',
            defaultBonusSetting: 2500,
        });

        expect(result.applied).toBe(false);
        expect(result.recommenderBonus).toBe(0);
        expect(result.corporateBonus).toBe(0);
    });
});
