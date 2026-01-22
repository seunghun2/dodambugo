'use client';

import dynamic from 'next/dynamic';

const CondolenceContent = dynamic(() => import('./CondolenceContent'), {
    ssr: false,
    loading: () => (
        <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#F5F5F5' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                로딩 중...
            </div>
        </main>
    )
});

export default function CondolencePage() {
    return <CondolenceContent />;
}
