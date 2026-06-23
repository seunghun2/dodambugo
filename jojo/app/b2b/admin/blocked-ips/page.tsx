'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    IconRefresh, 
    IconLoader2, 
    IconBan, 
    IconDownload,
    IconTrash,
    IconPlus
} from '@tabler/icons-react';
import styles from './blockedIps.module.css';

interface BlockedIP {
    id: string;
    ip_address: string;
    reason: string;
    blocked_at: string;
    is_active: boolean;
}

interface AccessLog {
    id: string;
    ip_address: string;
    path: string;
    user_agent: string;
    referer: string;
    created_at: string;
}

const PAGE_SIZE = 50;

export default function B2BBlockedIPsPage() {
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [ipDevices, setIpDevices] = useState<Record<string, string>>({});
    const [newIP, setNewIP] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const logScrollRef = useRef<HTMLDivElement>(null);

    const fetchBlockedIPs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/admin/blocked-ips');
            const data = await res.json();
            setBlockedIPs(data);

            // 각 차단 IP의 기기 정보 가져오기
            if (Array.isArray(data) && data.length > 0) {
                const ips = data.map((d: BlockedIP) => d.ip_address).join(',');
                const logsRes = await fetch(`/api/access-logs?ips=${encodeURIComponent(ips)}`);
                const logsData = await logsRes.json();
                if (Array.isArray(logsData)) {
                    const deviceMap: Record<string, string> = {};
                    for (const log of logsData) {
                        deviceMap[log.ip_address] = getDevice(log.user_agent);
                    }
                    setIpDevices(deviceMap);
                }
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchAccessLogs = async () => {
        setLogsLoading(true);
        setHasMore(true);
        try {
            const res = await fetch(`/api/access-logs?limit=${PAGE_SIZE}&offset=0`);
            const data = await res.json();
            setAccessLogs(Array.isArray(data) ? data : []);
            if (!Array.isArray(data) || data.length < PAGE_SIZE) setHasMore(false);
        } catch (err) {
            console.error(err);
        }
        setLogsLoading(false);
    };

    const loadMoreLogs = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const offset = accessLogs.length;
        try {
            const res = await fetch(`/api/access-logs?limit=${PAGE_SIZE}&offset=${offset}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setAccessLogs(prev => [...prev, ...data]);
                if (data.length < PAGE_SIZE) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        }
        setLoadingMore(false);
    }, [loadingMore, hasMore, accessLogs.length]);

    // 무한 스크롤 핸들러
    const handleLogScroll = useCallback(() => {
        const el = logScrollRef.current;
        if (!el) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
            loadMoreLogs();
        }
    }, [loadMoreLogs]);

    useEffect(() => {
        fetchBlockedIPs();
        fetchAccessLogs();
    }, []);

    const handleBlock = async () => {
        if (!newIP.trim()) return alert('IP 주소를 입력하세요');

        try {
            const res = await fetch('/api/b2b/admin/blocked-ips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: newIP.trim(), reason: reason || '수동 차단' })
            });
            if (res.ok) {
                setNewIP('');
                setReason('');
                fetchBlockedIPs();
            } else {
                alert('차단 등록에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUnblock = async (ip: string) => {
        if (!confirm(`${ip} 차단을 해제하시겠습니까?`)) return;

        try {
            const res = await fetch('/api/b2b/admin/blocked-ips', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: ip })
            });
            if (res.ok) {
                fetchBlockedIPs();
            } else {
                alert('차단 해제에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // 접속 로그에서 바로 차단
    const handleQuickBlock = async (ip: string) => {
        if (!confirm(`${ip} 을(를) 차단하시겠습니까?`)) return;

        try {
            const res = await fetch('/api/b2b/admin/blocked-ips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: ip, reason: '접속 로그에서 수동 차단' })
            });
            if (res.ok) {
                fetchBlockedIPs();
            } else {
                alert('차단 등록에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
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

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const isAutoBlocked = (r: string) => r?.startsWith('[자동]');

    const isBlocked = (ip: string) => blockedIPs.some(b => b.ip_address === ip);

    const getDevice = (ua: string) => {
        if (!ua) return '-';
        if (ua.includes('HeadlessChrome')) return 'Vercel Bot';
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iPad')) return 'iPad';
        if (ua.includes('Macintosh')) return 'Mac';
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('bot') || ua.includes('Bot') || ua.includes('crawl')) return 'Bot';
        return 'Other';
    };

    const totalPages = Math.ceil(blockedIPs.length / itemsPerPage);
    const paginatedBlockedIPs = blockedIPs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // 차단 IP 엑셀 다운로드
    const handleDownloadBlockedExcel = () => {
        if (blockedIPs.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['IP 주소', '차단 사유', '차단 유형', '기기', '차단 시간'];
        const rows = blockedIPs.map(item => [
            item.ip_address,
            item.reason || '-',
            isAutoBlocked(item.reason) ? '자동' : '수동',
            ipDevices[item.ip_address] || '-',
            formatDate(item.blocked_at)
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
        link.setAttribute('download', `b2b_blocked_ips_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 접속 로그 엑셀 다운로드
    const handleDownloadLogsExcel = () => {
        if (accessLogs.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['IP 주소', '접속 경로', '기기', '출처', '접속 시간', '차단 여부'];
        const rows = accessLogs.map(log => [
            log.ip_address || '-',
            log.path,
            getDevice(log.user_agent),
            log.referer || '-',
            formatDate(log.created_at),
            isBlocked(log.ip_address) ? '차단됨' : '허용'
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
        link.setAttribute('download', `b2b_access_logs_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <div>
                    <h1 className={styles.title}>IP 제한 관리</h1>
                    <p className={styles.subtitle}>비정상적인 접근 감지 및 악성 IP 차단을 관리합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.totalCount}>차단 IP: {blockedIPs.length}건</span>
                    <button onClick={() => { fetchBlockedIPs(); fetchAccessLogs(); }} className={styles.btnRefresh}>
                        <IconRefresh size={16} />
                        새로고침
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* 자동 차단 규칙 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>자동 차단 규칙</span>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '180px' }}>감지 유형</th>
                                    <th style={{ width: '120px' }}>임계값</th>
                                    <th>설명</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>스크린샷 감지</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>3회 이상</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>PrintScreen, Cmd+Shift+3/4/5 등 캡처 키 입력 감지</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>개발자 도구</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>2회 이상</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>DevTools 반복 열기 감지 (모바일 제외)</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>부고 대량 열람</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>5건 이상</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>다른 부고 5개 이상 열람 시 자동 차단 + 슬랙 알림 (관리자 IP 제외)</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>봇/크롤러 감지</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>즉시</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>python, scrapy, curl, selenium 등 자동화 도구로 부고 접근 시 즉시 차단</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>과다 방문</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>50회/24시간</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>24시간 내 총 50회 이상 방문 시 자동 차단 (/view, /create, /guide, /admin 경로는 제외)</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>의심 페이지</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>8회 이상</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>약관·개인정보·연락처 페이지 합계 8회 이상 방문 시 자동 차단</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 600 }}>검색 과다</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>4회 이상</td>
                                    <td style={{ fontSize: '13px', color: '#64748b' }}>/search 페이지 4회 이상 방문 시 자동 차단</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 차단 IP 목록 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>차단 IP 목록</span>
                        <div className={styles.cardActions}>
                            <input
                                type="text"
                                value={newIP}
                                onChange={(e) => setNewIP(e.target.value)}
                                placeholder="IP 주소 입력"
                                className={styles.ipInput}
                                onKeyDown={(e) => e.key === 'Enter' && handleBlock()}
                            />
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="차단 사유"
                                className={styles.reasonInput}
                                onKeyDown={(e) => e.key === 'Enter' && handleBlock()}
                            />
                            <button onClick={handleBlock} className={styles.btnBlock}>
                                <IconBan size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                차단 등록
                            </button>
                            <button onClick={handleDownloadBlockedExcel} className={styles.btnExcel} style={{ padding: '8px 12px' }}>
                                <IconDownload size={15} />
                                엑셀 다운로드
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.emptyCell}>
                            <IconLoader2 size={32} className={styles.spinning} style={{ color: '#d4a84b' }} />
                            <p style={{ marginTop: '8px' }}>불러오는 중...</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '180px' }}>IP 주소</th>
                                        <th>차단 사유</th>
                                        <th style={{ width: '100px' }}>유형</th>
                                        <th style={{ width: '100px' }}>기기</th>
                                        <th style={{ width: '180px' }}>차단 시간</th>
                                        <th style={{ width: '100px' }}>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedBlockedIPs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className={styles.emptyCell}>
                                                차단된 IP가 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedBlockedIPs.map((item) => (
                                            <tr key={item.id}>
                                                <td className={styles.ipCell}>{item.ip_address}</td>
                                                <td>{item.reason || '-'}</td>
                                                <td>
                                                    <span className={`${styles.badge} ${isAutoBlocked(item.reason) ? styles.badgeAuto : styles.badgeManual}`}>
                                                        {isAutoBlocked(item.reason) ? '자동' : '수동'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#64748b', fontSize: '13px' }}>
                                                    {ipDevices[item.ip_address] || '-'}
                                                </td>
                                                <td style={{ color: '#64748b', fontSize: '13px' }}>
                                                    {formatDate(item.blocked_at)}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleUnblock(item.ip_address)}
                                                        className={styles.btnUnblock}
                                                    >
                                                        해제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className={styles.pageBtn}
                            >
                                이전
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button 
                                    key={page} 
                                    onClick={() => setCurrentPage(page)} 
                                    className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages} 
                                className={styles.pageBtn}
                            >
                                다음
                            </button>
                            <span className={styles.pageInfo}>총 {blockedIPs.length}개</span>
                        </div>
                    )}
                </div>

                {/* 최근 접속 로그 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>최근 접속 로그 ({accessLogs.length}건{hasMore ? '+' : ''})</span>
                        <div className={styles.cardActions}>
                            <button onClick={fetchAccessLogs} className={styles.btnRefresh} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                새로고침
                            </button>
                            <button onClick={handleDownloadLogsExcel} className={styles.btnExcel} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                <IconDownload size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                로그 다운로드
                            </button>
                        </div>
                    </div>

                    {logsLoading ? (
                        <div className={styles.emptyCell}>
                            <IconLoader2 size={32} className={styles.spinning} style={{ color: '#d4a84b' }} />
                            <p style={{ marginTop: '8px' }}>불러오는 중...</p>
                        </div>
                    ) : (
                        <div 
                            ref={logScrollRef}
                            onScroll={handleLogScroll}
                            className={styles.logScrollContainer}
                        >
                            <table className={`${styles.table} ${styles.logTable}`}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '150px' }}>IP 주소</th>
                                        <th>접속 경로</th>
                                        <th style={{ width: '100px' }}>기기</th>
                                        <th>출처(Referer)</th>
                                        <th style={{ width: '150px' }}>접속 시간</th>
                                        <th style={{ width: '80px', textAlign: 'center' }}>차단</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accessLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className={styles.emptyCell}>
                                                접속 로그가 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        accessLogs.map((log) => (
                                            <tr 
                                                key={log.id} 
                                                className={isBlocked(log.ip_address) ? styles.logRowBlocked : ''}
                                            >
                                                <td className={styles.ipCell} style={{ color: isBlocked(log.ip_address) ? '#ef4444' : '#2563eb' }}>
                                                    {log.ip_address || '-'}
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{log.path}</td>
                                                <td>{getDevice(log.user_agent)}</td>
                                                <td style={{ color: '#64748b', fontSize: '13px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {log.referer || '-'}
                                                </td>
                                                <td style={{ color: '#64748b', fontSize: '13px' }}>
                                                    {formatTime(log.created_at)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {!isBlocked(log.ip_address) && log.ip_address ? (
                                                        <button
                                                            onClick={() => handleQuickBlock(log.ip_address)}
                                                            className={styles.btnQuickBlock}
                                                        >
                                                            차단
                                                        </button>
                                                    ) : (
                                                        <span className={styles.blockedX}>차단됨</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {loadingMore && (
                                <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                                    <IconLoader2 size={16} className={styles.spinning} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                                    로딩 중...
                                </div>
                            )}
                            {!hasMore && accessLogs.length > 0 && (
                                <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                                    모든 접속 로그를 불러왔습니다.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className={styles.note}>
                    ※ IP 차단 설정은 실시간으로 적용되며, 해당 IP는 부고 접속 시 무한 로딩 상태가 됩니다.
                </p>
            </div>
        </div>
    );
}
