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

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div style={{ padding: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#333' }}>
                        🚫 IP 차단 관리
                    </h1>

                    {/* IP 등록 폼 */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        padding: '20px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <input
                            type="text"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                            placeholder="IP 주소 (예: 123.456.78.90)"
                            style={{
                                flex: '1',
                                minWidth: '200px',
                                padding: '10px 14px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}
                        />
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="차단 사유 (선택)"
                            style={{
                                flex: '1',
                                minWidth: '200px',
                                padding: '10px 14px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}
                        />
                        <button
                            onClick={handleBlock}
                            style={{
                                padding: '10px 24px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            🚫 차단하기
                        </button>
                    </div>

                    {/* 차단 목록 */}
                    {loading ? (
                        <p>로딩 중...</p>
                    ) : blockedIPs.length === 0 ? (
                        <div style={{
                            padding: '60px',
                            textAlign: 'center',
                            color: '#999',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                        }}>
                            차단된 IP가 없습니다
                        </div>
                    ) : (
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            background: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={{ padding: '14px 16px', fontSize: '13px', color: '#666', fontWeight: 600 }}>IP 주소</th>
                                    <th style={{ padding: '14px 16px', fontSize: '13px', color: '#666', fontWeight: 600 }}>사유</th>
                                    <th style={{ padding: '14px 16px', fontSize: '13px', color: '#666', fontWeight: 600 }}>차단 시간</th>
                                    <th style={{ padding: '14px 16px', fontSize: '13px', color: '#666', fontWeight: 600, width: '100px' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blockedIPs.map((item) => (
                                    <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                                        <td style={{ padding: '14px 16px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 600 }}>
                                            {item.ip_address}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>
                                            {item.reason || '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>
                                            {new Date(item.blocked_at).toLocaleString('ko-KR')}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                onClick={() => handleUnblock(item.ip_address)}
                                                style={{
                                                    padding: '6px 14px',
                                                    background: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                해제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <p style={{ marginTop: '16px', fontSize: '13px', color: '#999' }}>
                        ※ 차단된 IP로 접속 시 페이지가 무한 로딩됩니다.
                    </p>
                </div>
            </main>
        </div>
    );
}
