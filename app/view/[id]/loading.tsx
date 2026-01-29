import './view.css';

export default function Loading() {
    return (
        <div className="view-container">
            {/* 헤더 이미지 스켈레톤 */}
            <div className="skeleton-header" />

            {/* 고인 정보 스켈레톤 */}
            <section className="section deceased-section" style={{ padding: '24px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton-box skeleton-title" />
                    <div className="skeleton-box skeleton-text-lg" />
                    <div className="skeleton-box skeleton-text-md" />
                </div>
            </section>

            {/* 장례 정보 스켈레톤 */}
            <section className="section" style={{ padding: '20px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '12px' }}>
                            <div className="skeleton-box skeleton-label" />
                            <div className="skeleton-box skeleton-value" />
                        </div>
                    ))}
                </div>
            </section>

            {/* 하단 버튼 스켈레톤 */}
            <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
                <div className="skeleton-box skeleton-button" />
            </div>
        </div>
    );
}
