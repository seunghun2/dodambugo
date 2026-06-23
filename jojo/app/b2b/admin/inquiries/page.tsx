'use client';

import { useState, useEffect } from 'react';
import { 
    IconRefresh, 
    IconChevronRight, 
    IconLoader2, 
    IconX, 
    IconInbox, 
    IconDownload,
    IconMail,
    IconPhone
} from '@tabler/icons-react';
import styles from './inquiries.module.css';

interface Inquiry {
    id: string;
    name: string;
    phone: string;
    company: string | null;
    email: string;
    inquiry_type: string;
    message: string;
    memo: string | null;
    created_at: string;
}

export default function B2BAdminInquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [memo, setMemo] = useState('');
    const [savingMemo, setSavingMemo] = useState(false);
    const [memoSaved, setMemoSaved] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        if (selectedInquiry) {
            setMemo(selectedInquiry.memo || '');
        }
    }, [selectedInquiry]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/b2b/admin/inquiries');
            const result = await response.json();
            if (result.data) {
                setInquiries(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch B2B inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveMemo = async () => {
        if (!selectedInquiry) return;
        setSavingMemo(true);
        setMemoSaved(false);
        try {
            const response = await fetch('/api/b2b/admin/inquiries', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedInquiry.id, memo }),
            });

            if (response.ok) {
                // 로컬 상태 업데이트
                setInquiries(prev => prev.map(inq =>
                    inq.id === selectedInquiry.id ? { ...inq, memo } : inq
                ));
                setSelectedInquiry({ ...selectedInquiry, memo });
                setMemoSaved(true);
                setTimeout(() => setMemoSaved(false), 2000);
            } else {
                const result = await response.json();
                alert('메모 저장 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('Error saving memo:', error);
            alert('메모 저장 중 네트워크 오류가 발생했습니다.');
        } finally {
            setSavingMemo(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case '제휴 문의': return '#3b82f6';
            case '서비스 문의': return '#22c55e';
            case '기술 지원': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const handleDownloadExcel = () => {
        if (inquiries.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = [
            '접수일시',
            '유형',
            '파트너명(이름)',
            '회사명',
            '연락처',
            '이메일',
            '문의 내용',
            '관리자 메모'
        ];

        const rows = inquiries.map(inq => [
            formatDate(inq.created_at),
            inq.inquiry_type,
            inq.name,
            inq.company || '-',
            inq.phone,
            inq.email || '-',
            inq.message,
            inq.memo || '-'
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
        link.setAttribute('download', `b2b_inquiry_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <div>
                    <h1 className={styles.title}>B2B 1:1 문의 관리</h1>
                    <p className={styles.subtitle}>B2B 파트너들의 1:1 문의 내역을 모니터링하고 처리 현황을 관리합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={handleDownloadExcel} className={styles.excelBtn}>
                        <IconDownload size={18} />
                        엑셀 다운로드
                    </button>
                    <button onClick={fetchInquiries} className={styles.refreshBtn}>
                        <IconRefresh size={18} />
                        새로고침
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* 문의 목록 */}
                <div className={styles.listPanel}>
                    <div className={styles.panelHeader}>
                        <span>전체 문의 ({inquiries.length})</span>
                    </div>

                    {loading ? (
                        <div className={styles.panelLoading}>
                            <IconLoader2 size={40} className={styles.spinning} />
                            <p>불러오는 중...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className={styles.panelEmpty}>
                            <IconInbox size={48} />
                            <p>접수된 문의가 없습니다</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>유형</th>
                                        <th>파트너명</th>
                                        <th>회사</th>
                                        <th>연락처</th>
                                        <th>접수일</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiries.map((inquiry) => (
                                        <tr
                                            key={inquiry.id}
                                            className={selectedInquiry?.id === inquiry.id ? styles.selected : ''}
                                            onClick={() => setSelectedInquiry(inquiry)}
                                        >
                                            <td>
                                                <span
                                                    className={styles.typeBadge}
                                                    style={{ background: getTypeColor(inquiry.inquiry_type) }}
                                                >
                                                    {inquiry.inquiry_type}
                                                </span>
                                            </td>
                                            <td className={styles.nameCell}>{inquiry.name}</td>
                                            <td className={styles.companyCell}>{inquiry.company || '-'}</td>
                                            <td className={styles.phoneCell}>{inquiry.phone}</td>
                                            <td className={styles.dateCell}>{formatShortDate(inquiry.created_at)}</td>
                                            <td className={styles.arrowCell}>
                                                <IconChevronRight size={18} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 문의 상세 */}
                <div className={styles.detailPanel}>
                    {selectedInquiry ? (
                        <>
                            <div className={styles.panelHeader}>
                                <span>문의 상세</span>
                                <button onClick={() => setSelectedInquiry(null)} className={styles.closeBtn}>
                                    <IconX size={18} />
                                </button>
                            </div>
                            <div className={styles.detailContent}>
                                <div className={styles.detailSection}>
                                    <span className={styles.sectionLabel}>기본 정보</span>
                                    <div className={styles.detailRow}>
                                        <label>문의 유형</label>
                                        <span
                                            className={styles.typeBadge}
                                            style={{ background: getTypeColor(selectedInquiry.inquiry_type) }}
                                        >
                                            {selectedInquiry.inquiry_type}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>파트너명</label>
                                        <span>{selectedInquiry.name}</span>
                                    </div>
                                    {selectedInquiry.company && (
                                        <div className={styles.detailRow}>
                                            <label>회사</label>
                                            <span>{selectedInquiry.company}</span>
                                        </div>
                                    )}
                                    <div className={styles.detailRow}>
                                        <label>연락처</label>
                                        <a href={`tel:${selectedInquiry.phone}`}>{selectedInquiry.phone}</a>
                                    </div>
                                    {selectedInquiry.email && (
                                        <div className={styles.detailRow}>
                                            <label>이메일</label>
                                            <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email}</a>
                                        </div>
                                    )}
                                    <div className={styles.detailRow}>
                                        <label>접수일시</label>
                                        <span>{formatDate(selectedInquiry.created_at)}</span>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <span className={styles.sectionLabel}>문의 내용</span>
                                    <div className={styles.messageBox}>
                                        {selectedInquiry.message}
                                    </div>
                                </div>

                                {/* 메모 섹션 */}
                                <div className={styles.detailSection}>
                                    <span className={styles.sectionLabel}>관리자 메모</span>
                                    <div className={styles.memoSection}>
                                        <textarea
                                            className={styles.memoTextarea}
                                            placeholder="통화 내용, 처리 상태 등을 메모하세요..."
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            rows={4}
                                        />
                                        <button
                                            className={`${styles.btnSaveMemo} ${memoSaved ? styles.saved : ''}`}
                                            onClick={saveMemo}
                                            disabled={savingMemo}
                                        >
                                            {savingMemo ? '저장 중...' : memoSaved ? '✓ 저장됨' : '메모 저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailActions}>
                                {selectedInquiry.email && (
                                    <a
                                        href={`mailto:${selectedInquiry.email}?subject=Re: [부고온 B2B] ${selectedInquiry.inquiry_type} 답변`}
                                        className={`${styles.btnAction} ${styles.primary}`}
                                    >
                                        <IconMail size={18} />
                                        이메일 답변
                                    </a>
                                )}
                                <a href={`tel:${selectedInquiry.phone}`} className={styles.btnAction}>
                                    <IconPhone size={18} />
                                    전화하기
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className={styles.panelEmpty}>
                            <IconInbox size={48} />
                            <p>문의를 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
