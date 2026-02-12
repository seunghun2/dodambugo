import { redirect } from 'next/navigation';

// SEO 리다이렉트: /mobile-bugo → /guide/mobile-bugo
export default function MobileBugoRedirect() {
    redirect('/guide/mobile-bugo');
}
