import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const target = new URL(`/view/${encodeURIComponent(id)}/thanks/card`, req.url);
    return NextResponse.redirect(target, 307);
}
