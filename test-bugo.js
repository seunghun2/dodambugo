// 테스트용 부고 생성 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tbteghoppechzotdojna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestBugo() {
    const bugoNumber = '9999';

    const testData = {
        bugo_number: bugoNumber,
        template_id: 'flower',
        applicant_name: '테스트신청자',
        phone_password: '9999',
        deceased_name: '테스트고인',
        gender: '남',
        age: 85,
        religion: '기독교',
        relationship: '장남',
        mourner_name: '테스트대표상주',
        contact: '010-0000-0000',
        mourners: [
            { relationship: '차남', name: '테스트추가상주1', contact: '010-1111-1111' },
            { relationship: '장녀', name: '테스트추가상주2', contact: '010-2222-2222' },
            { relationship: '차녀', name: '테스트추가상주3', contact: '010-3333-3333' }
        ],
        funeral_home: '테스트장례식장',
        room_number: '101호',
        funeral_home_tel: '02-1234-5678',
        address: '서울시 강남구 테스트로 123',
        address_detail: '테스트빌딩 3층',
        death_date: '2025-01-01',
        death_time: '10:30',
        encoffin_date: '2025-01-02',
        encoffin_time: '14:00',
        funeral_date: '2025-01-03',
        funeral_time: '09:00',
        burial_place: '테스트추모공원',
        message: '삼가 고인의 명복을 빕니다. 생전에 베풀어 주신 사랑과 은혜에 깊이 감사드립니다.',
        account_info: [
            { bank: '신한은행', holder: '테스트예금주1', number: '110-123-456789' },
            { bank: '국민은행', holder: '테스트예금주2', number: '123-456-789012' }
        ],
        photo_url: null,
        status: 'active'
    };

    // 기존 테스트 데이터 삭제
    await supabase.from('bugo').delete().eq('bugo_number', bugoNumber);

    // 새 데이터 삽입
    const { data, error } = await supabase
        .from('bugo')
        .insert([testData])
        .select()
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('✅ 테스트 부고 생성 완료!');
    console.log('부고번호:', bugoNumber);
    console.log('View 페이지: http://localhost:3000/view/' + bugoNumber);
    console.log('\n=== 저장된 데이터 ===');
    console.log('mourner_name:', data.mourner_name);
    console.log('mourners:', JSON.stringify(data.mourners, null, 2));
    console.log('account_info:', JSON.stringify(data.account_info, null, 2));
    console.log('death_time:', data.death_time);
    console.log('encoffin_time:', data.encoffin_time);
    console.log('funeral_time:', data.funeral_time);
    console.log('template_id:', data.template_id);
}

createTestBugo();
