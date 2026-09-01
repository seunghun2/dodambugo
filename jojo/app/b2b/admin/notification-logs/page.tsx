'use client';

import { useState, useEffect } from 'react';
import { IconSearch, IconRefresh, IconDeviceMobile, IconMessage, IconBellRinging, IconMail } from '@tabler/icons-react';
import styles from '../partners/partners.module.css'; // 디자인 톤앤매너 완벽 공유

interface NotificationLog {
    id: string;
    recipient_phone?: string;
    recipient_name?: string;
    type?: string;
    channel?: string;
    title: string;
    content?: string;
    body?: string;
    status: 'success' | 'fail' | 'skipped';
    error_message?: string;
    created_at: string;
}

export default function NotificationLogsPage() {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (typeFilter !== 'all') params.append('type', typeFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const res = await fetch(`/api/b2b/admin/notification-logs?${params.toString()}`);
            if (!res.ok) {
                throw new Error('발송 로그를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
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
        fetchLogs();
    }, [searchQuery, typeFilter, statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    const getTypeIcon = (type?: string) => {
        const val = (type || '').toLowerCase();
        switch (val) {
            case 'alimtalk':
                return <span style={{ color: '#FEE500', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }} title="카카오 알림톡"><IconMessage size={16} /> 알림톡</span>;
            case 'push':
                return <span style={{ color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }} title="앱 푸시"><IconBellRinging size={16} /> 앱푸시</span>;
            case 'lms':
                return <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }} title="LMS 장문문자"><IconMail size={16} /> LMS</span>;
            case 'sms':
                return <span style={{ color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }} title="SMS 단문문자"><IconDeviceMobile size={16} /> SMS</span>;
            default:
                return <span>{type || '-'}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'success') {
            return <span className={`${styles.badge} ${styles.badgeApproved}`}>발송성공</span>;
        }
        if (status === 'skipped') {
            return <span className={styles.badge} style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>미발송(토큰없음)</span>;
        }
        return <span className={`${styles.badge} ${styles.badgeRejected}`}>발송실패</span>;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>알림 발송 로그 조회</h1>
                <p className={styles.subtitle}>고객(상주, 파트너, 조문객)에게 자동 및 수동으로 전송된 모든 알림톡/문자/푸시 발송 이력을 모니터링합니다.</p>
            </div>

            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="수신번호, 수신인명, 발송내용 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select
                        className={styles.selectInput}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">모든 전송타입</option>
                        <option value="alimtalk">카카오 알림톡</option>
                        <option value="push">앱 푸시 알림</option>
                        <option value="lms">LMS 장문 문자</option>
                        <option value="sms">SMS 단문 문자</option>
                    </select>

                    <select
                        className={styles.selectInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">모든 발송상태</option>
                        <option value="success">발송 성공</option>
                        <option value="fail">발송 실패</option>
                        <option value="skipped">미발송 (토큰없음)</option>
                    </select>

                    <button type="submit" className={styles.searchBtn}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconSearch stroke={1.5} size={16} />
                            <span>검색</span>
                        </div>
                    </button>
                </form>

                <button onClick={() => { setSearchTerm(''); setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }} className={styles.excelBtn} style={{ borderColor: '#cbd5e1', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconRefresh stroke={1.5} size={16} />
                        <span>필터 초기화</span>
                    </div>
                </button>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            발송 로그를 불러오는 중...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className={styles.emptyState}>조회할 발송 로그가 없습니다.</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '150px' }}>발송일시</th>
                                    <th style={{ width: '130px' }}>수신 번호</th>
                                    <th style={{ width: '100px' }}>수신자명</th>
                                    <th style={{ width: '120px' }}>전송 수단</th>
                                    <th style={{ width: '180px' }}>제목</th>
                                    <th>발송 메시지 본문</th>
                                    <th style={{ width: '100px' }}>상태</th>
                                    <th style={{ width: '160px' }}>오류 상세 정보</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                                            {log.recipient_phone || '-'}
                                        </td>
                                        <td>{log.recipient_name || '-'}</td>
                                        <td>{getTypeIcon(log.channel || log.type)}</td>
                                        <td style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                                            {log.title || '-'}
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'pre-wrap', maxWidth: '300px', lineHeight: '1.4' }}>
                                            {log.body || log.content || '-'}
                                        </td>
                                        <td>{getStatusBadge(log.status)}</td>
                                        <td style={{ fontSize: '12px', color: log.status === 'fail' ? '#ef4444' : '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.error_message}>
                                            {log.error_message || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
