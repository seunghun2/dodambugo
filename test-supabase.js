// Supabase 연결 테스트
// 브라우저 콘솔에서 이 코드를 실행하세요

async function testSupabase() {
    console.log('🔍 Supabase 연결 테스트 시작...');

    // 1. Supabase 클라이언트 확인
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다!');
        return;
    }
    console.log('✅ Supabase 클라이언트 확인');

    // 2. 간단한 테스트 데이터 INSERT
    const testData = {
        bugo_number: '9999',
        template: 'basic',
        applicant_name: '테스트',
        phone_password: '1234',
        deceased_name: '테스트',
        gender: '남',
        relationship: '테스트',
        mourner_name: '테스트',
        contact: '010-0000-0000',
        funeral_home: '테스트 장례식장'
    };

    console.log('📤 테스트 데이터 전송:', testData);

    try {
        const { data, error } = await supabase
            .from('bugo')
            .insert([testData])
            .select()
            .single();

        if (error) {
            console.error('❌ INSERT 오류:', error);
            console.error('오류 세부사항:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });

            // RLS 문제인지 확인
            if (error.message.includes('policy') || error.message.includes('RLS')) {
                console.error('🚨 RLS (Row Level Security) 정책 문제입니다!');
                console.log('해결 방법:');
                console.log('1. Supabase 대시보드 → Authentication → Policies');
                console.log('2. bugo 테이블에 INSERT 정책 추가');
                console.log('3. 또는 일시적으로 RLS 비활성화');
            }
        } else {
            console.log('✅ INSERT 성공!', data);
            console.log('ID:', data.id);

            // 생성된 테스트 데이터 삭제
            const { error: deleteError } = await supabase
                .from('bugo')
                .delete()
                .eq('id', data.id);

            if (deleteError) {
                console.warn('⚠️ 테스트 데이터 삭제 실패:', deleteError);
            } else {
                console.log('🗑️ 테스트 데이터 삭제 완료');
            }
        }
    } catch (err) {
        console.error('💥 예외 발생:', err);
    }
}

// 테스트 실행
testSupabase();
