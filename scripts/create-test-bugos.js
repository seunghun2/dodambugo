// 테스트 부고 4개 생성 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://fazlgepxrhlbotwpigof.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhemxnZXB4cmhsYm90d3BpZ29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MTk1MjYsImV4cCI6MjA0OTA5NTUyNn0.bkVxMYCN5zAzKrXe0zOHmDWKCQMkWVtGwMzUv5k4r7o'
);

const templates = [
    { id: 'basic', number: '9001', name: '베이직' },
    { id: 'flower', number: '9002', name: '플라워' },
    { id: 'border', number: '9003', name: '보더' },
    { id: 'ribbon', number: '9004', name: '리본' }
];

async function createTestBugos() {
    for (const template of templates) {
        const { data, error } = await supabase
            .from('bugo')
            .upsert({
                bugo_number: template.number,
                template_id: template.id,
                applicant_name: '테스트',
                phone_password: '1234',
                deceased_name: `테스트고인(${template.name})`,
                gender: '남성',
                age: 85,
                death_date: '2025-01-15',
                death_time: '08:30',
                relationship: '아들',
                mourner_name: '테스트상주',
                contact: '010-1234-5678',
                mourners: [
                    { relationship: '며느리', name: '김영희', contact: '010-2345-6789' },
                    { relationship: '손자', name: '홍민수', contact: '010-3456-7890' }
                ],
                funeral_home: '서울제일장례식장',
                room_number: '특실 1호',
                funeral_home_tel: '02-123-4567',
                address: '서울특별시 강남구 테헤란로 123',
                address_detail: '2층',
                funeral_date: '2025-01-17',
                funeral_time: '11:30',
                burial_place: '영락공원',
                account_info: [
                    { bank: '국민은행', number: '123-456-789012', holder: '테스트상주' }
                ]
            }, { onConflict: 'bugo_number' })
            .select();

        if (error) {
            console.log(`❌ ${template.number} (${template.id}):`, error.message);
        } else {
            console.log(`✅ ${template.number} (${template.id}) 생성 완료`);
        }
    }
}

createTestBugos();
