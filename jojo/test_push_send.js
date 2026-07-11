const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mnlyqhrjnpbkleenmszm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHlxaHJqbnBia2xlZW5tc3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2ODAzMywiZXhwIjoyMDgzMjQ0MDMzfQ.j4wM7g0UPbw7Li_aogt_6iOPFnj2dbqN8JypMiJ-a2Q'
);

async function checkToken() {
    const partnerId = '552650f0-3243-4e46-97ec-d2e7ff5de2e2'; // 백승훈 님 ID
    
    // 1. 등록된 푸시 토큰 조회
    const { data: tokens, error } = await supabase
        .from('b2b_push_tokens')
        .select('*')
        .eq('partner_id', partnerId);

    if (error) {
        console.error('토큰 조회 실패:', error);
        return;
    }

    console.log(`등록된 푸시 토큰 개수: ${tokens ? tokens.length : 0}개`);
    console.log('토큰 목록:', tokens);
}

checkToken();
