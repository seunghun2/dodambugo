'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './funeral-home.css';

interface Facility {
    id: number;
    name: string;
    address: string;
    phone: string;
}

const REGIONS = [
    '전체',
    '서울',
    '경기',
    '인천',
    '부산',
    '대구',
    '대전',
    '광주',
    '울산',
    '세종',
    '강원',
    '충북',
    '충남',
    '전북',
    '전남',
    '경북',
    '경남',
    '제주',
];

const ITEMS_PER_PAGE = 5;

export default function FuneralHomePage() {
    const router = useRouter();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('전체');
    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const observerRef = useRef<HTMLDivElement>(null);
    const regionsRef = useRef<HTMLDivElement>(null);

    const scrollRegions = () => {
        if (regionsRef.current) {
            regionsRef.current.scrollBy({ left: 150, behavior: 'smooth' });
        }
    };

    // 데이터 로드 - 처음 5개 빠르게, 나머지 백그라운드
    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                // 1단계: 처음 5개만 빠르게 로드
                const initialRes = await fetch('/api/facilities?pageSize=5');
                const initialJson = await initialRes.json();
                if (initialJson.data) {
                    setFacilities(initialJson.data);
                    setFilteredFacilities(initialJson.data);
                    setLoading(false);
                }

                // 2단계: 전체 데이터 백그라운드 로드
                const allRes = await fetch('/api/facilities?all=true');
                const allJson = await allRes.json();
                if (allJson.data) {
                    setFacilities(allJson.data);
                    setFilteredFacilities(allJson.data);
                }
            } catch (err) {
                console.error('장례식장 로드 실패:', err);
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    // 필터링
    useEffect(() => {
        let result = facilities;

        // 지역 필터
        if (selectedRegion !== '전체') {
            result = result.filter(f => f.address?.includes(selectedRegion));
        }

        // 검색 필터
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(
                f =>
                    f.name?.toLowerCase().includes(query) ||
                    f.address?.toLowerCase().includes(query)
            );
        }

        setFilteredFacilities(result);
        setDisplayCount(ITEMS_PER_PAGE); // 필터 변경 시 리셋
    }, [facilities, selectedRegion, searchQuery]);

    // 무한 스크롤
    const loadMore = useCallback(() => {
        if (displayCount >= filteredFacilities.length) return;

        setLoadingMore(true);
        setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredFacilities.length));
            setLoadingMore(false);
        }, 300);
    }, [displayCount, filteredFacilities.length]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore && displayCount < filteredFacilities.length) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore, loadingMore, displayCount, filteredFacilities.length]);

    // 스크롤 위치 감지
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateBugo = (facility: Facility) => {
        const params = new URLSearchParams();
        if (facility.name) params.set('funeral_home', facility.name);
        if (facility.address) params.set('address', facility.address);
        if (facility.phone) params.set('funeral_home_tel', facility.phone);
        router.push(`/create/basic?${params.toString()}`);
    };

    const handleMap = (address: string, name: string) => {
        const query = encodeURIComponent(`${name} ${address}`);
        window.open(`https://map.kakao.com/?q=${query}`, '_blank');
    };

    const displayedFacilities = filteredFacilities.slice(0, displayCount);
    const hasMore = displayCount < filteredFacilities.length;

    return (
        <div className="funeral-home-page">
            {/* 헤더 */}
            <div className="funeral-home-header">
                <h1 className="funeral-home-title">장례식장 찾기</h1>
                <p className="funeral-home-subtitle">
                    전국 장례식장 정보를 한눈에<br />
                    지역별로 쉽고 빠르게 찾아보세요
                </p>
            </div>

            {/* 검색 */}
            <div className="funeral-home-search">
                <div className="funeral-home-search-box">
                    <svg className="funeral-home-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className="funeral-home-search-input"
                        placeholder="장례식장명 또는 지역을 검색하세요"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* 지역 필터 - 가로 스크롤 */}
            <div className="funeral-home-regions-wrapper">
                <div className="funeral-home-regions" ref={regionsRef}>
                    {REGIONS.map((region) => (
                        <button
                            key={region}
                            className={`funeral-home-region-btn ${selectedRegion === region ? 'active' : ''}`}
                            onClick={() => setSelectedRegion(region)}
                        >
                            {region}
                        </button>
                    ))}
                </div>
                <button className="funeral-home-regions-arrow" onClick={scrollRegions}>›</button>
            </div>

            {/* 결과 카운트 */}
            {!loading && (
                <div className="funeral-home-count">
                    검색 결과 <strong>{filteredFacilities.length.toLocaleString()}</strong>개
                </div>
            )}

            {/* 로딩 */}
            {loading && (
                <div className="funeral-home-loading">
                    장례식장 목록을 불러오는 중...
                </div>
            )}

            {/* 빈 결과 */}
            {!loading && filteredFacilities.length === 0 && (
                <div className="funeral-home-empty">
                    <div className="funeral-home-empty-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ccc' }}>search_off</span>
                    </div>
                    <p>검색 결과가 없습니다</p>
                </div>
            )}

            {/* 리스트 */}
            {!loading && filteredFacilities.length > 0 && (
                <div className="funeral-home-list">
                    {displayedFacilities.map((facility) => (
                        <div key={facility.id} className="funeral-home-card">
                            <h3 className="funeral-home-card-name">{facility.name}</h3>
                            <div className="funeral-home-card-info">
                                {facility.address && (
                                    <div className="funeral-home-card-row">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>{facility.address}</span>
                                    </div>
                                )}
                                {facility.phone && (
                                    <div className="funeral-home-card-row">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        <span>{facility.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="funeral-home-card-actions">
                                <button
                                    className="funeral-home-card-btn secondary"
                                    onClick={() => handleMap(facility.address, facility.name)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    지도 보기
                                </button>
                                <button
                                    className="funeral-home-card-btn primary"
                                    onClick={() => handleCreateBugo(facility)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                    부고장 만들기
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* 무한 스크롤 감지 영역 */}
                    {hasMore && (
                        <div ref={observerRef} className="funeral-home-loading-more">
                            {loadingMore ? '불러오는 중...' : '스크롤하여 더 보기'}
                        </div>
                    )}
                </div>
            )}

            {/* 맨 위로 가기 버튼 */}
            <button
                className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
                onClick={scrollToTop}
                aria-label="맨 위로"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                </svg>
            </button>
        </div>
    );
}
