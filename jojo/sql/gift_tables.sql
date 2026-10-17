-- 답례품과 함께 보내기 (다우기술 모바일쿠폰 연동 예정)
-- 신규 테이블 3개. 기존 테이블은 건드리지 않음.
-- RLS를 켜고 policy를 만들지 않음 = anon/authenticated 접근 전면 차단, service_role(서버 API)만 접근 가능.
-- (받는 사람 전화번호 등 개인정보가 들어가므로 클라이언트에서 직접 읽지 못하게 막는 것이 목적)

create table if not exists public.gift_products (
    id uuid primary key default gen_random_uuid(),
    brand text not null,
    name text not null,
    category text not null default '기타',
    list_price integer not null check (list_price >= 0),   -- 다우 상품리스트 상품금액(정가)
    sale_price integer not null check (sale_price >= 0),   -- 실제 판매가 (서버에서만 신뢰)
    image_url text,
    badge text,                                            -- BEST / 추천 / 인기
    daou_sheet text,                                       -- 물품교환형 / 금액권(잔액관리형) 등
    daou_goods_code text,                                  -- 다우 상품코드 (요청서 접수 후 채움)
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (brand, name)
);

create table if not exists public.gift_orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null unique,
    bugo_id uuid references public.bugo(id),
    bugo_number text not null,
    buyer_name text,
    product_id uuid references public.gift_products(id),
    product_name text not null,                            -- 주문 시점 스냅샷
    unit_price integer not null check (unit_price >= 0),   -- 주문 시점 판매가 스냅샷
    quantity integer not null check (quantity > 0),        -- 받는 사람 수
    total_amount integer not null check (total_amount >= 0),
    card_id text,
    message text,
    status text not null default 'pending'
        check (status in ('pending','test_paid','paid','sending','sent','partial','failed','cancelled')),
    is_test boolean not null default false,                -- 테스트 모드 주문 (실결제/실발송 없음)
    tid text,                                              -- PG 거래번호
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.gift_order_recipients (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.gift_orders(id) on delete cascade,
    name text,
    phone text not null,                                   -- 숫자만 (01012345678)
    source text not null default 'manual'
        check (source in ('contact','excel','manual','condolence','flower')),
    send_status text not null default 'pending'
        check (send_status in ('pending','sent','failed')),
    coupon_ref text,                                       -- 다우 발행 거래번호
    error text,
    sent_at timestamptz,
    created_at timestamptz not null default now(),
    unique (order_id, phone)
);

create index if not exists idx_gift_orders_bugo_number on public.gift_orders (bugo_number, created_at desc);
create index if not exists idx_gift_order_recipients_order on public.gift_order_recipients (order_id);
create index if not exists idx_gift_products_active on public.gift_products (is_active, sort_order);

alter table public.gift_products enable row level security;
alter table public.gift_orders enable row level security;
alter table public.gift_order_recipients enable row level security;
