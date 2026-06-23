import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const { data, error } = await supabase
            .from('facilities')
            .select('id, name, address, phone')
            .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
            .order('name')
            .limit(20);

        if (error) {
            console.error('Facilities search error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error('Facilities search exception:', err);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
