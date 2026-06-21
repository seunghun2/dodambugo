'use client';

import { useState, useEffect } from 'react';
import { 
    IconClipboardList, 
    IconRefresh, 
    IconPlus, 
    IconX, 
    IconTrash, 
    IconDownload, 
    IconLoader2
} from '@tabler/icons-react';
import styles from './notices.module.css';

interface B2BNotice {
    id: string;
    title: string;
    content: string;
    is_fixed: boolean;
    created_at: string;
    updated_at: string;
}

export default function B2BAdminNoticesPage() {
    const [notices, setNotices] = useState<B2BNotice[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 우측 Panel 관련 상태
    const [selectedNotice, setSelectedNotice] = useState<B2BNotice | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // 입력 폼 상태
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isFixed, setIsFixed] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/admin/notices');
            const data = await res.json();
            if (data.success) {
                setNotices(data.notices || []);
            }
        } catch (err) {
            console.error('공지사항 로드 오류:', err);
        }
        setLoading(false);
    };

    // 공지 선택 시 폼 세팅
    const handleSelectNotice = (notice: B2BNotice) => {
        setIsCreating(false);
        setSelectedNotice(notice);
        setTitle(notice.title);
        setContent(notice.content);
        setIsFixed(notice.is_fixed);
    };

    // 등록 모드로 전환
    const handleStartCreate = () => {
        setSelectedNotice(null);
        setIsCreating(true);
        setTitle('');
        setContent('');
        setIsFixed(false);
    };

    // 패널 닫기
    const handleClosePanel = () => {
        setSelectedNotice(null);
        setIsCreating(false);
        setTitle('');
        setContent('');
        setIsFixed(false);
    };

    // 등록 및 수정 저장
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해 주세요.');
            return;
        }

        setSaving(true);
        try {
            if (isCreating) {
                // 신규 등록
                const res = await fetch('/api/b2b/admin/notices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, is_fixed: isFixed }),
                });
                const data = await res.json();
                if (data.success) {
                    alert('공지사항이 성공적으로 등록되었습니다.');
                    handleClosePanel();
                    fetchNotices();
                } else {
                    alert(data.error || '등록 중 오류가 발생했습니다.');
                }
            } else if (selectedNotice) {
                // 수정
                const res = await fetch('/api/b2b/admin/notices', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedNotice.id, title, content, is_fixed: isFixed }),
                });
                const data = await res.json();
                if (data.success) {
                    alert('공지사항이 성공적으로 수정되었습니다.');
                    handleClosePanel();
                    fetchNotices();
                } else {
                    alert(data.error || '수정 중 오류가 발생했습니다.');
                }
            }
        } catch (err) {
            console.error('저장 에러:', err);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 삭제
    const handleDelete = async () => {
        if (!selectedNotice) return;
        if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/b2b/admin/notices?id=${selectedNotice.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                alert('삭제되었습니다.');
                handleClosePanel();
                fetchNotices();
            } else {
                alert(data.error || '삭제 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error('삭제 에러:', err);
            alert('네트워크 오류가 발생했습니다.');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).replace(/\. /g, '.').replace('.', '');
    };

    // CSV/Excel 다운로드
    const handleDownloadExcel = () => {
        if (notices.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['구분', '등록일시', '공지제목', '공지내용'];
        const rows = notices.map(item => [
            item.is_fixed ? '상단고정' : '일반공지',
            formatDate(item.created_at),
            item.title,
            item.content
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
        link.setAttribute('download', `b2b_notices_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <div>
                    <h1 className={styles.title}>공지사항 관리</h1>
                    <p className={styles.subtitle}>B2B 파트너 전용 앱에 게시될 공지사항을 관리합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.totalCount}>총 {notices.length}건</span>
                    <button onClick={fetchNotices} className={styles.btnRefresh}>
                        <IconRefresh size={16} />
                        새로고침
                    </button>
                    <button onClick={handleDownloadExcel} className={styles.btnExcel}>
                        <IconDownload size={16} />
                        엑셀 다운로드
                    </button>
                    <button onClick={handleStartCreate} className={styles.btnCreate}>
                        <IconPlus size={16} />
                        공지사항 등록
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* 공지 목록 테이블 */}
                <div className={styles.tableCard}>
                    {loading ? (
                        <div className={styles.emptyPanelState}>
                            <IconLoader2 size={32} className={styles.spinning} style={{ color: '#d4a84b' }} />
                            <span>불러오는 중...</span>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '100px' }}>구분</th>
                                        <th>제목</th>
                                        <th style={{ width: '180px' }}>등록일시</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notices.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                                등록된 공지사항이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        notices.map((notice) => (
                                            <tr
                                                key={notice.id}
                                                className={selectedNotice?.id === notice.id ? styles.selectedRow : ''}
                                                onClick={() => handleSelectNotice(notice)}
                                            >
                                                <td>
                                                    {notice.is_fixed ? (
                                                        <span className={styles.fixedBadge}>중요</span>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>일반</span>
                                                    )}
                                                </td>
                                                <td style={{ fontWeight: notice.is_fixed ? 700 : 500 }}>
                                                    {notice.title}
                                                </td>
                                                <td className={styles.dateCell}>
                                                    {formatDate(notice.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 우측 상세 / 등록 / 수정 패널 */}
                {(selectedNotice || isCreating) && (
                    <div className={styles.panelCard}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelTitle}>
                                {isCreating ? '공지사항 등록' : '공지사항 상세/수정'}
                            </span>
                            <button onClick={handleClosePanel} className={styles.btnClose}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <div className={styles.panelContent}>
                            <form onSubmit={handleSave}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>공지 제목</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="공지사항 제목을 입력하세요"
                                        className={styles.input}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>공지 내용</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="공지사항 상세 내용을 입력하세요"
                                        className={styles.textarea}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <div className={styles.checkboxGroup}>
                                        <input
                                            type="checkbox"
                                            id="isFixed"
                                            checked={isFixed}
                                            onChange={(e) => setIsFixed(e.target.checked)}
                                            style={{ width: '16px', height: '16px', accentColor: '#d4a84b', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="isFixed" className={styles.checkboxLabel}>
                                            목록 상단에 고정하기 (중요 공지)
                                        </label>
                                    </div>
                                </div>

                                <div className={styles.btnGroup}>
                                    {!isCreating && (
                                        <button 
                                            type="button" 
                                            onClick={handleDelete} 
                                            className={styles.btnDelete}
                                        >
                                            <IconTrash size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                        </button>
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={handleClosePanel} 
                                        className={styles.btnCancel}
                                    >
                                        취소
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className={styles.btnSubmit}
                                    >
                                        {saving ? (
                                            <IconLoader2 size={16} className={styles.spinning} />
                                        ) : isCreating ? (
                                            '등록하기'
                                        ) : (
                                            '수정완료'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {!selectedNotice && !isCreating && (
                    <div className={styles.panelCard} style={{ borderStyle: 'dashed', backgroundColor: '#fafafa' }}>
                        <div className={styles.emptyPanelState}>
                            <IconClipboardList size={40} style={{ color: '#cbd5e1' }} />
                            <p>공지사항을 선택하거나<br />새로운 공지를 등록해 주세요.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
