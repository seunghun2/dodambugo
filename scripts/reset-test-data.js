// 테스트 데이터 초기화 스크립트
// 기존 부고 삭제 후 가짜 테스트 데이터 30개 생성

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tbteghoppechzotdojna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 한국식 이름 생성
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
const maleFirstNames = ['영수', '민호', '준혁', '성현', '동훈', '재원', '승민', '현우', '태영', '정훈', '지훈', '상우', '형준', '건우', '상민'];
const femaleFirstNames = ['영희', '미영', '순자', '옥순', '정숙', '정희', '미숙', '영자', '경숙', '혜진', '수진', '지현', '민정', '서연', '유진'];

// 장례식장 목록 (실제 장례식장)
const funeralHomes = [
    { name: '삼성서울병원장례식장', address: '서울 강남구 일원로 81', tel: '02-3410-6800' },
    { name: '서울아산병원장례식장', address: '서울 송파구 올림픽로43길 88', tel: '02-3010-5500' },
    { name: '세브란스병원장례식장', address: '서울 서대문구 연세로 50-1', tel: '02-2228-6000' },
    { name: '서울성모병원장례식장', address: '서울 서초구 반포대로 222', tel: '02-2258-6000' },
    { name: '고려대안암병원장례식장', address: '서울 성북구 인촌로 73', tel: '02-920-5800' },
    { name: '강남세브란스병원장례식장', address: '서울 강남구 언주로 211', tel: '02-2019-5000' },
    { name: '부산대병원장례식장', address: '부산 서구 구덕로 179', tel: '051-240-7000' },
    { name: '경북대병원장례식장', address: '대구 중구 동덕로 130', tel: '053-200-5114' },
    { name: '전남대병원장례식장', address: '광주 동구 제봉로 42', tel: '062-220-5114' },
    { name: '충남대병원장례식장', address: '대전 중구 문화로 282', tel: '042-280-7000' },
    { name: '분당서울대병원장례식장', address: '경기 성남시 분당구 구미로173번길 82', tel: '031-787-7000' },
    { name: '인하대병원장례식장', address: '인천 중구 인항로 27', tel: '032-890-2000' },
    { name: '원주세브란스기독병원장례식장', address: '강원 원주시 일산로 20', tel: '033-741-0114' },
    { name: '계명대동산병원장례식장', address: '대구 달서구 달구벌대로 1035', tel: '053-250-7114' },
    { name: '영남대병원장례식장', address: '대구 남구 현충로 170', tel: '053-620-3114' },
];

// 관계 목록
const relationships = ['장남', '장녀', '차남', '차녀', '삼남', '삼녀', '아들', '딸', '배우자', '손자', '손녀'];

// 장지 목록
const burialPlaces = [
    '선영 안장', '화장 후 봉안', '화장 후 자연장', '가족묘지 안장',
    '서울추모공원', '용인공원묘지', '벽제승화원', '수원추모공원',
];

// 템플릿 목록
const templates = ['basic', 'ribbon', 'border', 'flower'];

// 장례유형
const funeralTypes = ['일반장례', '가족장', '무빈소'];

// 랜덤 함수
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysFromNow, range) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow + Math.floor(Math.random() * range));
    return date.toISOString().split('T')[0];
}

function randomTime() {
    const hours = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
    const minutes = ['00', '30'];
    return `${randomItem(hours)}:${randomItem(minutes)}`;
}

function generateBugoNumber() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function generateKoreanName(gender) {
    const lastName = randomItem(lastNames);
    const firstName = gender === 'male' ? randomItem(maleFirstNames) : randomItem(femaleFirstNames);
    return lastName + firstName;
}

// 가족 목록 생성
function generateFamilyList(deceasedName, relationship) {
    const families = [];
    const numFamilies = randomAge(1, 4);

    for (let i = 0; i < numFamilies; i++) {
        const rel = i === 0 ? relationship : randomItem(relationships);
        families.push({
            relationship: rel,
            name: generateKoreanName(Math.random() > 0.5 ? 'male' : 'female'),
            contact: `010-${randomAge(1000, 9999)}-${randomAge(1000, 9999)}`
        });
    }

    return JSON.stringify(families);
}

