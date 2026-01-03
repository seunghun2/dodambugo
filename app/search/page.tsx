'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, Bugo } from '@/lib/supabase';
import SideMenu from '@/components/SideMenu';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Bugo[]>([]);
    const [recentBugo, setRecentBugo] = useState<Bugo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 최근 부고 목록 불러오기
    useEffect(() => {
        const fetchRecentBugo = async () => {
            try {
                const { data, error } = await supabase
                    .from('bugo')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setRecentBugo(data || []);
            } catch (err) {
                console.error('최근 부고 로딩 오류:', err);
            }
        };

        fetchRecentBugo();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setCurrentPage(1);

        try {
            const { data, error } = await supabase
                .from('bugo')
                .select('*')
                .or(`bugo_number.eq.${query},deceased_name.ilike.%${query}%,mourner_name.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('검색 오류:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 날짜 포맷 (MM/DD)
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    };

    // 표시할 목록 (검색 결과 또는 최근 부고)
    const fullList = searched ? results : recentBugo;
    const totalPages = Math.ceil(fullList.length / itemsPerPage);
    const displayList = fullList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            {/* Navigation */}
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>도담부고</Link>
                    <ul className="nav-menu" id="navMenu">
                        <li><Link href="/search" className="nav-link">부고검색</Link></li>
                        <li><Link href="/faq" className="nav-link">자주묻는 질문</Link></li>
                    </ul>
                    <div className="nav-actions">
                        <Link href="/create" className="nav-cta">부고장 만들기</Link>
                        <button className="nav-toggle" onClick={() => setSideMenuOpen(true)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

            {/* 검색 섹션 */}
            <section className="faq" id="search" style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div className="container">
                    {/* 검색 헤더 */}
                    <div className="section-header">
                        <h2 className="section-title">부고 검색</h2>
                        <p className="section-subtitle" style={{ color: '#666', marginTop: '8px' }}>
                            부고를 확인하거나 수정하세요
                        </p>
                    </div>

                    {/* 검색 입력 */}
                    <div style={{
                        maxWidth: '700px',
                        margin: '0 auto 40px',
                        display: 'flex',
                        alignItems: 'center',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px 16px'
                    }}>
                        <input
                            type="text"
                            placeholder="상주 또는 고인명"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: '15px',
                                background: 'transparent',
                                color: '#374151'
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                fontSize: '14px',
                                cursor: 'pointer',
                                padding: '4px 8px'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                            검색
                        </button>
                    </div>

                    {/* 부고 목록 - 카드 형태로 띄워서 */}
                    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayList.length > 0 ? (
                            <>
                                {displayList.map((bugo) => (
                                    <Link
                                        key={bugo.id}
                                        href={`/view/${bugo.id}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '18px 20px',
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'box-shadow 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                    >
                                        {/* 번호 + 고인명 */}
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#6b7280', fontWeight: 500 }}>#{bugo.bugo_number}</span>
                                            <span style={{ fontWeight: 600, color: '#1f2937' }}>{bugo.deceased_name}</span>
                                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>(故{bugo.deceased_name})</span>
                                        </div>

                                        {/* 장례식장 */}
                                        <div style={{
                                            width: '150px',
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            textAlign: 'center'
                                        }}>
                                            {bugo.funeral_home || '-'}
                                        </div>

                                        {/* 발인일 + 마이너스 */}
                                        <div style={{
                                            width: '120px',
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            textAlign: 'right',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: '8px'
                                        }}>
                                            <span>
                                                <span style={{ color: '#9ca3af' }}>발인:</span> {formatDate(bugo.funeral_date)}
                                            </span>
                                            <span style={{ color: '#d1d5db', fontSize: '16px' }}>−</span>
                                        </div>
                                    </Link>
                                ))}

                                {/* 페이지네이션 */}
                                {totalPages > 1 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '24px'
                                    }}>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                background: 'white',
                                                color: currentPage === 1 ? '#d1d5db' : '#374151',
                                                cursor: currentPage === 1 ? 'default' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            이전
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: currentPage === page ? 'none' : '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    background: currentPage === page ? '#374151' : 'white',
                                                    color: currentPage === page ? 'white' : '#374151',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: currentPage === page ? 600 : 400
                                                }}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                background: 'white',
                                                color: currentPage === totalPages ? '#d1d5db' : '#374151',
                                                cursor: currentPage === totalPages ? 'default' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            다음
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : searched ? (
                            <div style={{
                                background: 'white',
                                borderRadius: '8px',
                                padding: '60px 20px',
                                textAlign: 'center',
                                border: '1px solid #e5e7eb'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db' }}>search_off</span>
                                <p style={{ marginTop: '16px', color: '#6b7280' }}>검색 결과가 없습니다</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </>
    );
}
