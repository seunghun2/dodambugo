'use client';

import { useState, useEffect } from 'react';
import { 
    IconRefresh, 
    IconTrash, 
    IconChevronRight, 
    IconLoader2, 
    IconX, 
    IconFileDescription,
    IconDownload
} from '@tabler/icons-react';
import styles from './drafts.module.css';

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
    company_name: string;
    owner_name: string;
    phone: string;
}

export default function B2BAdminDraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/b2b/admin/drafts');
            const result = await response.json();
            if (result.data) {
                setDrafts(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch B2B drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteDraft = async (id: string) => {
        if (!confirm('이 B2B 임시저장을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/b2b/admin/drafts/${id}`, {
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

    const handleDownloadExcel = () => {
        if (drafts.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = [
            '마지막 수정',
            '파트너사',
            '대표자',
            '템플릿',
            '고인명',
            '성별/연세',
            '장례식장',
            '신청자',
            '연락처',
            'IP 주소'
        ];

        const rows = drafts.map(d => [
            formatDate(d.updated_at),
            d.company_name,
            d.owner_name,
            getTemplateLabel(d.template),
            d.deceased_name || '-',
            `${d.gender || '-'}/${d.age ? d.age + '세' : '-'}`,
            d.funeral_home || '-',
            d.applicant_name || '-',
            d.applicant_phone || '-',
            d.ip_address || '-'
        ]);

        const csvContent = 
            '\ufeff' + 
            [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `b2b_draft_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalPages = Math.ceil(drafts.length / itemsPerPage);
    const paginatedDrafts = drafts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <div>
                    <h1 className={styles.title}>B2B 임시저장 관리</h1>
                    <p className={styles.subtitle}>B2B 파트너들이 입력 중인 임시저장 데이터를 관리합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={handleDownloadExcel} className={styles.excelBtn}>
                        <IconDownload size={18} />
                        엑셀 다운로드
                    </button>
                    <button onClick={fetchDrafts} className={styles.refreshBtn}>
                        <IconRefresh size={18} />
                        새로고침
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* 리스트 패널 */}
                <div className={styles.listPanel}>
                    <div className={styles.panelHeader}>
                        <span>전체 임시저장 목록 ({drafts.length})</span>
                    </div>

                    {loading ? (
                        <div className={styles.panelLoading}>
                            <IconLoader2 size={40} className={styles.spinning} />
                            <p>불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>파트너사</th>
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
                                        {paginatedDrafts.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className={styles.emptyCell}>
                                                    임시저장 데이터가 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedDrafts.map((draft) => (
                                                <tr
                                                    key={draft.id}
                                                    className={selectedDraft?.id === draft.id ? styles.selected : ''}
                                                    onClick={() => setSelectedDraft(draft)}
                                                >
                                                    <td className={styles.nameCell}>
                                                        {draft.company_name} ({draft.owner_name})
                                                    </td>
                                                    <td>{getTemplateLabel(draft.template)}</td>
                                                    <td>{draft.deceased_name || '-'}</td>
                                                    <td>{draft.funeral_home || '-'}</td>
                                                    <td>{draft.applicant_name || '-'}</td>
                                                    <td>{draft.applicant_phone || '-'}</td>
                                                    <td className={styles.dateCell}>{formatDate(draft.updated_at)}</td>
                                                    <td className={styles.arrowCell}>
                                                        <IconChevronRight size={18} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                        disabled={currentPage === 1} 
                                        className={styles.pageBtn}
                                    >
                                        ←
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
                                        →
                                    </button>
                                    <span className={styles.pageInfo}>총 {drafts.length}개</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 상세 패널 */}
                <div className={styles.detailPanel}>
                    {selectedDraft ? (
                        <>
                            <div className={styles.panelHeader}>
                                <span>임시저장 상세</span>
                                <button onClick={() => setSelectedDraft(null)} className={styles.closeBtn}>
                                    <IconX size={18} />
                                </button>
                            </div>
                            <div className={styles.detailContent}>
                                <div className={styles.detailSection}>
                                    <span className={styles.sectionLabel}>파트너 정보</span>
                                    <div className={styles.detailRow}>
                                        <label>파트너사</label>
                                        <span>{selectedDraft.company_name} ({selectedDraft.owner_name})</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>파트너 연락처</label>
                                        <a href={`tel:${selectedDraft.phone}`}>{selectedDraft.phone}</a>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <span className={styles.sectionLabel}>부고 정보</span>
                                    <div className={styles.detailRow}>
                                        <label>템플릿</label>
                                        <span>{getTemplateLabel(selectedDraft.template)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>고인명</label>
                                        <span>{selectedDraft.deceased_name || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>성별 / 연세</label>
                                        <span>{selectedDraft.gender || '-'} / {selectedDraft.age || '-'}세</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>장례형식</label>
                                        <span>{selectedDraft.funeral_type || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>장례식장</label>
                                        <span>{selectedDraft.funeral_home || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>발인일시</label>
                                        <span>{selectedDraft.funeral_date || '-'} {selectedDraft.funeral_time || ''}</span>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <span className={styles.sectionLabel}>신청인 정보</span>
                                    <div className={styles.detailRow}>
                                        <label>상주</label>
                                        <span>{selectedDraft.relationship || '-'} {selectedDraft.mourner_name || ''}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>신청자</label>
                                        <span>{selectedDraft.applicant_name || '-'} ({selectedDraft.applicant_phone || '-'})</span>
                                    </div>
                                </div>

                                {selectedDraft.message && (
                                    <div className={styles.detailSection}>
                                        <span className={styles.sectionLabel}>안내사항</span>
                                        <div className={styles.messageBox}>{selectedDraft.message}</div>
                                    </div>
                                )}

                                {selectedDraft.ip_address && (
                                    <div className={styles.detailSection}>
                                        <div className={styles.detailRow}>
                                            <label>IP 주소</label>
                                            <span className={styles.monoCell}>
                                                {selectedDraft.ip_address}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <label>최초 저장</label>
                                        <span>{formatDate(selectedDraft.created_at)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>마지막 수정</label>
                                        <span>{formatDate(selectedDraft.updated_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailActions}>
                                <button
                                    onClick={() => deleteDraft(selectedDraft.id)}
                                    className={`${styles.btnAction} ${styles.danger}`}
                                >
                                    <IconTrash size={18} />
                                    삭제하기
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.panelEmpty}>
                            <IconFileDescription size={48} />
                            <p>임시저장을 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