// 계좌 정보 생성
function generateAccountInfo() {
    const banks = ['국민은행', '신한은행', '우리은행', 'NH농협', '하나은행', 'KB국민은행', '기업은행'];
    const accounts = [];
    const numAccounts = randomAge(1, 3);

    for (let i = 0; i < numAccounts; i++) {
        accounts.push({
            bank: randomItem(banks),
            account: `${randomAge(100, 999)}-${randomAge(100000, 999999)}-${randomAge(10000, 99999)}`,
            holder: generateKoreanName(Math.random() > 0.5 ? 'male' : 'female'),
            relationship: randomItem(relationships)
        });
    }

    return JSON.stringify(accounts);
}

// 메시지 목록
const messages = [
    '삼가 고인의 명복을 빕니다.',
    '고인의 명복을 빌며, 유가족분들께 깊은 위로의 말씀을 전합니다.',
    '깊은 슬픔 속에서도 고인의 뜻을 이어받아 힘내시길 바랍니다.',
    '故人의 생전 모습을 기억하며 고인의 명복을 빕니다.',
    '조용히 떠나셨지만 저희 마음 속에 영원히 함께하실 것입니다.',
    '',
];

// 부고 데이터 생성
function generateBugoData(index) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const deceasedName = generateKoreanName(gender);
    const relationship = randomItem(relationships);
    const mournerName = generateKoreanName(Math.random() > 0.5 ? 'male' : 'female');
    const funeralHome = randomItem(funeralHomes);
    const funeralType = randomItem(funeralTypes);

    return {
        bugo_number: generateBugoNumber(),
        template: randomItem(templates),
        applicant_name: mournerName,
        phone_password: randomAge(1000, 9999).toString(),
        deceased_name: deceasedName,
        gender: gender,
        relationship: relationship,
        age: randomAge(65, 98),
        death_date: randomDate(-5, 3),
        religion: randomItem(['불교', '기독교', '천주교', '무교', '']),
        mourner_name: mournerName,
        contact: `010-${randomAge(1000, 9999)}-${randomAge(1000, 9999)}`,
        funeral_home: funeralHome.name,
        room_number: `${randomAge(1, 10)}호실`,
        funeral_home_tel: funeralHome.tel,
        address: funeralHome.address,
        funeral_date: randomDate(0, 3),
        funeral_time: randomTime(),
        burial_place: randomItem(burialPlaces),
        message: randomItem(messages),
        family_list: generateFamilyList(deceasedName, relationship),
        account_info: generateAccountInfo(),
        funeral_type: funeralType,
        // photo_url은 비워둠 (테스트 데이터)
    };
}

async function main() {
    console.log('🗑️  기존 부고 데이터 삭제 중...');

    // 1. 기존 데이터 조회
    const { data: existingBugos, error: fetchError } = await supabase
        .from('bugo')
        .select('id');

    if (fetchError) {
        console.error('조회 오류:', fetchError);
        return;
    }

    console.log(`   현재 ${existingBugos?.length || 0}개 부고 있음`);

    // 2. 기존 데이터 삭제
    if (existingBugos && existingBugos.length > 0) {
        const { error: deleteError } = await supabase
            .from('bugo')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제

        if (deleteError) {
            console.error('삭제 오류:', deleteError);
            return;
        }
        console.log('   ✅ 기존 데이터 삭제 완료');
    }

    // 3. 새 테스트 데이터 생성
    console.log('\n📝 새 테스트 데이터 30개 생성 중...');

    const newBugos = [];
    for (let i = 0; i < 30; i++) {
        newBugos.push(generateBugoData(i));
    }

    // 4. 데이터 삽입
    const { data: insertedData, error: insertError } = await supabase
        .from('bugo')
        .insert(newBugos)
        .select();

    if (insertError) {
        console.error('삽입 오류:', insertError);
        return;
    }

    console.log(`   ✅ ${insertedData.length}개 테스트 부고 생성 완료!`);

    // 5. 결과 출력
    console.log('\n📊 생성된 부고 목록:');
    insertedData.forEach((bugo, i) => {
        console.log(`   ${i + 1}. ${bugo.bugo_number} - 故 ${bugo.deceased_name}님 (${bugo.funeral_home})`);
    });

    console.log('\n🎉 완료!');
}

main().catch(console.error);
