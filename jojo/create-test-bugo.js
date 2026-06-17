const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://tbteghoppechzotdojna.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI'
);

const mourners = [
    { relationship: '장남', name: '김철수', contact: '010-1111-1111', bank: '국민은행', accountHolder: '김철수', accountNumber: '123-456-789012' },
    { relationship: '장녀', name: '김영희', contact: '010-1111-2222', bank: '신한은행', accountHolder: '김영희', accountNumber: '234-567-890123' },
    { relationship: '차남', name: '김민수', contact: '010-1111-3333', bank: '우리은행', accountHolder: '김민수', accountNumber: '345-678-901234' },
    { relationship: '차녀', name: '김수진', contact: '010-1111-4444', bank: '하나은행', accountHolder: '김수진', accountNumber: '456-789-012345' },
    { relationship: '3남', name: '김준호', contact: '010-1111-5555' },
    { relationship: '3녀', name: '김미나', contact: '010-1111-6666' },
    { relationship: '4남', name: '김성민', contact: '010-1111-7777' },
    { relationship: '4녀', name: '김지은', contact: '010-1111-8888' },
    { relationship: '5남', name: '김현우', contact: '010-1111-9999' },
    { relationship: '5녀', name: '김서연', contact: '010-2222-0000' },
    { relationship: '장손자', name: '김도윤', contact: '010-2222-1111', bank: '농협은행', accountHolder: '김도윤', accountNumber: '567-890-123456' },
    { relationship: '장손녀', name: '김서윤', contact: '010-2222-2222' },
    { relationship: '손자', name: '김예준', contact: '010-2222-3333' },
    { relationship: '손녀', name: '김하은', contact: '010-2222-4444' },
    { relationship: '손자', name: '김시우', contact: '010-2222-5555' },
    { relationship: '손녀', name: '김지우', contact: '010-2222-6666' },
    { relationship: '며느리', name: '박미영', contact: '010-3333-1111', bank: '기업은행', accountHolder: '박미영', accountNumber: '678-901-234567' },
    { relationship: '사위', name: '이준혁', contact: '010-3333-2222' },
    { relationship: '며느리', name: '정수현', contact: '010-3333-3333' },
    { relationship: '사위', name: '최민재', contact: '010-3333-4444' },
];

const bugoData = {
    bugo_number: 8888,
    template_id: 'basic',
    applicant_name: '김철수',
    phone_password: '1234',
    deceased_name: '김대한',
    gender: '남',
    age: 92,
    religion: '불교',
    relationship: '장남',
    mourner_name: '김철수',
    contact: '010-1111-1111',
    funeral_home: '서울추모공원',
    room_number: '특1호실',
    funeral_home_tel: '02-123-4567',
    address: '서울특별시 강남구 테헤란로 123',
    address_detail: '서울추모공원',
    death_date: '2026-01-01',
    death_time: '08:30',
    encoffin_date: '2026-01-02',
    encoffin_time: '10:00',
    funeral_date: '2026-01-03',
    funeral_time: '11:00',
    burial_place: '화장',
    burial_place2: '용인 공원묘지',
    message: '삼가 고인의 명복을 빕니다. 유가족 일동',
    mourners: JSON.stringify(mourners),
    account_info: JSON.stringify([
        { holder: '김철수', bank: '국민은행', number: '123-456-789012' }
    ]),
    photo_url: null,
    status: 'active'
};

async function create() {
    const { data, error } = await supabase.from('bugo').upsert(bugoData);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('✅ Success! Bugo #8888 created with 20 mourners');
        console.log('View: http://localhost:3000/view/8888');
    }
}

create();
