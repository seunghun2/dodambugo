const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertTestBugo() {
    const bugoData = {
        bugo_number: '7799',
        template_id: 'basic',
        applicant_name: '백승훈',
        phone_password: '1234',
        deceased_name: '백순자',
        gender: '여',
        relationship: '장남',
        mourner_name: '백승훈',
        contact: '010-1234-5678',
        age: 87,
        religion: '불교',
        funeral_home: '삼성서울병원장례식장',
        room_number: '특3호실',
        funeral_home_tel: '02-3410-3140',
        address: '서울특별시 강남구 일원로 81',
        address_detail: '삼성서울병원 장례식장',
        death_date: '2026-06-25',
        death_time: '06:30',
        encoffin_date: '2026-06-26',
        encoffin_time: '10:00',
        funeral_date: '2026-06-27',
        funeral_time: '09:00',
        burial_place: '서울추모공원',
        burial_place2: '경기도 용인 추모공원',
        message: '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.\n\n조문객 주차는 병원 주차장 이용 가능하며, 1시간 무료입니다.',
        mourners: [
            { relationship: '장남', name: '백승훈', contact: '010-2345-6789' },
            { relationship: '장녀', name: '백지원', contact: '010-5678-9012' }
        ],
        account_info: [
            { bank: '국민은행', holder: '백승훈 (장남)', number: '48710201225438' }
        ],
        photo_url: null,
        status: 'active',
    };

    const { data, error } = await supabase
        .from('bugo')
        .insert(bugoData)
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Bugo Number: 7799');
        console.log('View at: http://localhost:3000/view/7799');
    }
}

insertTestBugo();
