'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const templates = {
    basic: { name: '부고장 기본형', src: '/templates/basic.html' },
    ribbon: { name: '부고장 정중형', src: '/templates/ribbon.html' },
    border: { name: '부고장 안내형', src: '/templates/border.html' },
    flower: { name: '부고장 국화', src: '/templates/flower.html' },
};

export default function PreviewPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.template as string;
    const template = templates[templateId as keyof typeof templates];

    if (!template) {
        return (
            <div className="preview-error">
                <p>템플릿을 찾을 수 없습니다.</p>
                <Link href="/create">돌아가기</Link>
            </div>
        );
    }

    const handleSelect = () => {
        router.push(`/create/${templateId}`);
    };

    return (
        <div className="preview-page">
            {/* 헤더 */}
            <header className="preview-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h1>{template.name} 미리보기</h1>
                <div style={{ width: 40 }}></div>
            </header>

            {/* 미리보기 영역 */}
            <div className="preview-iframe-container">
                <iframe src={template.src} title={template.name} />
            </div>

            {/* 하단 버튼 */}
            <div className="preview-footer">
                <button className="btn-use-template-full" onClick={handleSelect}>
                    제작하기
                </button>
            </div>
        </div>
    );
}
