'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Facility {
    id: number;
    name: string;
    address: string;
    phone: string;
    category?: string;
    created_at?: string;
}

export default function AdminFacilitiesPage() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    // 필터 상태
    const [filters, setFilters] = useState({
        name: '',
        address: '',
    });

    // 페이지네이션
    const [page, setPage] = useState(0);
    const pageSize = 50;

    useEffect(() => {
        fetchFacilities();
    }, [page]);

    const fetchFacilities = async () => {
        setLoading(true);

        try {
            const res = await fetch(`/api/facilities?page=${page}&pageSize=${pageSize}`);
            const result = await res.json();

            if (result.error) {
                console.error('Error fetching facilities:', result.error);
            } else {
                setFacilities(result.data || []);
                setTotalCount(result.total || 0);
            }
        } catch (err) {
            console.error('Error fetching facilities:', err);
        }

        setLoading(false);
    };

    const filteredFacilities = facilities.filter(f => {
        if (filters.name && !f.name?.includes(filters.name)) return false;
        if (filters.address && !f.address?.includes(filters.address)) return false;
        return true;
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="admin-pc">
            {/* 사이드바 */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <Link href="/">도담부고</Link>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/admin/bugo" className="nav-item">
                        <span className="material-symbols-outlined">description</span>
                        <span>부고장 관리</span>
                    </Link>
                    <Link href="/admin/facilities" className="nav-item active">
                        <span className="material-symbols-outlined">apartment</span>
                        <span>장례식장 정보</span>
                    </Link>
                    <Link href="/admin/inquiries" className="nav-item">
                        <span className="material-symbols-outlined">mail</span>
                        <span>문의 관리</span>
                    </Link>
                </nav>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>장례식장 정보</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {totalCount.toLocaleString()}건</span>
                        <button onClick={fetchFacilities} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 장례식장 목록 테이블 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>장례식장 목록 ({filteredFacilities.length} / {totalCount.toLocaleString()})</span>
                            <div className="pagination-info">
                                페이지 {page + 1} / {totalPages}
                            </div>
                        </div>

                        {loading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : (
                            <>
                                <div className="inquiry-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '60px' }}>ID</th>
                                                <th>장례식장명</th>
                                                <th>주소</th>
                                                <th style={{ width: '140px' }}>연락처</th>
                                            </tr>
                                            <tr className="filter-row">
                                                <th></th>
                                                <th>
                                                    <input
                                                        type="text"
                                                        placeholder="검색"
                                                        value={filters.name}
                                                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                                    />
                                                </th>
                                                <th>
                                                    <input
                                                        type="text"
                                                        placeholder="검색"
                                                        value={filters.address}
                                                        onChange={(e) => setFilters({ ...filters, address: e.target.value })}
                                                    />
                                                </th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFacilities.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                        장례식장 정보가 없습니다
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredFacilities.map((facility) => (
                                                    <tr
                                                        key={facility.id}
                                                        className={selectedFacility?.id === facility.id ? 'selected' : ''}
                                                        onClick={() => setSelectedFacility(facility)}
                                                    >
                                                        <td className="id-cell">{facility.id}</td>
                                                        <td className="name-cell">{facility.name}</td>
                                                        <td className="address-cell">{facility.address}</td>
                                                        <td className="phone-cell">{facility.phone || '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 페이지네이션 */}
                                <div className="pagination">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                        className="btn-page"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                        이전
                                    </button>
                                    <span className="page-info">{page + 1} / {totalPages}</span>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => p + 1)}
                                        className="btn-page"
                                    >
                                        다음
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 장례식장 상세 패널 */}
                    <div className="detail-panel">
                        {selectedFacility ? (
                            <>
                                <div className="panel-header">
                                    <span>장례식장 상세</span>
                                    <button onClick={() => setSelectedFacility(null)} className="btn-close">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="detail-content">
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>ID</label>
                                            <span>#{selectedFacility.id}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>장례식장명</label>
                                            <span>{selectedFacility.name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>주소</label>
                                            <span>{selectedFacility.address || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>연락처</label>
                                            <span>
                                                {selectedFacility.phone ? (
                                                    <a href={`tel:${selectedFacility.phone}`}>{selectedFacility.phone}</a>
                                                ) : '-'}
                                            </span>
                                        </div>
                                        {selectedFacility.category && (
                                            <div className="detail-row">
                                                <label>분류</label>
                                                <span>{selectedFacility.category}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-actions">
                                        {selectedFacility.phone && (
                                            <a href={`tel:${selectedFacility.phone}`} className="btn-action primary">
                                                <span className="material-symbols-outlined">call</span>
                                                전화하기
                                            </a>
                                        )}
                                        <a
                                            href={`https://map.kakao.com/link/search/${encodeURIComponent(selectedFacility.address || selectedFacility.name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-action"
                                        >
                                            <span className="material-symbols-outlined">map</span>
                                            지도 보기
                                        </a>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">touch_app</span>
                                <p>장례식장을 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    border-top: 1px solid #e2e8f0;
                }
                .btn-page {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    font-size: 14px;
                    color: #334155;
                }
                .btn-page:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-page:hover:not(:disabled) {
                    background: #f8fafc;
                }
                .page-info {
                    font-size: 14px;
                    color: #64748b;
                }
                .pagination-info {
                    font-size: 13px;
                    color: #64748b;
                }
                .id-cell {
                    color: #94a3b8;
                    font-size: 13px;
                }
                .address-cell {
                    font-size: 13px;
                    color: #64748b;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
}
