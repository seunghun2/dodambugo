'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SideMenu from './SideMenu';
import NavMenu from './NavMenu';

interface HeaderProps {
    showCTA?: boolean;  // "부고장 만들기" 버튼 표시 여부
}

export default function Header({ showCTA = true }: HeaderProps) {
    const router = useRouter();
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [draftModalOpen, setDraftModalOpen] = useState(false);
    const [draftTemplateId, setDraftTemplateId] = useState<string | null>(null);

    const checkDraftBeforeCreate = () => {
        // 템플릿별 임시저장 확인
        const templates = ['basic', 'simple', 'ribbon', 'border', 'flower'];
        for (const template of templates) {
            const draft = localStorage.getItem(`bugo_draft_${template}`);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    const savedAt = new Date(parsed.savedAt);
                    const now = new Date();
                    const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

                    if (hoursDiff < 24) {
                        setDraftTemplateId(template);
                        setDraftModalOpen(true);
                        return;
                    }
                } catch (e) { }
            }
        }
        router.push('/create');
    };

    const continueDraft = () => {
        if (draftTemplateId) {
            router.push(`/create/${draftTemplateId}`);
        }
        setDraftModalOpen(false);
    };

    const discardDraft = () => {
        if (draftTemplateId) {
            localStorage.removeItem(`bugo_draft_${draftTemplateId}`);
        }
        setDraftModalOpen(false);
        setDraftTemplateId(null);
        router.push('/create');
    };

    return (
        <>
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo"><img src="/images/logo.png" alt="마음부고" className="nav-logo-img" /></Link>
                    <NavMenu />
                    <div className="nav-actions">
                        {showCTA && (
                            <button className="nav-cta" onClick={checkDraftBeforeCreate}>부고장 만들기</button>
                        )}
                        <button className="nav-toggle" onClick={() => setSideMenuOpen(true)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

            {/* 임시저장 확인 모달 */}
            {draftModalOpen && (
                <div className="modal-overlay" onClick={() => setDraftModalOpen(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h3>임시저장된 부고장</h3>
                        <p>임시저장된 부고장이 있습니다.<br />계속 작성하시겠습니까?</p>
                        <div className="modal-buttons">
                            <button className="modal-btn secondary" onClick={discardDraft}>아니오</button>
                            <button className="modal-btn primary" onClick={continueDraft}>예</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
