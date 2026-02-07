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

export default function BlockedIPsPage() {
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [newIP, setNewIP] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchBlockedIPs = async () => {
        const res = await fetch('/api/blocked-ips');
        const data = await res.json();
        setBlockedIPs(data);
        setLoading(false);
    };

    useEffect(() => { fetchBlockedIPs(); }, []);

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

    return (
        <div className="admin-pc">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>IP 제한 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {blockedIPs.length}건</span>
                        <button onClick={fetchBlockedIPs} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    <div className="inquiry-panel wide">
                        {/* IP 등록 폼 */}
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
                                    placeholder="사유 (선택)"
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        width: '140px',
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
                                            <th>IP 주소</th>
                                            <th>사유</th>
                                            <th>차단 시간</th>
                                            <th style={{ width: '80px' }}>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blockedIPs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="empty-cell">
                                                    차단된 IP가 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            blockedIPs.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0066cc' }}>
                                                        {item.ip_address}
                                                    </td>
                                                    <td>{item.reason || '-'}</td>
                                                    <td className="date-cell">{formatDate(item.blocked_at)}</td>
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
                </div>

                <p style={{ padding: '0 24px', fontSize: '13px', color: '#999' }}>
                    ※ 차단된 IP로 접속 시 무한 로딩 페이지가 표시됩니다. 등록 후 최대 5분 내 적용됩니다.
                </p>
            </main>
        </div>
    );
}
