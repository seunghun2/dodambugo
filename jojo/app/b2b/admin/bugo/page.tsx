'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
    IconSearch, 
    IconDownload,
    IconRefresh,
    IconX,
    IconEye,
    IconEdit,
    IconTrash,
    IconRestore,
    IconPointer,
    IconBan,
    IconCheck,
    IconAlertCircle
} from '@tabler/icons-react';
import styles from './bugo.module.css';

interface B2BBugo {
    id: string;
    bugo_number: number;
    deceased_name: string;
    mourner_name: string;
    mourners: any[];
    funeral_home: string;
    room: string;
    created_at: string;
    company_name: string;
    owner_name: string;
    phone: string;
    funeral_type?: string;
    view_count: number;
    flower_count: number;
    ip_address: string;
    deleted_at: string | null;
    template_id: string;
    message: string;
    address: string;
    hide_flower_order?: boolean;
}

export default function BugoPage() {
    const [bugoList, setBugoList] = useState<B2BBugo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBugo, setSelectedBugo] = useState<B2BBugo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState<string>('전체');
    const itemsPerPage = 50;

    // 필터 상태
    const [filters, setFilters] = useState({
        funeral_home: '',
        deceased_name: '',
        company_name: '',
        owner_name: '',
        phone: '',
        ip_address: '',
    });

    const fetchBugoList = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/b2b/admin/bugo');
            if (!res.ok) {
                throw new Error('부고 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setBugoList(data.bugoList);
            } else {
                setError(data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBugoList();
    }, []);

    // 필터링 적용
    const filteredBugos = bugoList.filter(bugo => {
        if (filters.funeral_home && !bugo.funeral_home?.includes(filters.funeral_home)) return false;
        if (filters.deceased_name && !bugo.deceased_name?.includes(filters.deceased_name)) return false;
        if (filters.company_name && !bugo.company_name?.includes(filters.company_name)) return false;
        if (filters.owner_name && !bugo.owner_name?.includes(filters.owner_name)) return false;
        if (filters.phone) {
            const queryPhone = filters.phone.replace(/[^0-9]/g, '');
            const userPhone = bugo.phone.replace(/[^0-9]/g, '');
            if (!userPhone.includes(queryPhone)) return false;
        }
        if (filters.ip_address && !bugo.ip_address?.includes(filters.ip_address)) return false;
        
        if (typeFilter !== '전체') {
            const bugoType = bugo.funeral_type || '일반 장례';
            if (typeFilter === '일반장례' && bugoType !== '일반 장례') return false;
            if (typeFilter === '가족장' && bugoType !== '가족장') return false;
            if (typeFilter === '무빈소' && bugoType !== '무빈소장례') return false;
        }
        return true;
    });

    // 페이지네이션 적용
    const totalPages = Math.ceil(filteredBugos.length / itemsPerPage);
    const paginatedBugos = filteredBugos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // 필터 변경 시 첫 페이지로 이동
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, typeFilter]);

    // CSV/Excel 다운로드 기능 (UTF-8 BOM 헤더 포함)
    const handleDownloadExcel = () => {
        if (filteredBugos.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['생성일시', '부고번호', '개설 파트너사', '대표자명', '고인 성함', '상주 성함', '장례식장', '빈소', '장례형식', '화환 수', '방문자 수', '판매율', 'IP 주소', '파트너 연락처'];
        const rows = filteredBugos.map(b => [
            formatDate(b.created_at),
            String(b.bugo_number),
            b.company_name,
            b.owner_name,
            b.deceased_name,
            b.mourner_name,
            b.funeral_home,
            b.room,
            b.funeral_type || '일반 장례',
            String(b.flower_count),
            String(b.view_count),
            getSalesRate(b.view_count, b.flower_count),
            b.ip_address,
            formatPhone(b.phone)
        ]);

        const csvContent = 
            '\ufeff' + // UTF-8 BOM 추가
            [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `b2b_bugo_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const deleteBugo = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const response = await fetch('/api/admin/delete-bugo', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const result = await response.json();
                alert('삭제 중 오류가 발생했습니다: ' + result.error);
            } else {
                alert('소프트 삭제되었습니다.');
                fetchBugoList();
                if (selectedBugo && selectedBugo.id === id) {
                    setSelectedBugo({ ...selectedBugo, deleted_at: new Date().toISOString() });
                }
            }
        } catch (error) {
            console.error(error);
            alert('삭제 중 네트워크 오류가 발생했습니다.');
        }
    };

    const restoreBugo = async (id: string) => {
        if (!confirm('복구하시겠습니까?')) return;

        try {
            const response = await fetch('/api/admin/restore-bugo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const result = await response.json();
                alert('복구 중 오류가 발생했습니다: ' + result.error);
            } else {
                alert('복구되었습니다.');
                fetchBugoList();
                if (selectedBugo && selectedBugo.id === id) {
                    setSelectedBugo({ ...selectedBugo, deleted_at: null });
                }
            }
        } catch (error) {
            console.error(error);
            alert('복구 중 네트워크 오류가 발생했습니다.');
        }
    };

    const formatPhone = (p: string) => {
        const clean = p.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
        }
        return p;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        // Supabase 타임스탬프에 Z가 없을 시 로컬 타임스탬프로 맞추기 위해 Z 추가
        const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const period = hours < 12 ? '오전' : '오후';
        const hour12 = hours % 12 || 12;
        return `${year}-${month}-${day} ${period} ${hour12}:${minutes}`;
    };

    const getSalesRate = (views: number, flowers: number) => {
        if (!views || views === 0) return '0%';
        return Math.round((flowers / views) * 100) + '%';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>B2B 부고 조회</h1>
                    <p className={styles.subtitle}>B2B 파트너(지도사)들이 생성 및 관리 중인 모바일 부고장 목록입니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.totalCount}>총 {filteredBugos.length}건</span>
                    <button onClick={fetchBugoList} className={styles.btnRefresh}>
                        <IconRefresh stroke={1.5} size={16} />
                        <span>새로고침</span>
                    </button>
                    <button onClick={handleDownloadExcel} className={styles.excelBtn}>
                        <IconDownload stroke={1.5} size={16} />
                        <span>엑셀 다운로드</span>
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <div className={styles.contentArea}>
                {/* 테이블 영역 */}
                <div className={styles.tablePanel}>
                    <div className={styles.tableCard}>
                        <div className={styles.tableWrapper}>
                            {loading ? (
                                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                                    부고 내역을 불러오는 중...
                                </div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>장례식장</th>
                                            <th>고인명</th>
                                            <th>개설 파트너사</th>
                                            <th>대표자명</th>
                                            <th>장례형식</th>
                                            <th>화환</th>
                                            <th>방문</th>
                                            <th>판매율</th>
                                            <th>IP</th>
                                            <th>제작일시</th>
                                        </tr>
                                        <tr className={styles.filterRow}>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="장례식장 검색"
                                                    value={filters.funeral_home}
                                                    onChange={(e) => setFilters({ ...filters, funeral_home: e.target.value })}
                                                />
                                            </th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="고인명 검색"
                                                    value={filters.deceased_name}
                                                    onChange={(e) => setFilters({ ...filters, deceased_name: e.target.value })}
                                                />
                                            </th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="파트너사 검색"
                                                    value={filters.company_name}
                                                    onChange={(e) => setFilters({ ...filters, company_name: e.target.value })}
                                                />
                                            </th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="대표명 검색"
                                                    value={filters.owner_name}
                                                    onChange={(e) => setFilters({ ...filters, owner_name: e.target.value })}
                                                />
                                            </th>
                                            <th>
                                                <select
                                                    value={typeFilter}
                                                    onChange={(e) => setTypeFilter(e.target.value)}
                                                >
                                                    <option value="전체">전체</option>
                                                    <option value="일반장례">일반</option>
                                                    <option value="가족장">가족장</option>
                                                    <option value="무빈소">무빈소</option>
                                                </select>
                                            </th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="IP 검색"
                                                    value={filters.ip_address}
                                                    onChange={(e) => setFilters({ ...filters, ip_address: e.target.value })}
                                                />
                                            </th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBugos.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    조회할 부고장이 없습니다.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedBugos.map((bugo) => (
                                                <tr
                                                    key={bugo.id}
                                                    onClick={() => setSelectedBugo(bugo)}
                                                    className={`${selectedBugo?.id === bugo.id ? styles.selectedRow : ''} ${bugo.deleted_at ? styles.deletedRow : ''}`}
                                                >
                                                    <td>
                                                        {bugo.deleted_at && (
                                                            <span className={styles.deletedIcon} title="삭제됨">
                                                                <IconBan size={14} />
                                                            </span>
                                                        )}
                                                        {bugo.funeral_home}
                                                    </td>
                                                    <td style={{ fontWeight: '600' }}>{bugo.deceased_name}</td>
                                                    <td style={{ fontWeight: '600' }}>{bugo.company_name}</td>
                                                    <td>{bugo.owner_name}</td>
                                                    <td style={{ fontSize: '12px', color: bugo.funeral_type === '가족장' ? '#dc2626' : bugo.funeral_type === '무빈소장례' ? '#2563eb' : '#475569' }}>
                                                        {bugo.funeral_type === '일반 장례' || !bugo.funeral_type ? '일반' : bugo.funeral_type === '무빈소장례' ? '무빈소' : bugo.funeral_type}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{bugo.flower_count || 0}</td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{bugo.view_count || 0}</td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{getSalesRate(bugo.view_count || 0, bugo.flower_count || 0)}</td>
                                                    <td style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{bugo.ip_address || '-'}</td>
                                                    <td style={{ fontSize: '12px', color: '#64748b' }}>{formatShortDate(bugo.created_at)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={styles.pageBtn}
                                >
                                    &larr;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={styles.pageBtn}
                                >
                                    &rarr;
                                </button>
                                <span className={styles.pageInfo}>
                                    총 {filteredBugos.length}개 중 {(currentPage - 1) * itemsPerPage + 1}~{Math.min(currentPage * itemsPerPage, filteredBugos.length)} 표시
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 상세 보기 패널 */}
                <div className={styles.detailPanel}>
                    {selectedBugo ? (
                        <>
                            <div className={styles.panelHeader}>
                                <span>부고장 상세</span>
                                <button onClick={() => setSelectedBugo(null)} className={styles.btnClose}>
                                    <IconX size={18} />
                                </button>
                            </div>
                            <div className={styles.detailContent}>
                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <label>부고번호</label>
                                        <span className={styles.bugoNum}>#{selectedBugo.bugo_number}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>고인명</label>
                                        <span>{selectedBugo.deceased_name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>개설 파트너사</label>
                                        <span>{selectedBugo.company_name} ({selectedBugo.owner_name})</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>파트너 연락처</label>
                                        <span>{formatPhone(selectedBugo.phone)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>상주(신청자)</label>
                                        <span>{selectedBugo.mourner_name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>장례식장</label>
                                        <span>{selectedBugo.funeral_home} {selectedBugo.room || ''}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>주소</label>
                                        <span>{selectedBugo.address || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>제작일시</label>
                                        <span>{formatDate(selectedBugo.created_at)}</span>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <label>방문자 수</label>
                                        <span>{selectedBugo.view_count || 0}명</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>화환 판매</label>
                                        <span>{selectedBugo.flower_count || 0}건</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>판매율</label>
                                        <span>{getSalesRate(selectedBugo.view_count || 0, selectedBugo.flower_count || 0)}</span>
                                    </div>
                                    {selectedBugo.ip_address && (
                                        <div className={styles.detailRow}>
                                            <label>IP 주소</label>
                                            <span style={{ fontFamily: 'monospace', color: '#1a56db' }}>{selectedBugo.ip_address}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedBugo.mourners && (
                                    <div className={styles.detailSection}>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', display: 'block' }}>상주 정보</label>
                                        <div className={styles.messageBox}>
                                            {(() => {
                                                let mourners = selectedBugo.mourners;
                                                if (typeof mourners === 'string') {
                                                    try { mourners = JSON.parse(mourners); } catch { mourners = []; }
                                                }
                                                if (!Array.isArray(mourners)) return '-';
                                                return mourners.map((m: any, i: number) => (
                                                    <div key={i}>{m.relationship} {m.name} {m.contact ? `(${m.contact})` : ''}</div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {selectedBugo.message && (
                                    <div className={styles.detailSection}>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', display: 'block' }}>안내사항</label>
                                        <div className={styles.messageBox}>{selectedBugo.message}</div>
                                    </div>
                                )}

                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow} style={{ alignItems: 'center' }}>
                                        <label>근조화환 주문 연동</label>
                                        <button
                                            onClick={async () => {
                                                const newVal = !selectedBugo.hide_flower_order;
                                                const { error } = await supabase.from('bugo').update({ hide_flower_order: newVal }).eq('id', selectedBugo.id);
                                                if (error) {
                                                    alert('화환 설정을 업데이트하지 못했습니다: ' + error.message);
                                                    return;
                                                }
                                                setSelectedBugo({ ...selectedBugo, hide_flower_order: newVal });
                                                setBugoList(bugoList.map(b => b.id === selectedBugo.id ? { ...b, hide_flower_order: newVal } : b));
                                            }}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                background: selectedBugo.hide_flower_order ? '#fee2e2' : '#dcfce7',
                                                color: selectedBugo.hide_flower_order ? '#dc2626' : '#16a34a',
                                            }}
                                        >
                                            {selectedBugo.hide_flower_order ? '🚫 비활성' : '✅ 활성'}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.detailActions}>
                                    <Link
                                        href={`/b2b/view/${selectedBugo.bugo_number}`}
                                        target="_blank"
                                        className={`${styles.btnAction} ${styles.primary}`}
                                    >
                                        <IconEye size={16} />
                                        <span>부고장 보기</span>
                                    </Link>
                                    <Link
                                        href={`/create/${selectedBugo.template_id}?edit=${selectedBugo.bugo_number}`}
                                        className={styles.btnAction}
                                    >
                                        <IconEdit size={16} />
                                        <span>수정하기</span>
                                    </Link>
                                    {selectedBugo.deleted_at ? (
                                        <button
                                            onClick={() => restoreBugo(selectedBugo.id)}
                                            className={`${styles.btnAction} ${styles.success}`}
                                        >
                                            <IconRestore size={16} />
                                            <span>복구하기</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => deleteBugo(selectedBugo.id)}
                                            className={`${styles.btnAction} ${styles.danger}`}
                                        >
                                            <IconTrash size={16} />
                                            <span>삭제하기</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.panelEmpty}>
                            <IconPointer size={36} className={styles.panelEmptyIcon} />
                            <p>부고 내역을 선택하시면<br />상세 정보와 관리 메뉴가 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 부가 헬퍼 함수
function formatShortDate(dateStr: string) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
}
