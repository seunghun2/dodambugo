import './view.css';

export default function Loading() {
    return (
        <div className="view-container">
            {/* 헤더 이미지 스켈레톤 */}
            <div className="header-photo skeleton-box" style={{ height: '300px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />

            {/* 고인 정보 스켈레톤 */}
            <section className="section deceased-section" style={{ padding: '24px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '4px', background: '#e8e8e8' }} />
                    <div className="skeleton-box" style={{ width: '200px', height: '20px', borderRadius: '4px', background: '#f0f0f0' }} />
                    <div className="skeleton-box" style={{ width: '160px', height: '16px', borderRadius: '4px', background: '#f0f0f0' }} />
                </div>
            </section>

            {/* 장례 정보 스켈레톤 */}
            <section className="section" style={{ padding: '20px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '12px' }}>
                            <div className="skeleton-box" style={{ width: '60px', height: '18px', borderRadius: '4px', background: '#e8e8e8' }} />
                            <div className="skeleton-box" style={{ flex: 1, height: '18px', borderRadius: '4px', background: '#f0f0f0' }} />
                        </div>
                    ))}
                </div>
            </section>

            {/* 하단 버튼 스켈레톤 */}
            <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
                <div className="skeleton-box" style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#e8e8e8' }} />
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
