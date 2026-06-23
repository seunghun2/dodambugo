'use client';

import { useEffect } from 'react';

export default function KBEscrow() {
    useEffect(() => {
        // KB 인증마크 팝업 함수를 전역으로 등록
        (window as any).onPopKBAuthMark = function () {
            window.open('', 'KB_AUTHMARK', 'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no');
            const form = document.forms.namedItem('KB_AUTHMARK_FORM') as HTMLFormElement;
            if (form) {
                form.action = 'https://okbfex.kbstar.com/quics';
                form.target = 'KB_AUTHMARK';
                form.submit();
            }
        };
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        (window as any).onPopKBAuthMark();
    };

    return (
        <div className="kb-escrow-mark">
            <form name="KB_AUTHMARK_FORM" method="get">
                <input type="hidden" name="page" value="C021590" />
                <input type="hidden" name="cc" value="b034066:b035526" />
                <input type="hidden" name="mHValue" value="09239508992513713e3e1abe2cc3f7db4c" />
            </form>
            <a href="#" onClick={handleClick} title="KB에스크로 이체 인증마크">
                <img
                    src="http://img1.kbstar.com/img/escrow/escrowcmark.gif"
                    alt="KB에스크로 이체 인증마크"
                    style={{ border: 0, marginTop: '16px' }}
                />
            </a>
        </div>
    );
}
