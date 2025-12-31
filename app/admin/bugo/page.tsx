'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Bugo {
    id: number;
    bugo_number: string;
    applicant_name: string;
    phone_password: string;
    deceased_name: string;
    funeral_home: string;
    room_number: string;
    funeral_date: string;
    funeral_time: string;
    status: string;
    created_at: string;
    deleted_at: string | null;
    template_id: string;
    view_count: number;
    flower_count: number;
    mourners: any[];
    account_info: any[];
    message: string;
    address: string;
}

export default function AdminBugoPage() {
    const [bugos, setBugos] = useState<Bugo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBugo, setSelectedBugo] = useState<Bugo | null>(null);

    // 필터 상태
    const [filters, setFilters] = useState({
        funeral_home: '',
        deceased_name: '',
        applicant_name: '',
        created_at: '',
    });

    useEffect(() => {
        fetchBugos();
    }, []);

    const fetchBugos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bugo')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bugos:', error);
        } else {
            setBugos(data || []);
        }
        setLoading(false);
    };

    const filteredBugos = bugos.filter(bugo => {
        if (filters.funeral_home && !bugo.funeral_home?.includes(filters.funeral_home)) return false;
        if (filters.deceased_name && !bugo.deceased_name?.includes(filters.deceased_name)) return false;
        if (filters.applicant_name && !bugo.applicant_name?.includes(filters.applicant_name)) return false;
        return true;
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\. /g, '-').replace('.', '');
    };

    const formatShortDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getSalesRate = (views: number, flowers: number) => {
        if (!views || views === 0) return '0%';
        return Math.round((flowers / views) * 100) + '%';
    };

    return (
        <div className="admin-pc">
            {/* 사이드바 */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <Link href="/">도담부고</Link>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/admin/bugo" className="nav-item active">
                        <span className="material-symbols-outlined">description</span>
                        <span>부고장 관리</span>
                    </Link>
                    <Link href="/admin/facilities" className="nav-item">
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
                    <h1>부고장 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {filteredBugos.length}건</span>
                        <button onClick={fetchBugos} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 부고장 목록 테이블 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>전체 부고장 ({filteredBugos.length})</span>
                        </div>

                        {loading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : (
                            <div className="inquiry-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>장례식장</th>
                                            <th>고인명</th>
                                            <th>작성자</th>
                                            <th>화환</th>
                                            <th>방문</th>
                                            <th>판매율</th>
                                            <th>제작일시</th>
                                            <th></th>
                                        </tr>
                                        <tr className="filter-row">
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="검색"
                                                    value={filters.funeral_home}
                                                    onChange={(e) => setFilters({ ...filters, funeral_home: e.target.value })}
                                                />
                                            </th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="검색"
                                                    value={filters.deceased_name}
                                                    onChange={(e) => setFilters({ ...filters, deceased_name: e.target.value })}
                                                />
                                            </th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="검색"
                                                    value={filters.applicant_name}
                                                    onChange={(e) => setFilters({ ...filters, applicant_name: e.target.value })}
                                                />
                                            </th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBugos.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    부고장이 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBugos.map((bugo) => (
                                                <tr
                                                    key={bugo.id}
                                                    className={selectedBugo?.id === bugo.id ? 'selected' : ''}
                                                    onClick={() => setSelectedBugo(bugo)}
                                                >
                                                    <td className="name-cell">{bugo.funeral_home}</td>
                                                    <td>{bugo.deceased_name}</td>
                                                    <td className="company-cell">{bugo.applicant_name}</td>
                                                    <td className="number-cell">{bugo.flower_count || 0}</td>
                                                    <td className="number-cell">{bugo.view_count || 0}</td>
                                                    <td className="number-cell">{getSalesRate(bugo.view_count || 0, bugo.flower_count || 0)}</td>
                                                    <td className="date-cell">{formatDate(bugo.created_at)}</td>
                                                    <td className="arrow-cell">
                                                        <span className="material-symbols-outlined">chevron_right</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 부고장 상세 패널 */}
                    <div className="detail-panel">
                        {selectedBugo ? (
                            <>
                                <div className="panel-header">
                                    <span>부고장 상세</span>
                                    <button onClick={() => setSelectedBugo(null)} className="btn-close">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="detail-content">
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>부고번호</label>
                                            <span className="bugo-num">#{selectedBugo.bugo_number}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>고인명</label>
                                            <span>{selectedBugo.deceased_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>신청자</label>
                                            <span>{selectedBugo.applicant_name} (#{selectedBugo.phone_password})</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>장례식장</label>
                                            <span>{selectedBugo.funeral_home} {selectedBugo.room_number}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>주소</label>
                                            <span>{selectedBugo.address || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>발인일시</label>
                                            <span>{selectedBugo.funeral_date} {selectedBugo.funeral_time || ''}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>제작일시</label>
                                            <span>{formatDate(selectedBugo.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>방문자 수</label>
                                            <span>{selectedBugo.view_count || 0}명</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>화환 판매</label>
                                            <span>{selectedBugo.flower_count || 0}건</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>판매율</label>
                                            <span>{getSalesRate(selectedBugo.view_count || 0, selectedBugo.flower_count || 0)}</span>
                                        </div>
                                    </div>

                                    {selectedBugo.mourners && selectedBugo.mourners.length > 0 && (
                                        <div className="detail-section">
                                            <label>상주 정보</label>
                                            <div className="message-box">
                                                {selectedBugo.mourners.map((m: any, i: number) => (
                                                    <div key={i}>{m.relationship} {m.name} ({m.contact})</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedBugo.message && (
                                        <div className="detail-section">
                                            <label>안내사항</label>
                                            <div className="message-box">{selectedBugo.message}</div>
                                        </div>
                                    )}

                                    <div className="detail-actions">
                                        <Link
                                            href={`/view/${selectedBugo.bugo_number}`}
                                            target="_blank"
                                            className="btn-action primary"
                                        >
                                            <span className="material-symbols-outlined">visibility</span>
                                            부고장 보기
                                        </Link>
                                        <Link
                                            href={`/create/${selectedBugo.template_id}?edit=${selectedBugo.bugo_number}`}
                                            className="btn-action"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                            수정하기
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">touch_app</span>
                                <p>부고장을 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
