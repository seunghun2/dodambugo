const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let envData = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            envData[match[1]] = value;
        }
    });
}

const supabase = createClient(
    envData.NEXT_PUBLIC_SUPABASE_URL,
    envData.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestProduct() {
    console.log('🔄 [START] Adding 1,000 Won test product to products table...');

    const TEST_PRODUCT_ID = '3c4f7b60-8dbd-4c3e-9080-60b6910a905a';

    // 기존 테스트 상품이 있으면 삭제
    await supabase.from('flower_products').delete().eq('id', TEST_PRODUCT_ID);

    const testProduct = {
        id: TEST_PRODUCT_ID,
        name: '[테스트] 1,000원 결제 테스트',
        price: 1000,
        discount_price: null,
        category: '근조화환',
        images: [
            'https://mnlyqhrjnpbkleenmszm.supabase.co/storage/v1/object/public/images/products/product_1768716017419_0.jpg'
        ],
        description: 'B2B 예치금 자동 연동 확인을 위한 1,000원 테스트 상품입니다.',
        is_active: true,
        include_regions: [],
        exclude_regions: [],
        exclude_facilities: [],
        sort_order: -10, // 가장 맨 앞에 나오도록 정렬 순서 낮춤
        regional_surcharges: {},
        special_area_surcharges: {},
        regional_prices: {
            '강원': 0, '경기': 0, '경남': 0, '경북': 0, '광주': 0, '대구': 0, '대전': 0, '부산': 0,
            '서울': 0, '세종': 0, '울산': 0, '인천': 0, '전남': 0, '전북': 0, '제주': 0, '충남': 0, '충북': 0
        },
        special_surcharges: {}
    };

    const { data, error } = await supabase
        .from('flower_products')
        .insert(testProduct)
        .select()
        .single();

    if (error) {
        console.error('❌ Error inserting test product:', error.message);
    } else {
        console.log('✅ Success! Added 1,000 Won test product:', data.name);
    }
}

addTestProduct();
