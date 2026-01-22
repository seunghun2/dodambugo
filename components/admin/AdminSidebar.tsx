'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin/bugo', icon: 'description', label: '부고장 관리' },
    { href: '/admin/condolence-orders', icon: 'payments', label: '부의금 판매' },
    { href: '/admin/flower-orders', icon: 'local_florist', label: '화환 주문' },
    { href: '/admin/facilities', icon: 'apartment', label: '장례식장 정보' },
    { href: '/admin/products', icon: 'inventory_2', label: '상품 등록' },
    { href: '/admin/inquiries', icon: 'mail', label: '문의 관리' },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
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
    );
}
