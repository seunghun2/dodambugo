import { redirect } from 'next/navigation';

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

    if (orderNumber) {
        redirect(`/order/${orderNumber}`);
    } else {
        redirect(`/view/${id}`);
    }
}
