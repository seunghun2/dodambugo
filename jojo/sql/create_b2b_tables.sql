-- =============================================
-- B2B 마음부고 파트너 앱 - 데이터베이스 스키마
-- =============================================

-- 1. B2B 회원 테이블
CREATE TABLE b2b_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(50) NOT NULL,
    bank_name VARCHAR(50),
    account_no VARCHAR(50),
    account_holder VARCHAR(50),
    recommender_id UUID REFERENCES b2b_users(id),
    my_referral_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_b2b_users_phone ON b2b_users(phone);
CREATE INDEX idx_b2b_users_referral_code ON b2b_users(my_referral_code);
CREATE INDEX idx_b2b_users_recommender_id ON b2b_users(recommender_id);

ALTER TABLE b2b_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON b2b_users
    FOR ALL USING (true) WITH CHECK (true);

-- 2. B2B 설정 테이블 (관리자가 금액 등을 세팅)
CREATE TABLE b2b_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 초기 설정값 INSERT
INSERT INTO b2b_settings (key, value, description) VALUES
    ('wreath_reward_amount', '10000', '화환 1건 판매 시 파트너 적립금 (원)'),
    ('referral_bonus_amount', '2000', '추천인 수당 - 추천한 파트너의 화환 판매 시 (원)'),
    ('min_withdrawal_amount', '50000', '최소 출금 신청 금액 (원)');

ALTER TABLE b2b_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON b2b_settings
    FOR ALL USING (true) WITH CHECK (true);

-- 3. 예치금 잔고 테이블
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES b2b_users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON deposits
    FOR ALL USING (true) WITH CHECK (true);

-- 4. 예치금 입출금 내역 테이블
CREATE TABLE deposit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    related_order_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deposit_transactions_user_id ON deposit_transactions(user_id);
CREATE INDEX idx_deposit_transactions_created_at ON deposit_transactions(created_at DESC);
CREATE INDEX idx_deposit_transactions_type ON deposit_transactions(type);

ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON deposit_transactions
    FOR ALL USING (true) WITH CHECK (true);

-- 5. 출금 신청 테이블
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    bank_name VARCHAR(50) NOT NULL,
    account_no VARCHAR(50) NOT NULL,
    account_holder VARCHAR(50) NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON withdrawal_requests
    FOR ALL USING (true) WITH CHECK (true);

-- 6. 기존 bugos 테이블에 b2b_user_id 컬럼 추가 (화환 판매 추적용)
-- ALTER TABLE bugos ADD COLUMN IF NOT EXISTS b2b_user_id UUID REFERENCES b2b_users(id);
-- CREATE INDEX IF NOT EXISTS idx_bugos_b2b_user_id ON bugos(b2b_user_id);
