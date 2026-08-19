/**
 * B2B 상조회사 데이터 표준화 유틸리티 (jojo/lib/b2b-company.ts)
 * 기존 :: 구분자로 묶여있던 business_no 레거시 및 신규 정식 DB 칼럼을 100% 하위 호환으로 정제합니다.
 */

export interface B2BCompany {
    id: string;
    name: string;
    business_no: string;
    owner_name: string;
    address: string;
    business_type: string;
    business_item: string;
    wreath_commission_amount: number; // 상조 본사 화환 수수료 (기본 10,000원)
    wreath_member_commission_amount: number; // 소속 지도사 화환 수당 (기본 10,000원)
    gift_commission_amount: number; // 상조 본사 답례품 수수료 (기본 5,000원)
    gift_member_commission_amount: number; // 소속 지도사 답례품 수당 (기본 5,000원)
    gift_company_rate?: number; // 답례품 상조 쉐어 퍼센트 (%) (선택)
    condolence_fee_rate: number; // 부의금 총 수수료율 (기본 8.6%)
    condolence_company_rate: number; // 상조회사 부의금 쉐어 수수료율 (%) (기본 3.3%)
    condolence_pg_rate: number; // PG 원가 명목 수수료율 (기본 3.0%)
    condolence_platform_rate: number; // 대표님 운영대행 몫 수수료율 (기본 2.0%)
    condolence_vat_enabled: boolean; // VAT 10% 공제 적용 여부
    created_at?: string;
}

export function normalizeCompanyData(comp: any): B2BCompany {
    if (!comp) {
        return {
            id: '',
            name: '',
            business_no: '',
            owner_name: '',
            address: '',
            business_type: '',
            business_item: '',
            wreath_commission_amount: 10000,
            wreath_member_commission_amount: 10000,
            gift_commission_amount: 5000,
            gift_member_commission_amount: 5000,
            condolence_fee_rate: 8.6,
            condolence_company_rate: 3.3, // 8.6 - 3.3(PG+VAT) - 2.0(플랫폼) = 3.3
            condolence_pg_rate: 3.0,
            condolence_platform_rate: 2.0,
            condolence_vat_enabled: true,
        };
    }

    let real_business_no = comp.business_no || '';
    let owner_name = comp.owner_name || '';
    let address = comp.address || '';
    let business_type = comp.business_type || '';
    let business_item = comp.business_item || '';
    let wreath_member_commission_amount = comp.wreath_member_commission_amount;

    // 2중 안전망 (Fallback): 과거 :: 인코딩 레코드인 경우 분해
    if (comp.business_no && typeof comp.business_no === 'string' && comp.business_no.includes('::')) {
        const parts = comp.business_no.split('::');
        real_business_no = parts[0] || '';
        owner_name = owner_name || parts[1] || '';
        address = address || parts[2] || '';
        business_type = business_type || parts[3] || '';
        business_item = business_item || parts[4] || '';
        if ((wreath_member_commission_amount === undefined || wreath_member_commission_amount === null) && parts[5]) {
            wreath_member_commission_amount = parseInt(parts[5], 10);
        }
    }

    return {
        ...comp,
        id: comp.id || '',
        name: comp.name || '',
        business_no: real_business_no,
        owner_name,
        address,
        business_type,
        business_item,
        wreath_commission_amount: comp.wreath_commission_amount !== undefined && comp.wreath_commission_amount !== null 
            ? Number(comp.wreath_commission_amount) 
            : 10000,
        wreath_member_commission_amount: wreath_member_commission_amount !== undefined && wreath_member_commission_amount !== null 
            ? Number(wreath_member_commission_amount) 
            : 10000,
        gift_commission_amount: comp.gift_commission_amount !== undefined && comp.gift_commission_amount !== null 
            ? Number(comp.gift_commission_amount) 
            : 5000,
        gift_member_commission_amount: comp.gift_member_commission_amount !== undefined && comp.gift_member_commission_amount !== null 
            ? Number(comp.gift_member_commission_amount) 
            : 5000,
        condolence_fee_rate: comp.condolence_fee_rate !== undefined && comp.condolence_fee_rate !== null
            ? Number(comp.condolence_fee_rate)
            : 8.6,
        condolence_company_rate: comp.condolence_company_rate !== undefined && comp.condolence_company_rate !== null
            ? Number(comp.condolence_company_rate)
            : 3.3, // 8.6 - 3.3(PG+VAT) - 2.0(플랫폼) = 3.3
        condolence_pg_rate: comp.condolence_pg_rate !== undefined && comp.condolence_pg_rate !== null
            ? Number(comp.condolence_pg_rate)
            : 3.0,
        condolence_platform_rate: comp.condolence_platform_rate !== undefined && comp.condolence_platform_rate !== null
            ? Number(comp.condolence_platform_rate)
            : 2.0,
        condolence_vat_enabled: comp.condolence_vat_enabled !== undefined && comp.condolence_vat_enabled !== null
            ? Boolean(comp.condolence_vat_enabled)
            : true,
    };
}
