'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Draft {
    id: string;
    template: string;
    deceased_name: string | null;
    gender: string | null;
    age: number | null;
    funeral_home: string | null;
    applicant_name: string | null;
    applicant_phone: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

export default function AdminDraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupByIp, setGroupByIp] = useState(false);
    const [selectedIp, setSelectedIp] = useState<string | null>(null);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/drafts');
            const result = await response.json();
            if (result.data) {
                setDrafts(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    // IP별 그룹핑
    const groupedDrafts = drafts.reduce((acc, draft) => {
        const ip = draft.ip_address || '알 수 없음';
        if (!acc[ip]) acc[ip] = [];
        acc[ip].push(draft);
        return acc;
    }, {} as Record<string, Draft[]>);

    // IP별 통계
    const ipStats = Object.entries(groupedDrafts)
        .map(([ip, items]) => ({
            ip,
            count: items.length,
            lastUpdate: items[0]?.updated_at,
        }))
        .sort((a, b) => b.count - a.count);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTemplateLabel = (template: string) => {
        const labels: Record<string, string> = {
            basic: '기본형',
            ribbon: '정중형',
            border: '안내형',
            flower: '국화',
        };
        return labels[template] || template || '-';
    };

    // 선택된 IP의 상세 목록
    const selectedDrafts = selectedIp ? groupedDrafts[selectedIp] || [] : drafts;

    return (
        <div className="admin-pc">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>임시저장 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {drafts.length}건 / IP {ipStats.length}개</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={groupByIp}
                                onChange={(e) => {
                                    setGroupByIp(e.target.checked);
                                    setSelectedIp(null);
                                }}
                                style={{ width: '16px', height: '16px' }}
                            />
                            IP별 보기
                        </label>
                        <button onClick={fetchDrafts} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {groupByIp ? (
                        <>
                            {/* IP 그룹 패널 */}
                            <div className="inquiry-panel" style={{ flex: 1, maxWidth: '360px' }}>
                                <div className="panel-header">
                                    <span>IP 주소 ({ipStats.length})</span>
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
                                                    <th>IP 주소</th>
                                                    <th>저장 수</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ipStats.map(({ ip, count }) => (
                                                    <tr
                                                        key={ip}
                                                        className={selectedIp === ip ? 'selected' : ''}
                                                        onClick={() => setSelectedIp(ip)}
                                                    >
                                                        <td style={{ fontFamily: 'monospace', color: '#0066cc' }}>{ip}</td>
                                                        <td className="number-cell">{count}건</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* 선택된 IP의 상세 리스트 */}
                            <div className="inquiry-panel wide">
                                <div className="panel-header">
                                    <span>
                                        {selectedIp ? `${selectedIp} (${selectedDrafts.length}건)` : '전체 목록'}
                                    </span>
                                    {selectedIp && (
                                        <button className="btn-close" onClick={() => setSelectedIp(null)}>
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    )}
                                </div>

                                <div className="inquiry-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>템플릿</th>
                                                <th>고인명</th>
                                                <th>장례식장</th>
                                                <th>신청자</th>
                                                <th>연락처</th>
                                                <th>마지막 수정</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedDrafts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="empty-cell">
                                                        {selectedIp ? 'IP를 선택하세요' : '임시저장 데이터가 없습니다'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedDrafts.map((draft) => (
                                                    <tr key={draft.id}>
                                                        <td>{getTemplateLabel(draft.template)}</td>
                                                        <td className="name-cell">{draft.deceased_name || '-'}</td>
                                                        <td>{draft.funeral_home || '-'}</td>
                                                        <td>{draft.applicant_name || '-'}</td>
                                                        <td>{draft.applicant_phone || '-'}</td>
                                                        <td className="date-cell">{formatDate(draft.updated_at)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* 일반 리스트 뷰 */
                        <div className="inquiry-panel wide">
                            <div className="panel-header">
                                <span>전체 임시저장 ({drafts.length})</span>
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
                                                <th>IP 주소</th>
                                                <th>템플릿</th>
                                                <th>고인명</th>
                                                <th>장례식장</th>
                                                <th>신청자</th>
                                                <th>연락처</th>
                                                <th>마지막 수정</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {drafts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="empty-cell">
                                                        임시저장 데이터가 없습니다
                                                    </td>
                                                </tr>
                                            ) : (
                                                drafts.map((draft) => (
                                                    <tr key={draft.id}>
                                                        <td style={{ fontFamily: 'monospace', color: '#0066cc' }}>
                                                            {draft.ip_address || '-'}
                                                        </td>
                                                        <td>{getTemplateLabel(draft.template)}</td>
                                                        <td className="name-cell">{draft.deceased_name || '-'}</td>
                                                        <td>{draft.funeral_home || '-'}</td>
                                                        <td>{draft.applicant_name || '-'}</td>
                                                        <td>{draft.applicant_phone || '-'}</td>
                                                        <td className="date-cell">{formatDate(draft.updated_at)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
