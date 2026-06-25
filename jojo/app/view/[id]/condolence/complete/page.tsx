import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// 이 페이지는 더 이상 사용하지 않음
// 옛 코드 캐시가 여기로 보낼 수 있으므로 /order/로 서버 사이드 리다이렉트
export default async function CondolenceCompletePage({
    searchParams,
    params,
}: {
    searchParams: Promise<{ orderNumber?: string }>;
    params: Promise<{ id: string }>;
}) {
    const { orderNumber } = await searchParams;
    const { id } = await params;
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const hostLower = host.toLowerCase();
    
    const isB2b =
        hostLower.startsWith('localhost') ||
        hostLower.startsWith('127.0.0.1') ||
        hostLower.startsWith('192.168.') ||
        hostLower.startsWith('partner.') ||
        hostLower.startsWith('b2b.') ||
        hostLower.startsWith('bugoon.');
        
    const pathPrefix = isB2b ? '/b2b' : '';

    if (orderNumber) {
        redirect(`${pathPrefix}/order/${orderNumber}`);
    } else {
        redirect(`${pathPrefix}/view/${id}`);
    }
}
