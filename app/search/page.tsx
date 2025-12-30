'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase, Bugo } from '@/lib/supabase';
import SideMenu from '@/components/SideMenu';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Bugo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [sideMenuOpen, setSideMenuOpen] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            // 부고번호 또는 고인 성함으로 검색
            const { data, error } = await supabase
                .from('bugo')
                .select('*')
                .or(`bugo_number.eq.${query},deceased_name.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(20);

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

    // 날짜 포맷
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <>
            {/* Navigation - 메인과 동일 */}
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>도담부고</Link>
                    <ul className="nav-menu" id="navMenu">
                        <li><Link href="/" className="nav-link">홈</Link></li>
                        <li><Link href="/search" className="nav-link">부고검색</Link></li>
                        <li><Link href="/create" className="nav-link">부고장 만들기</Link></li>
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

            {/* Side Menu - 공통 컴포넌트 */}
            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

            {/* 검색 섹션 */}
            <section className="search-section">
                <div className="container">
                    {/* 검색 헤더 */}
                    <div className="search-header">
                        <h1 className="search-title">부고 검색</h1>
                        <p className="search-subtitle">고인 성함 또는 부고번호로 검색하세요</p>
                    </div>

                    {/* 검색 입력 */}
                    <div className="search-box">
                        <div className="search-input-wrapper">
                            <span className="material-symbols-outlined search-icon">search</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="고인 성함 또는 부고번호 (4자리)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                            />
                            {loading && <div className="search-spinner"></div>}
                        </div>
                        <button
                            className="btn-search"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? '검색 중...' : '검색하기'}
                        </button>
                    </div>

                    {/* 검색 결과 */}
                    {searched && (
                        <div className="search-results">
                            {results.length > 0 ? (
                                <>
                                    <p className="results-count">{results.length}개의 부고장을 찾았습니다</p>
                                    <div className="results-list">
                                        {results.map((bugo) => (
                                            <Link
                                                key={bugo.id}
                                                href={`/view/${bugo.id}`}
                                                className="result-card"
                                            >
                                                <div className="result-info">
                                                    <h3 className="result-name">故 {bugo.deceased_name}</h3>
                                                    <div className="result-meta">
                                                        <span className="result-number">부고번호: {bugo.bugo_number}</span>
                                                        {bugo.funeral_home && (
                                                            <span className="result-location">{bugo.funeral_home}</span>
                                                        )}
                                                        {bugo.funeral_date && (
                                                            <span className="result-date">발인: {formatDate(bugo.funeral_date)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined result-arrow">chevron_right</span>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="no-results">
                                    <span className="material-symbols-outlined no-results-icon">search_off</span>
                                    <h3>검색 결과가 없습니다</h3>
                                    <p>입력하신 정보와 일치하는 부고장을 찾을 수 없습니다.<br />다른 검색어로 다시 시도해 주세요.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 홈으로 */}
                    <div className="back-home">
                        <Link href="/" className="btn-back-home">
                            <span className="material-symbols-outlined">home</span>
                            홈으로 돌아가기
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
