const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://tbteghoppechzotdojna.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI'
);

async function insertTestBugo() {
    const bugoData = {
        bugo_number: '9999',
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
        death_date: '2026-01-01',
        death_time: '06:30',
        encoffin_date: '2026-01-02',
        encoffin_time: '10:00',
        funeral_date: '2026-01-03',
        funeral_time: '09:00',
        burial_place: '서울추모공원',
        burial_place2: '경기도 용인 추모공원',
        message: '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.\n\n조문객 주차는 병원 주차장 이용 가능하며, 1시간 무료입니다.',
        mourners: [
            { relationship: '장남', name: '김민준', contact: '010-2345-6789' },
            { relationship: '장남', name: '김서준', contact: '' },
            { relationship: '차남', name: '김도윤', contact: '010-3456-7890' },
            { relationship: '차남', name: '김예준', contact: '' },
            { relationship: '삼남', name: '김시우', contact: '010-4567-8901' },
            { relationship: '장녀', name: '김서연', contact: '010-5678-9012' },
            { relationship: '장녀', name: '김다은', contact: '' },
            { relationship: '차녀', name: '김지우', contact: '010-6789-0123' },
            { relationship: '며느리', name: '이수진', contact: '010-7890-1234' },
            { relationship: '며느리', name: '박지은', contact: '' },
            { relationship: '며느리', name: '최유진', contact: '010-8901-2345' },
            { relationship: '사위', name: '정우진', contact: '010-9012-3456' },
            { relationship: '사위', name: '강민호', contact: '' },
            { relationship: '손자', name: '김하준', contact: '' },
            { relationship: '손자', name: '김준서', contact: '' },
            { relationship: '손녀', name: '김소윤', contact: '' },
            { relationship: '손녀', name: '김아린', contact: '' },
            { relationship: '외손자', name: '정서진', contact: '' },
            { relationship: '외손녀', name: '정하은', contact: '' },
        ],
        account_info: [
            { bank: '국민은행', holder: '김영수 (장남)', number: '123-456-789012' },
            { bank: '신한은행', holder: '김서연 (장녀)', number: '987-654-321098' },
            { bank: '하나은행', holder: '김도윤 (차남)', number: '456-789-012345' },
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
        console.log('Success! Bugo Number: 9999');
        console.log('View at: http://localhost:3000/view/9999');
    }
}

insertTestBugo();
