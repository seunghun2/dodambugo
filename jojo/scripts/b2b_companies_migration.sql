-- ==============================================================================
-- 🏛️ b2b_companies 테이블 표준 스키마 정제 및 무위험 마이그레이션 SQL
-- ==============================================================================
-- 본 마이그레이션은 기존 데이터와 칼럼을 100% 보존하면서
-- 새 표준 칼럼을 추가(ADD COLUMN IF NOT EXISTS)하고, 
-- business_no에 '::' 구분자로 저장되어 있던 과거 데이터를 정식 칼럼으로 안전 복사합니다.
-- ==============================================================================

-- 1. 신규 표준 칼럼 안전 추가 (기존 서비스 영향 0%)
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT '';
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT '';
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS business_item TEXT DEFAULT '';
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS wreath_member_commission_amount NUMERIC DEFAULT 10000;
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS condolence_fee_rate NUMERIC DEFAULT 8.6;
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS condolence_pg_rate NUMERIC DEFAULT 3.0;
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS condolence_platform_rate NUMERIC DEFAULT 2.0;
ALTER TABLE b2b_companies ADD COLUMN IF NOT EXISTS condolence_vat_enabled BOOLEAN DEFAULT true;

-- 2. business_no에 '::' 인코딩되어 있던 과거 레코드 자동 백업 파싱 마이그레이션
DO $$
DECLARE
    r RECORD;
    parts TEXT[];
BEGIN
    FOR r IN SELECT id, business_no, owner_name, address, business_type, business_item, wreath_member_commission_amount FROM b2b_companies WHERE business_no LIKE '%::%' LOOP
        parts := string_to_array(r.business_no, '::');
        UPDATE b2b_companies
        SET 
            business_no = NULLIF(trim(parts[1]), ''),
            owner_name = COALESCE(NULLIF(r.owner_name, ''), NULLIF(trim(parts[2]), ''), ''),
            address = COALESCE(NULLIF(r.address, ''), NULLIF(trim(parts[3]), ''), ''),
            business_type = COALESCE(NULLIF(r.business_type, ''), NULLIF(trim(parts[4]), ''), ''),
            business_item = COALESCE(NULLIF(r.business_item, ''), NULLIF(trim(parts[5]), ''), ''),
            wreath_member_commission_amount = CASE 
                WHEN parts[6] IS NOT NULL AND trim(parts[6]) ~ '^[0-9]+$' THEN trim(parts[6])::NUMERIC 
                ELSE COALESCE(r.wreath_member_commission_amount, 10000)
            END
        WHERE id = r.id;
    END LOOP;
END $$;
