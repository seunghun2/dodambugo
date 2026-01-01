'use client';

import { useState, useEffect, useRef } from 'react';

interface Facility {
    id: number;
    name: string;
    address: string;
    phone?: string;
}

interface FacilitySearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (facility: { name: string; address: string }, source: 'facility' | 'address') => void;
}

export default function FacilitySearchModal({ isOpen, onClose, onSelect }: FacilitySearchModalProps) {
    const [activeTab, setActiveTab] = useState<'facility' | 'address'>('facility');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const postcodeContainerRef = useRef<HTMLDivElement>(null);

    // 모달 열릴 때 검색창에 포커스 + 초기화
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setResults([]);
            if (activeTab === 'facility') {
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
        }
    }, [isOpen, activeTab]);

    const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
    const [facilitiesLoaded, setFacilitiesLoaded] = useState(false);

    // 모달 열릴 때 전체 시설 한 번 로드
    useEffect(() => {
        if (isOpen && !facilitiesLoaded) {
            const loadFacilities = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch('/facilities.json');
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setAllFacilities(data);
                        setFacilitiesLoaded(true);
                    }
                } catch (err) {
                    console.error('Load facilities error:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            loadFacilities();
        }
    }, [isOpen, facilitiesLoaded]);

    // 장례식장 검색 (로컬 필터링)
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2 || activeTab !== 'facility') {
            setResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = allFacilities.filter(f =>
            f.name?.toLowerCase().includes(query) ||
            f.address?.toLowerCase().includes(query)
        ).slice(0, 20);

        setResults(filtered);
    }, [searchQuery, activeTab, allFacilities]);

    // 다음 주소검색 초기화
    useEffect(() => {
        if (isOpen && activeTab === 'address' && postcodeContainerRef.current) {
            const script = document.createElement('script');
            script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            script.async = true;
            script.onload = () => {
                if (window.daum && postcodeContainerRef.current) {
                    new window.daum.Postcode({
                        oncomplete: (data: any) => {
                            onSelect({
                                name: data.buildingName || '',
                                address: data.roadAddress || data.jibunAddress
                            }, 'address');
                            onClose();
                        },
                        width: '100%',
                        height: '100%'
                    }).embed(postcodeContainerRef.current);
                }
            };
            document.body.appendChild(script);

            return () => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
        }
    }, [isOpen, activeTab, onSelect, onClose]);

    const handleFacilitySelect = (facility: Facility) => {
        onSelect({ name: facility.name, address: facility.address }, 'facility');
        onClose();
    };

    // 검색어 하이라이트
    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} style={{ background: '#fff176', padding: 0 }}>{part}</mark>
                : part
        );
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    maxWidth: '500px',
                    height: '100%',
                    maxHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: '1px solid #eee',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ color: '#333' }}>close</span>
                    </button>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>주소 찾기</h2>
                </div>

                {/* 탭 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    <button
                        onClick={() => setActiveTab('facility')}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'none',
                            border: 'none',
                            fontSize: '15px',
                            color: activeTab === 'facility' ? '#333' : '#888',
                            fontWeight: activeTab === 'facility' ? 600 : 400,
                            cursor: 'pointer',
                            borderBottom: activeTab === 'facility' ? '2px solid #333' : '2px solid transparent'
                        }}
                    >
                        장례식장 검색
                    </button>
                    <button
                        onClick={() => setActiveTab('address')}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'none',
                            border: 'none',
                            fontSize: '15px',
                            color: activeTab === 'address' ? '#333' : '#888',
                            fontWeight: activeTab === 'address' ? 600 : 400,
                            cursor: 'pointer',
                            borderBottom: activeTab === 'address' ? '2px solid #333' : '2px solid transparent'
                        }}
                    >
                        주소 검색
                    </button>
                </div>

                {/* 장례식장 검색 탭 */}
                {activeTab === 'facility' && (
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px', position: 'relative' }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="장례식장명 또는 주소를 입력하세요"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px 48px 14px 16px',
                                    fontSize: '16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    position: 'absolute',
                                    right: '28px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#888'
                                }}
                            >
                                search
                            </span>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {isLoading && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                    검색 중...
                                </div>
                            )}
                            {!isLoading && searchQuery.length >= 2 && results.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                    검색 결과가 없습니다
                                </div>
                            )}
                            {results.map((facility, index) => (
                                <div
                                    key={facility.id || index}
                                    onClick={() => handleFacilitySelect(facility)}
                                    style={{
                                        padding: '16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                                        {highlightMatch(facility.name, searchQuery)}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>
                                        {highlightMatch(facility.address || '', searchQuery)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 주소 검색 탭 (다음 우편번호) */}
                {activeTab === 'address' && (
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div
                            ref={postcodeContainerRef}
                            style={{ width: '100%', height: '100%', minHeight: '400px' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// 다음 우편번호 API 타입 선언
declare global {
    interface Window {
        daum: any;
    }
}
