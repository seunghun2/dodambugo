const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 1. .env.local 환경 변수 로드
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
} else {
    console.error('❌ .env.local not found!');
    process.exit(1);
}

const supabase = createClient(
    envData.NEXT_PUBLIC_SUPABASE_URL,
    envData.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_USER_ID = '552650f0-3243-4e46-97ec-d2e7ff5de2e2'; // 백승훈님 계정 ID
const TEST_PASSWORD = 'test0612!'; // 설정할 비밀번호

async function setup() {
    console.log('🔄 [START] Setting up Baek Seunghun account and test bugo...');

    // 1. 비밀번호 해시 생성 및 사용자 정보 업데이트
    console.log('🔑 Hashing password and updating user account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, salt);

    const { error: userUpdateError } = await supabase
        .from('b2b_users')
        .update({
            password_hash: passwordHash,
            bank_name: '국민은행',
            account_no: '48710201225438',
            account_holder: '백승훈',
            owner_name: '백승훈',
            company_name: '부고온 파트너 상조',
            status: 'approved' // 로그인 및 정산 가능하도록 승인 상태 보장
        })
        .eq('id', TARGET_USER_ID);

    if (userUpdateError) {
        console.error('❌ Error updating user info:', userUpdateError);
        process.exit(1);
    }
    console.log('✅ User account updated successfully.');

    // 2. 기존 8888번 테스트 부고장 삭제 (충돌 방지)
    console.log('🧹 Cleaning up old 8888 bugo...');
    // 연계된 주문 내역 삭제 (있을 시)
    const { data: oldBugo } = await supabase.from('bugo').select('id').eq('bugo_number', '8888').single();
    if (oldBugo) {
        await supabase.from('flower_orders').delete().eq('bugo_id', oldBugo.id);
    }
    await supabase.from('bugo').delete().eq('bugo_number', '8888');
    console.log('✅ Old 8888 bugo cleaned.');

    // 3. 백승훈님 명의의 새 8888번 부고장 생성
    console.log('📝 Creating new 8888 B2B bugo...');
    const bugoData = {
        bugo_number: '8888',
        template_id: 'basic',
        applicant_name: '백승훈',
        phone_password: '1234',
        deceased_name: '김순자 (테스트)',
        gender: '여',
        relationship: '장남',
        mourner_name: '백승훈',
        contact: '010-6426-2393',
        age: 87,
        religion: '불교',
        funeral_home: '테스트 서울장례식장',
        room_number: '특1호실',
        funeral_home_tel: '02-1234-5678',
        address: '서울특별시 강남구 테헤란로 123',
        address_detail: '테스트 서울장례식장 특1호실',
        death_date: '2026-06-25',
        death_time: '06:30',
        encoffin_date: '2026-06-26',
        encoffin_time: '10:00',
        funeral_date: '2026-06-27',
        funeral_time: '09:00',
        burial_place: '서울추모공원',
        burial_place2: '용인 추모공원',
        message: '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.\n\n실제 카드 결제 및 예치금 적립 테스트용 부고장입니다.',
        mourners: [
            { relationship: '장남', name: '백승훈', contact: '010-6426-2393', bank: '국민은행', accountHolder: '백승훈', accountNumber: '48710201225438', accountDisplay: 'mine' }
        ],
        account_info: [
            { bank: '국민은행', holder: '백승훈 (장남)', number: '48710201225438' }
        ],
        photo_url: null,
        status: 'active',
        b2b_user_id: TARGET_USER_ID,
        hide_flower_order: false
    };

    const { data: newBugo, error: bugoInsertError } = await supabase
        .from('bugo')
        .insert(bugoData)
        .select()
        .single();

    if (bugoInsertError) {
        console.error('❌ Error inserting bugo:', bugoInsertError);
        process.exit(1);
    }
    console.log('✅ New B2B Test Bugo created successfully.');
    console.log(`🎉 [COMPLETED] Setup Successful!`);
    console.log(`- B2B Partner Login: 010-6426-2393 / test0612!`);
    console.log(`- Test Bugo Number: 8888`);
}

setup();
