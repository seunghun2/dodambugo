'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin/bugo', icon: 'description', label: '부고장 관리' },
    { href: '/admin/drafts', icon: 'edit_note', label: '임시저장' },
    { href: '/admin/condolence-orders', icon: 'payments', label: '부의금 판매' },
    { href: '/admin/flower-orders', icon: 'local_florist', label: '화환 주문' },
    { href: '/admin/facilities', icon: 'apartment', label: '장례식장 정보' },
    { href: '/admin/products', icon: 'inventory_2', label: '상품 등록' },
    { href: '/admin/inquiries', icon: 'mail', label: '문의 관리' },
    { href: '/admin/blocked-ips', icon: 'block', label: 'IP 제한' },
];

// 모바일 하단 탭에 표시할 핵심 메뉴만
const mobileNavItems = [
    { href: '/admin/bugo', icon: 'description', label: '부고' },
    { href: '/admin/flower-orders', icon: 'local_florist', label: '화환' },
    { href: '/admin/condolence-orders', icon: 'payments', label: '부의금' },
    { href: '/admin/inquiries', icon: 'mail', label: '문의' },
    { href: '/admin/blocked-ips', icon: 'block', label: 'IP' },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <>
            {/* PC 사이드바 (768px 이상) */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <Link href="/">마음부고</Link>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* 모바일 하단 네비 (768px 이하) */}
            <nav className="admin-mobile-nav">
                {mobileNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={pathname === item.href ? 'active' : ''}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>
        </>
    );
}

