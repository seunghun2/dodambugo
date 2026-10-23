-- 답례품 상품 라벨 (gift_products.badge)
--
-- 라벨 4종 (상품 1개당 1개). 목록·상세에서 이미지 오른쪽 위에 표시된다.
--   부담없는 : 1만원 미만 (가격 기준이라 사실 그대로)
--   자주선택 : 편집 배치. ※ 아직 주문 데이터가 없어서 '많이 팔린 순위'가 아니다.
--              주문이 쌓이면 실제 판매 기준으로 다시 정할 것 (근거 없는 인기 표시는 표시광고법 리스크)
--   든든한   : 샌드위치·도너츠 등 식사/간식 구성
--   정성가득 : 홀케이크·피스 등 정성이 느껴지는 3만원대 케이크
--
-- 다시 돌려도 같은 결과가 나오도록 먼저 전부 비운 뒤 지정한다.

UPDATE public.gift_products SET badge = NULL WHERE badge IS NOT NULL;

UPDATE public.gift_products SET badge = '부담없는' WHERE is_active AND sale_price < 10000;

UPDATE public.gift_products SET badge = '자주선택'
WHERE is_active AND (
       (brand = '스타벅스'     AND name LIKE '[부드러운 디저트(HOT)]%')
    OR (brand = '투썸플레이스' AND name = '떠먹는 스초생 + 떠먹는 아박')
    OR (brand = '투썸플레이스' AND name = '[투썸플레이스] 3만원권')
    OR (brand = '파리바게뜨'   AND name = '파리바게뜨 교환권 30,000원')
);

UPDATE public.gift_products SET badge = '든든한'
WHERE is_active AND (
       (brand = '스타벅스'     AND name LIKE '[든든히 먹고 힘내요]%')
    OR (brand = '스타벅스'     AND name LIKE '[함께하는 가치]%')
    OR (brand = '투썸플레이스' AND name = '떠먹는 스초생 + 떠먹는 아박 + 아메리카노 R 2잔')
    OR (brand = '던킨도너츠'   AND name = '도너츠 10개입')
);

UPDATE public.gift_products SET badge = '정성가득'
WHERE is_active AND (
       (brand = '투썸플레이스' AND name = '투썸 오벌 티라미수')
    OR (brand = '투썸플레이스' AND name = '스초생(R) (스트로베리 초콜릿 생크림)')
    OR (brand = '투썸플레이스' AND name = '화이트 스초생')
    OR (brand = '파리바게뜨'   AND name = '마이넘버원 케이크')
);
