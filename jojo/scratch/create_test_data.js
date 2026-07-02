const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// DEV Supabase DB 연결
const supabase = createClient(
  'https://mnlyqhrjnpbkleenmszm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHlxaHJqbnBia2xlZW5tc3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2ODAzMywiZXhwIjoyMDgzMjQ0MDMzfQ.j4wM7g0UPbw7Li_aogt_6iOPFnj2dbqN8JypMiJ-a2Q' // service role key from env.local
);

async function main() {
  console.log('개발용 DB에 테스트용 B2B 유저 및 부고 데이터를 생성합니다...');

  const phone = '01000000000';
  const passwordHash = await bcrypt.hash('test1234!@', 10);
  
  let { data: user } = await supabase
    .from('b2b_users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (!user) {
    console.log('테스트 유저를 새로 생성합니다...');
    const { data: newUser, error: userError } = await supabase
      .from('b2b_users')
      .insert({
        phone,
        password_hash: passwordHash,
        company_name: '부고온 파트너 (서울본부)',
        owner_name: '정태우',
        bank_name: '신한은행',
        account_no: '110-123-456789',
        account_holder: '정태우',
        my_referral_code: 'BUGOON01',
        status: 'approved'
      })
      .select()
      .single();

    if (userError) throw userError;
    user = newUser;
  } else {
    console.log('기존 테스트 유저가 이미 존재하여 정보를 업데이트합니다...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('b2b_users')
      .update({
        company_name: '부고온 파트너 (서울본부)',
        owner_name: '정태우',
        bank_name: '신한은행',
        account_no: '110-123-456789',
        account_holder: '정태우',
        status: 'approved'
      })
      .eq('phone', phone)
      .select()
      .single();

    if (updateError) throw updateError;
    user = updatedUser;
  }

  const { data: deposit } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!deposit) {
    await supabase.from('deposits').insert({
      user_id: user.id,
      balance: 150000
    });
  }

  // 2. 가짜 부고장 생성
  console.log('테스트용 진짜 부고장을 생성합니다...');
  const mournersList = [
    { relationship: '장남', name: '정인호', contact: '010-1234-5678', bank: '신한은행', accountNumber: '110-123-456789', accountHolder: '정인호' },
    { relationship: '차남', name: '정인수', contact: '010-8765-4321' },
    { relationship: '장녀', name: '정지혜', contact: '010-1111-2222' }
  ];

  const bugoId = '7206eece-c432-45cb-9e64-43613b93b5d8';
  
  // 이미 있는지 체크
  let { data: existingBugo } = await supabase
    .from('bugo')
    .select('*')
    .eq('id', bugoId)
    .single();

  if (!existingBugo) {
    const { data: bugo, error: bugoError } = await supabase
      .from('bugo')
      .insert({
        id: bugoId,
        bugo_number: bugoId,
        b2b_user_id: user.id,
        deceased_name: '정태우',
        applicant_name: '정인호',
        relationship: '장남',
        mourner_name: '정인호',
        contact: '010-1234-5678',
        phone_password: '1234',
        gender: '남성',
        age: '82',
        religion: '기독교',
        funeral_home: '서울아산병원 장례식장',
        room_number: '102호',
        death_date: '2026-07-02',
        death_time: '09:00',
        encoffin_date: '2026-07-03',
        encoffin_time: '13:00',
        funeral_date: '2026-07-04',
        funeral_time: '08:00',
        burial_place: '분당 메모리얼 파크',
        mourners: JSON.stringify(mournersList),
        hide_funeral: false,
        funeral_type: '일반장례'
      })
      .select()
      .single();

    if (bugoError) throw bugoError;
    console.log('생성 완료! ID:', bugo.id);
  } else {
    // 업데이트
    const { data: bugo, error: bugoError } = await supabase
      .from('bugo')
      .update({
        bugo_number: bugoId,
        b2b_user_id: user.id,
        deceased_name: '정태우',
        applicant_name: '정인호',
        relationship: '장남',
        mourner_name: '정인호',
        contact: '010-1234-5678',
        phone_password: '1234',
        gender: '남성',
        age: '82',
        religion: '기독교',
        funeral_home: '서울아산병원 장례식장',
        room_number: '102호',
        death_date: '2026-07-02',
        death_time: '09:00',
        encoffin_date: '2026-07-03',
        encoffin_time: '13:00',
        funeral_date: '2026-07-04',
        funeral_time: '08:00',
        burial_place: '분당 메모리얼 파크',
        mourners: JSON.stringify(mournersList),
        hide_funeral: false,
        funeral_type: '일반장례'
      })
      .eq('id', bugoId)
      .select()
      .single();

    if (bugoError) throw bugoError;
    console.log('업데이트 완료! ID:', bugo.id);
  }
}

main().catch(console.error);
