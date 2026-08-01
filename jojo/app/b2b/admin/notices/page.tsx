'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    IconClipboardList, 
    IconRefresh, 
    IconPlus, 
    IconX, 
    IconTrash, 
    IconDownload, 
    IconLoader2,
    IconBold,
    IconMinus,
    IconPhoto
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import styles from './notices.module.css';

interface B2BNotice {
    id: string;
    title: string;
    content: string;
    is_fixed: boolean;
    created_at: string;
    updated_at: string;
    published_at: string;
}

// datetime-local input 용 타임존 오프셋 반영 변환 헬퍼
const formatForDatetimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
};

export default function B2BAdminNoticesPage() {
    const [notices, setNotices] = useState<B2BNotice[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 우측 Panel 관련 상태
    const [selectedNotice, setSelectedNotice] = useState<B2BNotice | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // 입력 폼 상태
    const [title, setTitle] = useState('');
    const [isFixed, setIsFixed] = useState(false);
    const [publishedAt, setPublishedAt] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

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
        setIsFixed(notice.is_fixed);
        setPublishedAt(formatForDatetimeLocal(notice.published_at));
        
        // 에디터 내용 세팅
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.innerHTML = notice.content || '';
            }
        }, 50);
    };

    // 등록 모드로 전환
    const handleStartCreate = () => {
        setSelectedNotice(null);
        setIsCreating(true);
        setTitle('');
        setIsFixed(false);
        setPublishedAt('');
        
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
        }, 50);
    };

    // 패널 닫기
    const handleClosePanel = () => {
        setSelectedNotice(null);
        setIsCreating(false);
        setTitle('');
        setIsFixed(false);
        setPublishedAt('');
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
    };

    // 에디터 리치 텍스트 명령 (Bold, Divider 등)
    const handleEditorCommand = (command: string, value: string = '') => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, value);
        }
    };

    // 툴바 이미지 업로드 및 에디터 본문 삽입
    const handleTriggerImageFile = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            alert('파일 크기는 최대 15MB까지 가능합니다.');
            return;
        }

        setUploadingImage(true);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const filePath = `notices/${fileName}`;

            const { error } = await supabase.storage
                .from('bugo-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('bugo-photos')
                .getPublicUrl(filePath);

            // WYSIWYG 에디터에 이미지 태그 바로 삽입
            if (editorRef.current) {
                editorRef.current.focus();
                const imgHtml = `<img src="${urlData.publicUrl}" alt="공지 이미지" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block;" />`;
                document.execCommand('insertHTML', false, imgHtml);
            }
        } catch (err) {
            console.error('Image upload error:', err);
            alert('이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 등록 및 수정 저장
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const content = editorRef.current ? editorRef.current.innerHTML : '';
        if (!title.trim()) {
            alert('공지 제목을 입력해 주세요.');
            return;
        }
        
        // 공지 내용이 비어있거나 무의미한 빈 태그만 있는 경우 체크
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        if (!cleanContent && !content.includes('<img')) {
            alert('공지 내용을 입력해 주세요.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: title.trim(),
                content: content, // HTML 리치 콘텐츠 저장
                is_fixed: isFixed,
                published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString()
            };

            if (isCreating) {
                // 신규 등록
                const res = await fetch('/api/b2b/admin/notices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
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
                    body: JSON.stringify({ id: selectedNotice.id, ...payload }),
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

        const headers = ['구분', '게시일시(예약포함)', '공지제목', '공지내용(HTML)'];
        const rows = notices.map(item => [
            item.is_fixed ? '상단고정' : (new Date(item.published_at).getTime() > Date.now() ? '예약공지' : '일반공지'),
            formatDate(item.published_at),
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
                                        <th style={{ width: '220px' }}>게시(예약)일시</th>
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
                                        notices.map((notice) => {
                                            const isScheduled = new Date(notice.published_at).getTime() > Date.now();
                                            return (
                                                <tr
                                                    key={notice.id}
                                                    className={selectedNotice?.id === notice.id ? styles.selectedRow : ''}
                                                    onClick={() => handleSelectNotice(notice)}
                                                >
                                                    <td>
                                                        {notice.is_fixed ? (
                                                            <span className={styles.fixedBadge}>중요</span>
                                                        ) : isScheduled ? (
                                                            <span className={styles.scheduledBadge}>예약</span>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>일반</span>
                                                        )}
                                                    </td>
                                                    <td style={{ fontWeight: notice.is_fixed ? 700 : 500 }}>
                                                        {notice.title}
                                                        {isScheduled && (
                                                            <div className={styles.dateReservation}>
                                                                * {formatDate(notice.published_at)} 게시 예정
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={styles.dateCell}>
                                                        {formatDate(notice.published_at)}
                                                    </td>
                                                </tr>
                                            );
                                        })
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
                                    <label className={styles.label}>예약 게시 일시</label>
                                    <input
                                        type="datetime-local"
                                        value={publishedAt}
                                        onChange={(e) => setPublishedAt(e.target.value)}
                                        className={styles.input}
                                    />
                                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                        * 지정하지 않으면 즉시 게시됩니다. 미래 일시로 지정 시 예약 게시됩니다.
                                    </span>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>공지 내용 (리치 텍스트 에디터)</label>
                                    
                                    {/* 에디터 위지윅 툴바 */}
                                    <div className={styles.editorToolbar}>
                                        <button
                                            type="button"
                                            className={styles.toolbarBtn}
                                            onClick={() => handleEditorCommand('bold')}
                                            title="굵게"
                                        >
                                            <IconBold size={14} /> 굵게
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.toolbarBtn}
                                            onClick={() => handleEditorCommand('insertHorizontalRule')}
                                            title="구분선"
                                        >
                                            <IconMinus size={14} /> 구분선
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.toolbarBtn}
                                            onClick={handleTriggerImageFile}
                                            disabled={uploadingImage}
                                            title="이미지 추가"
                                        >
                                            {uploadingImage ? (
                                                <IconLoader2 size={14} className={styles.spinning} />
                                            ) : (
                                                <IconPhoto size={14} />
                                            )}
                                            이미지 추가
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {/* contentEditable 위지윅 영역 */}
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        className={`${styles.textarea} ${styles.textareaWithToolbar}`}
                                        style={{
                                            minHeight: '220px',
                                            outline: 'none',
                                            overflowY: 'auto',
                                            border: '1px solid #cbd5e1',
                                            padding: '12px',
                                            backgroundColor: '#ffffff',
                                            color: '#0f172a',
                                            fontSize: '15px',
                                            lineHeight: '1.6',
                                            cursor: 'text'
                                        }}
                                        data-placeholder="공지내용을 작성해 주세요. 굵게, 구분선, 이미지 삽입을 편리하게 편집할 수 있습니다."
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
