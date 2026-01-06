// 테스트 데이터 초기화 스크립트 - 실제처럼 생성

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tbteghoppechzotdojna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 한국식 이름
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍', '백', '허', '문', '배', '유'];
const maleFirstNames = ['영수', '민호', '준혁', '성현', '동훈', '재원', '승민', '현우', '태영', '정훈', '지훈', '상우', '형준', '건우', '상민', '철수', '대한', '민국', '기철', '용환', '성호', '재현', '동수', '진수'];
const femaleFirstNames = ['영희', '미영', '순자', '옥순', '정숙', '정희', '미숙', '영자', '경숙', '혜진', '수진', '지현', '민정', '서연', '유진', '길순', '복순', '말자', '옥자', '순희', '정자', '명자'];

// 장례식장 (실제 장례식장)
const funeralHomes = [
    { name: '서울추모공원', room: '특1호실', address: '서울특별시 강남구 테헤란로 123', tel: '02-1234-5678' },
    { name: '삼성서울병원장례식장', room: '1호실', address: '서울 강남구 일원로 81', tel: '02-3410-6800' },
    { name: '서울아산병원장례식장', room: '2호실', address: '서울 송파구 올림픽로43길 88', tel: '02-3010-5500' },
    { name: '세브란스병원장례식장', room: '3호실', address: '서울 서대문구 연세로 50-1', tel: '02-2228-6000' },
    { name: '서울성모병원장례식장', room: '특2호실', address: '서울 서초구 반포대로 222', tel: '02-2258-6000' },
    { name: '고려대안암병원장례식장', room: '1호실', address: '서울 성북구 인촌로 73', tel: '02-920-5800' },
    { name: '강남세브란스병원장례식장', room: '2호실', address: '서울 강남구 언주로 211', tel: '02-2019-5000' },
    { name: '부산대학교병원장례식장', room: '3호실', address: '부산 서구 구덕로 179', tel: '051-240-7000' },
    { name: '경북대병원장례식장', room: '1호실', address: '대구 중구 동덕로 130', tel: '053-200-5114' },
    { name: '연세대학교 강남장례식장', room: '특1호실', address: '서울 강남구 도곡로 408', tel: '02-2019-3700' },
    { name: '분당서울대병원장례식장', room: '2호실', address: '경기 성남시 분당구 구미로173번길 82', tel: '031-787-7000' },
    { name: '충남대학교병원장례식장', room: '1호실', address: '대전 중구 문화로 282', tel: '042-280-7000' },
    { name: '전남대학교병원장례식장', room: '2호실', address: '광주 동구 제봉로 42', tel: '062-220-5114' },
    { name: '인하대병원장례식장', room: '특1호실', address: '인천 중구 인항로 27', tel: '032-890-2000' },
];

// 관계 목록 (상주 순서대로)
const maleRelationships = ['장남', '차남', '삼남', '아들'];
const femaleRelationships = ['장녀', '차녀', '삼녀', '딸'];
const otherRelationships = ['배우자', '손자', '손녀', '사위', '며느리'];

// 장지
const burialPlaces = ['선영 안장', '화장 후 봉안', '화장 후 자연장', '서울추모공원', '용인공원묘지', '벽제승화원'];

// 템플릿
const templates = ['basic', 'ribbon', 'border', 'flower'];

// 장례유형 (일반 장례 많이)
const funeralTypes = ['일반 장례', '일반 장례', '일반 장례', '일반 장례', '일반 장례', '가족장', '무빈소장례'];

// 은행
const banks = ['국민은행', '신한은행', '우리은행', 'NH농협', '하나은행', '기업은행', '카카오뱅크'];

// 유틸리티
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysFromNow, range) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow + Math.floor(Math.random() * range));
    return date.toISOString().split('T')[0];
}

function randomTime() {
    const hours = ['09', '10', '11', '13', '14', '15'];
    const minutes = ['00', '30'];
    return `${randomItem(hours)}:${randomItem(minutes)}`;
}

function generateBugoNumber() {
    return randomInt(1000, 9999).toString();
}

function generateKoreanName(gender) {
    const lastName = randomItem(lastNames);
    const firstName = gender === 'male' ? randomItem(maleFirstNames) : randomItem(femaleFirstNames);
    return lastName + firstName;
}

