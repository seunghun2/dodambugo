import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const templates = [
            { id: 'basic', number: '9001', name: '베이직' },
            { id: 'flower', number: '9002', name: '플라워' },
            { id: 'border', number: '9003', name: '보더' },
            { id: 'ribbon', number: '9004', name: '리본' }
        ];

        const results = [];

        for (const template of templates) {
            const { data, error } = await supabase
                .from('bugo')
                .insert({
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
                }, { ignoreDuplicates: true })
                .select();

            results.push({
                template: template.id,
                number: template.number,
                success: !error,
                error: error?.message
            });
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
