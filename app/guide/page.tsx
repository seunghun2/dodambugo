'use client';

import { useRouter } from 'next/navigation';

const guides = [
    {
        title: '장례 절차',
        description: '임종부터 발인까지, 3일간의 장례 절차를 상세히 안내해 드립니다.',
        icon: 'church',
        color: '#4A90A4',
        href: '',
    },
    {
        title: '장례 비용',
        description: '장례식장, 상조, 장지 등 항목별 예상 비용을 확인해 보세요.',
        icon: 'payments',
        color: '#5CB85C',
        href: '',
    },
    {
        title: '복장 및 예절',
        description: '조문객과 상주가 지켜야 할 복장과 기본 예절을 알아봅니다.',
        icon: 'checkroom',
        color: '#777',
        href: '/guide/etiquette',
    },
    {
        title: '장례식장 찾기',
        description: '지역별, 시설별 조건에 맞는 장례식장을 쉽고 빠르게 찾아보세요.',
        icon: 'location_on',
        color: '#F0AD4E',
        href: '/guide/funeral-home',
    },
];

export default function GuidePage() {
    const router = useRouter();
    return (
        <>
            {/* Guide Section */}
            <section className="guide-section" id="guide" style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <h1 className="section-title" style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 700 }}>장례가이드</h1>
                        <p className="section-subtitle" style={{ color: '#666', marginTop: '0' }}>
                            갑작스러운 이별에 당황하지 않도록,<br />
                            마음부고가 장례의 모든 것을 안내해 드립니다.
                        </p>
                    </div>

                    <div className="guide-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px',
                        marginTop: '40px'
                    }}>
                        {guides.map((guide) => (
                            <div
                                key={guide.title}
                                className="guide-card"
                                onClick={() => guide.href && router.push(guide.href)}
                                style={{
                                    background: '#fff',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    cursor: guide.href ? 'pointer' : 'default',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    opacity: guide.href ? 1 : 0.7,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: `${guide.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <span className="material-symbols-outlined" style={{ color: guide.color, fontSize: '24px' }}>
                                            {guide.icon}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                                            {guide.title}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
                                            {guide.description}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined" style={{ color: '#ccc', fontSize: '20px' }}>
                                        chevron_right
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 안내 문구 */}
                    <div style={{
                        marginTop: '60px',
                        padding: '24px',
                        background: '#fff',
                        borderRadius: '12px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
                            상세 가이드 페이지는 준비 중입니다.<br />
                            빠른 시일 내에 더 자세한 정보로 찾아뵙겠습니다.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
