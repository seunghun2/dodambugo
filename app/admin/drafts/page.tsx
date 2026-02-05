'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './drafts.css';

interface Draft {
    id: string;
    template: string;
    deceased_name: string | null;
    gender: string | null;
    age: number | null;
    funeral_home: string | null;
    applicant_name: string | null;
    applicant_phone: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

export default function AdminDraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupByIp, setGroupByIp] = useState(false);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
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

    // IP별 그룹핑
    const groupedDrafts = groupByIp
        ? drafts.reduce((acc, draft) => {
            const ip = draft.ip_address || '알 수 없음';
            if (!acc[ip]) acc[ip] = [];
            acc[ip].push(draft);
            return acc;
        }, {} as Record<string, Draft[]>)
        : null;

    const formatDate = (dateStr: string) => {
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
        return labels[template] || template;
    };

    if (loading) {
        return (
            <div className="admin-drafts">
                <div className="loading">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="admin-drafts">
            <header className="admin-header">
                <h1>임시저장 관리</h1>
                <p className="subtitle">부고장 작성 중 임시저장된 데이터 목록</p>
            </header>

            <div className="controls">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={groupByIp}
                        onChange={(e) => setGroupByIp(e.target.checked)}
                    />
                    IP별 그룹핑
                </label>
                <button className="refresh-btn" onClick={fetchDrafts}>
                    새로고침
                </button>
            </div>

            {drafts.length === 0 ? (
                <div className="empty-state">
                    <p>임시저장된 데이터가 없습니다.</p>
                </div>
            ) : groupByIp && groupedDrafts ? (
                // IP별 그룹핑 뷰
                <div className="grouped-view">
                    {Object.entries(groupedDrafts).map(([ip, ipDrafts]) => (
                        <div key={ip} className="ip-group">
                            <h2 className="ip-header">
                                <span className="ip-address">{ip}</span>
                                <span className="draft-count">{ipDrafts.length}건</span>
                            </h2>
                            <table className="drafts-table">
                                <thead>
                                    <tr>
                                        <th>템플릿</th>
                                        <th>고인명</th>
                                        <th>장례식장</th>
                                        <th>신청자</th>
                                        <th>마지막 수정</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ipDrafts.map((draft) => (
                                        <tr key={draft.id}>
                                            <td>{getTemplateLabel(draft.template)}</td>
                                            <td>{draft.deceased_name || '-'}</td>
                                            <td>{draft.funeral_home || '-'}</td>
                                            <td>{draft.applicant_name || '-'}</td>
                                            <td>{formatDate(draft.updated_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            ) : (
                // 일반 리스트 뷰
                <table className="drafts-table">
                    <thead>
                        <tr>
                            <th>IP 주소</th>
                            <th>템플릿</th>
                            <th>고인명</th>
                            <th>장례식장</th>
                            <th>신청자</th>
                            <th>마지막 수정</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drafts.map((draft) => (
                            <tr key={draft.id}>
                                <td className="ip-cell">{draft.ip_address || '-'}</td>
                                <td>{getTemplateLabel(draft.template)}</td>
                                <td>{draft.deceased_name || '-'}</td>
                                <td>{draft.funeral_home || '-'}</td>
                                <td>{draft.applicant_name || '-'}</td>
                                <td>{formatDate(draft.updated_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="stats">
                <p>총 {drafts.length}건의 임시저장</p>
                <p>고유 IP: {new Set(drafts.map(d => d.ip_address)).size}개</p>
            </div>

            <Link href="/admin" className="back-link">
                ← 어드민 홈으로
            </Link>
        </div>
    );
}
