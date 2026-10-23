import { redirect } from 'next/navigation';

export default async function B2BCondolenceCompletePage({
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
        redirect(`/b2b/view/${id}`);
    }
}
