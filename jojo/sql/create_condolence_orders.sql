-- 부의금 주문 테이블
CREATE TABLE condolence_orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT GENERATED ALWAYS AS ('CO' || LPAD(id::text, 6, '0')) STORED,
    bugo_number TEXT NOT NULL DEFAULT '',
    buyer_name TEXT NOT NULL DEFAULT '',
    buyer_phone TEXT NOT NULL DEFAULT '',
    recipient_name TEXT NOT NULL DEFAULT '',
    amount INTEGER NOT NULL DEFAULT 0,
    fee INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'CARD',
    payment_type TEXT NOT NULL DEFAULT 'card',
    status TEXT NOT NULL DEFAULT 'pending',
    tid TEXT DEFAULT '',
    moid TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    account_no TEXT DEFAULT '',
    receipt_url TEXT DEFAULT '',
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_condolence_orders_bugo_number ON condolence_orders(bugo_number);
CREATE INDEX idx_condolence_orders_status ON condolence_orders(status);
CREATE INDEX idx_condolence_orders_created_at ON condolence_orders(created_at DESC);

-- RLS 활성화
ALTER TABLE condolence_orders ENABLE ROW LEVEL SECURITY;

-- 서비스 키로 전체 접근 허용
CREATE POLICY "Service role has full access" ON condolence_orders
    FOR ALL USING (true) WITH CHECK (true);
