'use client';

import Link from 'next/link';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 통합 사이드 메뉴 컴포넌트
 * 모든 페이지에서 동일한 햄버거 메뉴를 사용
 */
export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
    return (
        <div className={`side-menu ${isOpen ? 'active' : ''}`} id="sideMenu">
            <div className="side-menu-overlay" onClick={onClose}></div>
            <div className="side-menu-content">
                <div className="side-menu-header">
                    <div className="side-menu-logo"><img src="/images/logo.png" alt="마음부고" className="side-menu-logo-img" /></div>
                    <button className="side-menu-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="side-menu-nav">
                    <Link href="/create" className="side-menu-item primary" onClick={onClose}>
                        <span className="material-symbols-outlined">add_circle</span>
                        <span>부고장 만들기</span>
                    </Link>
                    <Link href="/search" className="side-menu-item" onClick={onClose}>
                        <span className="material-symbols-outlined">search</span>
                        <span>부고검색</span>
                    </Link>
                    <Link href="/faq" className="side-menu-item" onClick={onClose}>
                        <span className="material-symbols-outlined">help</span>
                        <span>자주 묻는 질문</span>
                    </Link>
                    <Link href="/guide" className="side-menu-item" onClick={onClose}>
                        <span className="material-symbols-outlined">menu_book</span>
                        <span>장례가이드</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}
