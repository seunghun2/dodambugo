import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    try {
        // 전체 개수
        const { count, error: countError } = await supabase
            .from('facilities')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Count error:', countError);
        }

        // 데이터 가져오기
        const { data, error } = await supabase
            .from('facilities')
            .select('id, name, address, phone')
            .order('name')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Facilities list error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            data: data || [],
            total: count || 0,
            page,
            pageSize
        });
    } catch (err) {
        console.error('Facilities list exception:', err);
        return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 });
    }
}
