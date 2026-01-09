'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SideMenu from '@/components/SideMenu';
import NavMenu from '@/components/NavMenu';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [isChangeMode, setIsChangeMode] = useState(false);
    const pathname = usePathname();

    // 클라이언트에서만 change 파라미터 체크
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setIsChangeMode(params.get('change') !== null);
    }, [pathname]);

    // 홈, 뷰 페이지, 완료 페이지, 템플릿 변경 모드에서는 헤더 숨김 (각자 관리)
    const hideHeader = pathname === '/' || pathname.startsWith('/view/') || pathname.startsWith('/create/complete/') || isChangeMode;

    if (hideHeader) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Navigation - 공통 헤더 */}
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                        <img src="/images/logo.png" alt="마음부고" className="nav-logo-img" />
                    </Link>
                    <NavMenu />
                    <div className="nav-actions">
                        <Link href="/create" className="nav-cta">부고장 만들기</Link>
                        <button className="nav-toggle" onClick={() => setSideMenuOpen(true)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Side Menu */}
            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

            {/* Page Content */}
            {/* Page Content */}
            <main style={{ paddingTop: '80px', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
                {children}
            </main>
        </>
    );
}
