'use client';

import Link from 'next/link';

// 네비게이션 메뉴 아이템 - 전체 사이트 공통
export const NAV_ITEMS = [
    { href: '/search', label: '부고검색' },
    { href: '/faq', label: '자주묻는 질문' },
    { href: '/guide', label: '장례가이드' },
];

export default function NavMenu() {
    return (
        <ul className="nav-menu" id="navMenu">
            {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                    <Link href={item.href} className="nav-link">{item.label}</Link>
                </li>
            ))}
        </ul>
    );
}
