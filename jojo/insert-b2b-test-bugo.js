const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mnlyqhrjnpbkleenmszm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHlxaHJqbnBia2xlZW5tc3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2ODAzMywiZXhwIjoyMDgzMjQ0MDMzfQ.j4wM7g0UPbw7Li_aogt_6iOPFnj2dbqN8JypMiJ-a2Q'
);

async function insertB2BTestBugo() {
    // 8888번 테스트 부고가 이미 있으면 먼저 삭제
    const { error: deleteError } = await supabase
        .from('bugo')
        .delete()
        .eq('bugo_number', '8888');

    if (deleteError) {
        console.error('Delete error:', deleteError);
    } else {
        console.log('Cleared existing 8888 bugo if any.');
    }

    const bugoData = {
        bugo_number: '8888',
        template_id: 'basic',
        applicant_name: '김영호',
        phone_password: '1234',
        deceased_name: '김순자',
        gender: '여',
        relationship: '장남',
        mourner_name: '김영수',
        contact: '010-1234-5678',
        age: 87,
        religion: '불교',
        funeral_home: '삼성서울병원장례식장',
        room_number: '특3호실',
        funeral_home_tel: '02-3410-3140',
        address: '서울특별시 강남구 일원로 81',
        address_detail: '삼성서울병원 장례식장',
        death_date: '2026-06-20',
        death_time: '06:30',
        encoffin_date: '2026-06-21',
        encoffin_time: '10:00',
        funeral_date: '2026-06-22',
        funeral_time: '09:00',
        burial_place: '서울추모공원',
        burial_place2: '경기도 용인 추모공원',
        message: '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.\n\n조문객 주차는 병원 주차장 이용 가능하며, 1시간 무료입니다.',
        mourners: [
            { relationship: '장남', name: '김영수', contact: '010-1234-5678', bank: '국민은행', accountHolder: '김영수', accountNumber: '123-456-789012', accountDisplay: 'mine' },
            { relationship: '장녀', name: '김서연', contact: '010-5678-9012', bank: '신한은행', accountHolder: '김서연', accountNumber: '987-654-321098', accountDisplay: 'mine' },
            { relationship: '차남', name: '김도윤', contact: '010-3456-7890', bank: '하나은행', accountHolder: '김도윤', accountNumber: '456-789-012345', accountDisplay: 'mine' }
        ],
        account_info: [
            { bank: '국민은행', holder: '김영수 (장남)', number: '123-456-789012' }
        ],
        photo_url: null,
        status: 'active',
        b2b_user_id: '552650f0-3243-4e46-97ec-d2e7ff5de2e2',
        religious_title: '집사',
        show_religious_title: true,
        partner_logo_url: '/images/sangjo/더좋은라이프.png'
    };

    const { data, error } = await supabase
        .from('bugo')
        .insert(bugoData)
        .select();

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Success! B2B Test Bugo Number: 8888');
        console.log('Test Links:');
        console.log('1. 전체 노출 (m 없음): http://localhost:3000/view/8888');
        console.log('2. 김영수 본인계좌만 노출: http://localhost:3000/view/8888?m=김영수');
        console.log('3. 김서연 본인계좌만 노출: http://localhost:3000/view/8888?m=김서연');
    }
}

insertB2BTestBugo();
