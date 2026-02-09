'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Draft {
    id: string;
    template: string;
    deceased_name: string | null;
    gender: string | null;
    age: number | null;
    funeral_home: string | null;
    funeral_date: string | null;
    funeral_time: string | null;
    funeral_type: string | null;
    mourner_name: string | null;
    relationship: string | null;
    applicant_name: string | null;
    applicant_phone: string | null;
    message: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

export default function AdminDraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
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

    const deleteDraft = async (id: string) => {
        if (!confirm('이 임시저장을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/drafts/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('삭제되었습니다.');
                setSelectedDraft(null);
                fetchDrafts();
            } else {
                const result = await response.json();
                alert('삭제 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error(error);
            alert('삭제 중 네트워크 오류가 발생했습니다.');
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
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedDrafts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="empty-cell">
                                                        {selectedIp ? 'IP를 선택하세요' : '임시저장 데이터가 없습니다'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedDrafts.map((draft) => (
                                                    <tr
                                                        key={draft.id}
                                                        className={selectedDraft?.id === draft.id ? 'selected' : ''}
                                                        onClick={() => setSelectedDraft(draft)}
                                                    >
                                                        <td>{getTemplateLabel(draft.template)}</td>
                                                        <td className="name-cell">{draft.deceased_name || '-'}</td>
                                                        <td>{draft.funeral_home || '-'}</td>
                                                        <td>{draft.applicant_name || '-'}</td>
                                                        <td>{draft.applicant_phone || '-'}</td>
                                                        <td className="date-cell">{formatDate(draft.updated_at)}</td>
                                                        <td className="arrow-cell">
                                                            <span className="material-symbols-outlined">chevron_right</span>
                                                        </td>
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
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {drafts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="empty-cell">
                                                        임시저장 데이터가 없습니다
                                                    </td>
                                                </tr>
                                            ) : (
                                                drafts.map((draft) => (
                                                    <tr
                                                        key={draft.id}
                                                        className={selectedDraft?.id === draft.id ? 'selected' : ''}
                                                        onClick={() => setSelectedDraft(draft)}
                                                    >
                                                        <td style={{ fontFamily: 'monospace', color: '#0066cc' }}>
                                                            {draft.ip_address || '-'}
                                                        </td>
                                                        <td>{getTemplateLabel(draft.template)}</td>
                                                        <td className="name-cell">{draft.deceased_name || '-'}</td>
                                                        <td>{draft.funeral_home || '-'}</td>
                                                        <td>{draft.applicant_name || '-'}</td>
                                                        <td>{draft.applicant_phone || '-'}</td>
                                                        <td className="date-cell">{formatDate(draft.updated_at)}</td>
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
                    )}

                    {/* 상세 패널 */}
                    <div className="detail-panel">
                        {selectedDraft ? (
                            <>
                                <div className="panel-header">
                                    <span>임시저장 상세</span>
                                    <button onClick={() => setSelectedDraft(null)} className="btn-close">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="detail-content">
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>템플릿</label>
                                            <span>{getTemplateLabel(selectedDraft.template)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>고인명</label>
                                            <span>{selectedDraft.deceased_name || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>성별 / 연세</label>
                                            <span>{selectedDraft.gender || '-'} / {selectedDraft.age || '-'}세</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>장례형식</label>
                                            <span>{selectedDraft.funeral_type || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>장례식장</label>
                                            <span>{selectedDraft.funeral_home || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>발인일시</label>
                                            <span>{selectedDraft.funeral_date || '-'} {selectedDraft.funeral_time || ''}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>상주</label>
                                            <span>{selectedDraft.relationship || '-'} {selectedDraft.mourner_name || ''}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>신청자</label>
                                            <span>{selectedDraft.applicant_name || '-'} ({selectedDraft.applicant_phone || '-'})</span>
                                        </div>
                                    </div>

                                    {selectedDraft.message && (
                                        <div className="detail-section">
                                            <label>안내사항</label>
                                            <div className="message-box">{selectedDraft.message}</div>
                                        </div>
                                    )}

                                    {selectedDraft.ip_address && (
                                        <div className="detail-section">
                                            <div className="detail-row">
                                                <label>IP 주소</label>
                                                <span style={{ fontFamily: 'monospace', color: '#0066cc' }}>
                                                    {selectedDraft.ip_address}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>최초 저장</label>
                                            <span>{formatDate(selectedDraft.created_at)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>마지막 수정</label>
                                            <span>{formatDate(selectedDraft.updated_at)}</span>
                                        </div>
                                    </div>

                                    <div className="detail-actions">
                                        <Link
                                            href={`/create/${selectedDraft.template}?draft=${selectedDraft.id}`}
                                            className="btn-action primary"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                            수정하기
                                        </Link>
                                        <button
                                            onClick={() => deleteDraft(selectedDraft.id)}
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
                                <p>임시저장을 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
