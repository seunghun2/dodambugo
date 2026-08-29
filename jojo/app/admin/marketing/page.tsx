'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import MarketingAdminPage from '@/app/b2b/admin/marketing/page';

export default function B2CMarketingAdminPage() {
    return (
        <div className="admin-container">
            <AdminSidebar />
            <main className="admin-main" style={{ padding: 0, overflowX: 'hidden' }}>
                <MarketingAdminPage />
            </main>
        </div>
    );
}