function generatePhone() {
    return `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

function generateAccountNumber() {
    return `${randomInt(100, 999)}-${randomInt(100000, 999999)}-${randomInt(10000, 99999)}`;
}

// 상주 목록 생성 (1~10명, 전화번호 적게)
function generateMourners(deceasedLastName) {
    const mourners = [];
    const numMourners = randomInt(1, 10);

    // 성별 분포 (아들/딸 랜덤)
    let maleCount = 0;
    let femaleCount = 0;

    for (let i = 0; i < numMourners; i++) {
        const isMale = Math.random() > 0.4;
        let relationship;

        if (isMale) {
            maleCount++;
            if (maleCount === 1) relationship = '장남';
            else if (maleCount === 2) relationship = '차남';
            else if (maleCount === 3) relationship = '삼남';
            else relationship = '아들';
        } else {
            femaleCount++;
            if (femaleCount === 1) relationship = '장녀';
            else if (femaleCount === 2) relationship = '차녀';
            else if (femaleCount === 3) relationship = '삼녀';
            else relationship = '딸';
        }

        // 가끔 배우자, 손자 등
        if (i === 0 && Math.random() > 0.85) {
            relationship = '배우자';
        }
        if (i > 3 && Math.random() > 0.7) {
            relationship = randomItem(otherRelationships);
        }

        // 상주 이름 (고인과 같은 성 or 다른 성)
        const lastName = (relationship.includes('사위') || relationship.includes('며느리'))
            ? randomItem(lastNames)
            : deceasedLastName;
        const firstName = isMale ? randomItem(maleFirstNames) : randomItem(femaleFirstNames);

        const mourner = {
            relationship: relationship,
            name: lastName + firstName,
        };

        // 전화번호는 20% 확률로만 추가
        if (Math.random() < 0.2) {
            mourner.contact = generatePhone();
        }

        // 계좌는 10% 확률로만 추가
        if (Math.random() < 0.1) {
            mourner.bank = randomItem(banks);
            mourner.accountNumber = generateAccountNumber();
            mourner.accountHolder = mourner.name;
        }

        mourners.push(mourner);
    }

    return mourners;
}

// 계좌 정보 생성 (30% 확률)
function generateAccountInfo(mournerName) {
    if (Math.random() > 0.3) return null;

    const accounts = [];
    const numAccounts = randomInt(1, 2);

    for (let i = 0; i < numAccounts; i++) {
        accounts.push({
            bank: randomItem(banks),
            number: generateAccountNumber(),
            holder: mournerName || generateKoreanName(Math.random() > 0.5 ? 'male' : 'female')
        });
    }

    return accounts;
}

// 부고 데이터 생성
function generateBugoData() {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const deceasedLastName = randomItem(lastNames);
    const deceasedFirstName = gender === 'male' ? randomItem(maleFirstNames) : randomItem(femaleFirstNames);
    const deceasedName = deceasedLastName + deceasedFirstName;

    const mourners = generateMourners(deceasedLastName);
    const mainMourner = mourners[0];
    const funeralHome = randomItem(funeralHomes);
    const funeralType = randomItem(funeralTypes);

    return {
        bugo_number: generateBugoNumber(),
        template: randomItem(templates),
        applicant_name: mainMourner.name,
        phone_password: randomInt(1000, 9999).toString(),
        deceased_name: deceasedName,
        gender: gender,
        relationship: mainMourner.relationship,
        age: randomInt(68, 97),
        death_date: randomDate(-3, 2),
        religion: randomItem(['불교', '기독교', '천주교', '']),
        mourner_name: mainMourner.name,
        contact: mainMourner.contact || '',
        mourners: JSON.stringify(mourners),
        funeral_home: `${funeralHome.name} ${funeralHome.room}`,
        room_number: funeralHome.room,
        funeral_home_tel: funeralHome.tel,
        address: funeralHome.address,
        funeral_date: randomDate(0, 3),
        funeral_time: randomTime(),
        burial_place: randomItem(burialPlaces),
        message: '',
        funeral_type: funeralType,
        account_info: JSON.stringify(generateAccountInfo(mainMourner.name)),
    };
}

async function main() {
    console.log('🗑️  기존 부고 데이터 삭제 중...');

    const { data: existingBugos, error: fetchError } = await supabase
        .from('bugo')
        .select('id');

    if (fetchError) {
        console.error('조회 오류:', fetchError);
        return;
    }

    console.log(`   현재 ${existingBugos?.length || 0}개 부고 있음`);

    if (existingBugos && existingBugos.length > 0) {
        const { error: deleteError } = await supabase
            .from('bugo')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
            console.error('삭제 오류:', deleteError);
            return;
        }
        console.log('   ✅ 기존 데이터 삭제 완료');
    }

    console.log('\n📝 새 테스트 데이터 30개 생성 중...');

    const newBugos = [];
    for (let i = 0; i < 30; i++) {
        newBugos.push(generateBugoData());
    }

    const { data: insertedData, error: insertError } = await supabase
        .from('bugo')
        .insert(newBugos)
        .select();

    if (insertError) {
        console.error('삽입 오류:', insertError);
        return;
    }

    console.log(`   ✅ ${insertedData.length}개 테스트 부고 생성 완료!`);

    // 통계
    const stats = { '일반 장례': 0, '가족장': 0, '무빈소장례': 0 };
    let totalMourners = 0;
    let mournersWithPhone = 0;
    let bugosWithAccount = 0;

    insertedData.forEach(b => {
        stats[b.funeral_type] = (stats[b.funeral_type] || 0) + 1;
        const m = JSON.parse(b.mourners || '[]');
        totalMourners += m.length;
        mournersWithPhone += m.filter(x => x.contact).length;
        if (b.account_info && b.account_info !== 'null') bugosWithAccount++;
    });

    console.log('\n📊 통계:');
    console.log(`   장례유형: 일반 장례 ${stats['일반 장례']}개, 가족장 ${stats['가족장']}개, 무빈소 ${stats['무빈소장례']}개`);
    console.log(`   총 상주: ${totalMourners}명 (평균 ${(totalMourners / 30).toFixed(1)}명/부고)`);
    console.log(`   전화번호 있는 상주: ${mournersWithPhone}명 (${(mournersWithPhone / totalMourners * 100).toFixed(0)}%)`);
    console.log(`   계좌 있는 부고: ${bugosWithAccount}개 (${(bugosWithAccount / 30 * 100).toFixed(0)}%)`);

    console.log('\n📋 샘플:');
    insertedData.slice(0, 3).forEach((bugo, i) => {
        const m = JSON.parse(bugo.mourners || '[]');
        console.log(`   ${i + 1}. #${bugo.bugo_number} - 故 ${bugo.deceased_name}님 | ${bugo.funeral_type}`);
        console.log(`      상주 ${m.length}명: ${m.map(x => `${x.relationship} ${x.name}${x.contact ? '📞' : ''}`).join(', ')}`);
    });

    console.log('\n🎉 완료!');
}

main().catch(console.error);
