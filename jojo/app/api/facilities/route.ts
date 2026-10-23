import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const fetchAll = searchParams.get('all') === 'true';

    try {
        // 전체 개수
        const { count, error: countError } = await supabase
            .from('facilities')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Count error:', countError);
        }

        // 전체 데이터 요청 시 (Supabase 1000개 제한 우회)
        if (fetchAll && count && count > 0) {
            const allData: Array<{ id: number; name: string; address: string; phone: string }> = [];
            const batchSize = 1000;
            const totalPages = Math.ceil(count / batchSize);

            for (let i = 0; i < totalPages; i++) {
                const { data, error } = await supabase
                    .from('facilities')
                    .select('id, name, address, phone')
                    .order('name')
                    .range(i * batchSize, (i + 1) * batchSize - 1);

                if (error) {
                    console.error('Facilities fetch error:', error);
                    break;
                }
                if (data) {
                    allData.push(...data);
                }
            }

            return NextResponse.json({
                data: allData,
                total: count,
                page: 0,
                pageSize: count
            });
        }

        // 일반 페이지네이션
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
