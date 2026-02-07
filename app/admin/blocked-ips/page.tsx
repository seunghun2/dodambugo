'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

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

export default function BlockedIPsPage() {
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [newIP, setNewIP] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

    const fetchBlockedIPs = async () => {
        const res = await fetch('/api/blocked-ips');
        const data = await res.json();
        setBlockedIPs(data);
        setLoading(false);
    };

    const fetchAccessLogs = async () => {
        setLogsLoading(true);
        const res = await fetch('/api/access-logs?limit=50');
        const data = await res.json();
        setAccessLogs(Array.isArray(data) ? data : []);
        setLogsLoading(false);
    };

    useEffect(() => {
        fetchBlockedIPs();
        fetchAccessLogs();
    }, []);

    const handleBlock = async () => {
        if (!newIP.trim()) return alert('IP 주소를 입력하세요');

        await fetch('/api/blocked-ips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip_address: newIP.trim(), reason: reason || '수동 차단' })
        });

        setNewIP('');
        setReason('');
        fetchBlockedIPs();
    };

    const handleUnblock = async (ip: string) => {
        if (!confirm(`${ip} 차단을 해제하시겠습니까?`)) return;

        await fetch('/api/blocked-ips', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip_address: ip })
        });

        fetchBlockedIPs();
    };

    // 접속 로그에서 바로 차단
    const handleQuickBlock = async (ip: string) => {
        if (!confirm(`${ip} 을(를) 차단하시겠습니까?`)) return;

        await fetch('/api/blocked-ips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip_address: ip, reason: '접속 로그에서 수동 차단' })
        });

        fetchBlockedIPs();
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

    // 차단된 IP인지 확인
    const isBlocked = (ip: string) => blockedIPs.some(b => b.ip_address === ip);

    // User-Agent에서 디바이스 간단 표시
    const getDevice = (ua: string) => {
        if (!ua) return '-';
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iPad')) return 'iPad';
        if (ua.includes('Macintosh')) return 'Mac';
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('bot') || ua.includes('Bot') || ua.includes('crawl')) return 'Bot';
        return 'Other';
    };

    return (
        <div className="admin-pc">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>IP 제한 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {blockedIPs.length}건</span>
                        <button onClick={() => { fetchBlockedIPs(); fetchAccessLogs(); }} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">

                    {/* 자동 차단 규칙 */}
                    <div className="inquiry-panel wide" style={{ marginBottom: '16px' }}>
                        <div className="panel-header">
                            <span>자동 차단 규칙</span>
                        </div>
                        <div className="inquiry-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '160px' }}>감지 유형</th>
                                        <th style={{ width: '100px' }}>임계값</th>
                                        <th>설명</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>스크린샷 감지</td>
                                        <td>3회 이상</td>
                                        <td style={{ fontSize: '12px', color: '#888' }}>PrintScreen, Cmd+Shift+3/4/5 등 캡처 키 입력 감지</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>개발자 도구</td>
                                        <td>2회 이상</td>
                                        <td style={{ fontSize: '12px', color: '#888' }}>DevTools 반복 열기 감지 (소스코드 탈취 의심)</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>부고 대량 열람</td>
                                        <td>5건 이상</td>
                                        <td style={{ fontSize: '12px', color: '#888' }}>다수 부고 페이지 열람 (스크래핑 의심)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 차단 IP 목록 */}
                    <div className="inquiry-panel wide" style={{ marginBottom: '16px' }}>
                        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <span>차단 IP 목록</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={newIP}
                                    onChange={(e) => setNewIP(e.target.value)}
                                    placeholder="IP 주소"
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        width: '160px',
                                        fontFamily: 'monospace',
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBlock()}
                                />
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="차단 사유"
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        width: '160px',
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBlock()}
                                />
                                <button
                                    onClick={handleBlock}
                                    style={{
                                        padding: '6px 16px',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    차단
                                </button>
                            </div>
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
                                            <th style={{ width: '140px' }}>IP 주소</th>
                                            <th>차단 사유</th>
                                            <th style={{ width: '60px' }}>유형</th>
                                            <th style={{ width: '140px' }}>차단 시간</th>
                                            <th style={{ width: '80px' }}>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blockedIPs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="empty-cell">
                                                    차단된 IP가 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            blockedIPs.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{
                                                        fontFamily: 'monospace',
                                                        fontWeight: 600,
                                                        color: '#0066cc',
                                                        fontSize: '13px',
                                                    }}>
                                                        {item.ip_address}
                                                    </td>
                                                    <td style={{ fontSize: '13px', color: '#444' }}>
                                                        {item.reason || '-'}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: isAutoBlocked(item.reason) ? '#fef2f2' : '#f0fdf4',
                                                            color: isAutoBlocked(item.reason) ? '#dc2626' : '#16a34a',
                                                            border: `1px solid ${isAutoBlocked(item.reason) ? '#fecaca' : '#bbf7d0'}`,
                                                        }}>
                                                            {isAutoBlocked(item.reason) ? '자동' : '수동'}
                                                        </span>
                                                    </td>
                                                    <td className="date-cell" style={{ fontSize: '12px' }}>
                                                        {formatDate(item.blocked_at)}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleUnblock(item.ip_address)}
                                                            style={{
                                                                padding: '4px 12px',
                                                                background: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                                fontWeight: 600,
                                                            }}
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
                    </div>

                    {/* 최근 접속 로그 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>최근 접속 로그 (최대 50건)</span>
                            <button
                                onClick={fetchAccessLogs}
                                style={{
                                    padding: '4px 12px',
                                    background: '#f5f5f5',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                새로고침
                            </button>
                        </div>

                        {logsLoading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : (
                            <div className="inquiry-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '130px' }}>IP 주소</th>
                                            <th style={{ width: '200px' }}>경로</th>
                                            <th style={{ width: '70px' }}>디바이스</th>
                                            <th>유입 경로</th>
                                            <th style={{ width: '90px' }}>시간</th>
                                            <th style={{ width: '70px' }}>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accessLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="empty-cell">
                                                    접속 로그가 없습니다 (배포 후 수집 시작)
                                                </td>
                                            </tr>
                                        ) : (
                                            accessLogs.map((log) => (
                                                <tr key={log.id} style={{
                                                    background: isBlocked(log.ip_address) ? '#fef2f2' : undefined,
                                                }}>
                                                    <td style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        color: isBlocked(log.ip_address) ? '#dc2626' : '#0066cc',
                                                    }}>
                                                        {log.ip_address || '-'}
                                                    </td>
                                                    <td style={{ fontSize: '12px', color: '#444' }}>
                                                        {log.path}
                                                    </td>
                                                    <td style={{ fontSize: '11px', color: '#888' }}>
                                                        {getDevice(log.user_agent)}
                                                    </td>
                                                    <td style={{ fontSize: '11px', color: '#888', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {log.referer || '직접 접속'}
                                                    </td>
                                                    <td style={{ fontSize: '11px', color: '#888' }}>
                                                        {formatTime(log.created_at)}
                                                    </td>
                                                    <td>
                                                        {!isBlocked(log.ip_address) && log.ip_address ? (
                                                            <button
                                                                onClick={() => handleQuickBlock(log.ip_address)}
                                                                style={{
                                                                    padding: '2px 8px',
                                                                    background: '#dc3545',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    fontSize: '11px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                차단
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>차단됨</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <p style={{ padding: '0', fontSize: '12px', color: '#999', marginTop: '12px' }}>
                        ※ 차단된 IP로 접속 시 무한 로딩 페이지가 표시됩니다. 등록 후 최대 5분 내 적용됩니다.
                    </p>
                </div>
            </main>
        </div>
    );
}
