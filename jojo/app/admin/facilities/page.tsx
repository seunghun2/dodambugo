'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // 필터 상태
    const [filters, setFilters] = useState({
        name: '',
        address: '',
    });

    // 추가 모달
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFacility, setNewFacility] = useState({
        name: '',
        address: '',
        phone: '',
        category: '장례식장'
    });
    const [saving, setSaving] = useState(false);

    // 처음 한 번만 전체 데이터 로드 (세션 캐시)
    useEffect(() => {
        loadFacilities();
    }, []);

    const loadFacilities = () => {
        // 세션 캐시 확인
        const cached = sessionStorage.getItem('facilities_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setFacilities(parsed.data || []);
                setTotalCount(parsed.total || 0);
                setLoading(false);
                console.log('📦 캐시에서 불러옴:', parsed.total, '건');
                return;
            } catch (e) {
                console.log('캐시 파싱 오류, API 호출');
            }
        }
        // 캐시 없으면 API 호출
        fetchFromAPI();
    };

    const fetchFromAPI = async () => {
        setLoading(true);
        try {
            // 전체 개수 먼저 확인
            const { count } = await supabase
                .from('facilities')
                .select('*', { count: 'exact', head: true });

            const totalCount = count || 0;
            const allData: Facility[] = [];
            const batchSize = 1000;

            // 1000개씩 나눠서 가져오기
            for (let i = 0; i < totalCount; i += batchSize) {
                const { data, error } = await supabase
                    .from('facilities')
                    .select('id, name, address, phone')
                    .order('id', { ascending: true })
                    .range(i, i + batchSize - 1);

                if (error) {
                    console.error('Error fetching batch:', error);
                    break;
                }
                if (data) {
                    allData.push(...data);
                }
            }

            setFacilities(allData);
            setTotalCount(allData.length);
            // 세션 캐시에 저장
            sessionStorage.setItem('facilities_cache', JSON.stringify({
                data: allData,
                total: allData.length,
                cachedAt: new Date().toISOString()
            }));
            console.log('✅ API 호출 완료, 캐시 저장:', allData.length, '건');
        } catch (err: any) {
            console.error('Error fetching facilities:', err);
            alert('장례식장 데이터 불러오기 실패');
        }
        setLoading(false);
    };

    // 새로고침 버튼용 (강제 API 호출)
    const forceRefresh = () => {
        sessionStorage.removeItem('facilities_cache');
        fetchFromAPI();
    };

    // 필터링
    const filteredFacilities = facilities.filter(f => {
        if (filters.name && !f.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
        if (filters.address && !f.address?.toLowerCase().includes(filters.address.toLowerCase())) return false;
        return true;
    });

    // 페이지네이션
    const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage);
    const paginatedFacilities = filteredFacilities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // 필터 변경 시 첫 페이지로
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // 새 장례식장 추가
    const addFacility = async () => {
        if (!newFacility.name || !newFacility.address) {
            alert('장례식장명과 주소는 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('facilities')
                .insert([newFacility])
                .select();

            if (error) {
                alert('추가 중 오류가 발생했습니다.');
                console.error(error);
            } else {
                alert('장례식장이 추가되었습니다.');
                setNewFacility({ name: '', address: '', phone: '', category: '장례식장' });
                setShowAddModal(false);
                // 목록에 추가
                if (data && data[0]) {
                    setFacilities(prev => [...prev, data[0]]);
                    setTotalCount(prev => prev + 1);
                }
            }
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    // 장례식장 삭제
    const deleteFacility = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        const { error } = await supabase
            .from('facilities')
            .delete()
            .eq('id', id);

        if (error) {
            alert('삭제 중 오류가 발생했습니다.');
        } else {
            alert('삭제되었습니다.');
            setFacilities(prev => prev.filter(f => f.id !== id));
            setTotalCount(prev => prev - 1);
            setSelectedFacility(null);
        }
    };

    return (
        <div className="admin-pc">
            <AdminSidebar />

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>장례식장 정보</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {totalCount.toLocaleString()}건</span>
                        <button onClick={forceRefresh} className="btn-refresh" title="캐시 새로고침">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="btn-primary">
                            <span className="material-symbols-outlined">add</span>
                            장례식장 추가
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 장례식장 목록 테이블 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>장례식장 목록 ({filteredFacilities.length.toLocaleString()})</span>
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
                                            {paginatedFacilities.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                        장례식장 정보가 없습니다
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedFacilities.map((facility) => (
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
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="page-btn"
                                        >
                                            ←
                                        </button>
                                        {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 10) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 4) {
                                                pageNum = totalPages - 9 + i;
                                            } else {
                                                pageNum = currentPage - 4 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="page-btn"
                                        >
                                            →
                                        </button>
                                        <span className="page-info">
                                            {currentPage} / {totalPages} 페이지
                                        </span>
                                    </div>
                                )}
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
                                        <button
                                            onClick={() => deleteFacility(selectedFacility.id)}
                                            className="btn-action danger"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                            삭제하기
                                        </button>
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

            {/* 장례식장 추가 모달 */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>장례식장 추가</h3>
                            <button onClick={() => setShowAddModal(false)} className="btn-close">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>장례식장명 *</label>
                                <input
                                    type="text"
                                    value={newFacility.name}
                                    onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                                    placeholder="예: 서울의료원장례식장"
                                />
                            </div>
                            <div className="form-group">
                                <label>주소 *</label>
                                <input
                                    type="text"
                                    value={newFacility.address}
                                    onChange={(e) => setNewFacility({ ...newFacility, address: e.target.value })}
                                    placeholder="예: 서울시 중랑구 신내로 156"
                                />
                            </div>
                            <div className="form-group">
                                <label>연락처</label>
                                <input
                                    type="text"
                                    value={newFacility.phone}
                                    onChange={(e) => setNewFacility({ ...newFacility, phone: e.target.value })}
                                    placeholder="예: 02-1234-5678"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowAddModal(false)} className="btn-cancel">
                                취소
                            </button>
                            <button onClick={addFacility} disabled={saving} className="btn-submit">
                                {saving ? '저장중...' : '추가하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
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
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 480px;
                    overflow: hidden;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .modal-header h3 {
                    font-size: 18px;
                    font-weight: 600;
                }
                .modal-body {
                    padding: 20px;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 6px;
                    color: #334155;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    padding: 16px 20px;
                    border-top: 1px solid #e2e8f0;
                }
                .btn-cancel {
                    padding: 10px 20px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-submit {
                    padding: 10px 20px;
                    background: #0066FF;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 16px;
                    background: #0066FF;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
}
