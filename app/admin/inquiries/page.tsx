'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function AdminInquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [memo, setMemo] = useState('');
    const [savingMemo, setSavingMemo] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        if (selectedInquiry) {
            setMemo(selectedInquiry.memo || '');
        }
    }, [selectedInquiry]);

    const fetchInquiries = async () => {
        try {
            const { data, error } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquiries(data || []);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const [memoSaved, setMemoSaved] = useState(false);

    const saveMemo = async () => {
        if (!selectedInquiry) return;
        setSavingMemo(true);
        setMemoSaved(false);
        try {
            const { error } = await supabase
                .from('inquiries')
                .update({ memo })
                .eq('id', selectedInquiry.id);

            if (error) throw error;

            // 로컬 상태 업데이트
            setInquiries(prev => prev.map(inq =>
                inq.id === selectedInquiry.id ? { ...inq, memo } : inq
            ));
            setSelectedInquiry({ ...selectedInquiry, memo });
            setMemoSaved(true);
            setTimeout(() => setMemoSaved(false), 2000);
        } catch (error) {
            console.error('Error saving memo:', error);
            alert('메모 저장 실패');
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

    return (
        <div className="admin-pc">
            {/* 사이드바 */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <Link href="/">도담부고</Link>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/admin/inquiries" className="nav-item active">
                        <span className="material-symbols-outlined">mail</span>
                        <span>문의 관리</span>
                    </Link>
                </nav>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>문의 관리</h1>
                    <button onClick={fetchInquiries} className="btn-refresh">
                        <span className="material-symbols-outlined">refresh</span>
                        새로고침
                    </button>
                </header>

                <div className="admin-content-area">
                    {/* 문의 목록 */}
                    <div className="inquiry-panel">
                        <div className="panel-header">
                            <span>전체 문의 ({inquiries.length})</span>
                        </div>

                        {loading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : inquiries.length === 0 ? (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">inbox</span>
                                <p>접수된 문의가 없습니다</p>
                            </div>
                        ) : (
                            <div className="inquiry-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>유형</th>
                                            <th>이름</th>
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
                                                className={selectedInquiry?.id === inquiry.id ? 'selected' : ''}
                                                onClick={() => setSelectedInquiry(inquiry)}
                                            >
                                                <td>
                                                    <span
                                                        className="type-badge"
                                                        style={{ background: getTypeColor(inquiry.inquiry_type) }}
                                                    >
                                                        {inquiry.inquiry_type}
                                                    </span>
                                                </td>
                                                <td className="name-cell">{inquiry.name}</td>
                                                <td className="company-cell">{inquiry.company || '-'}</td>
                                                <td className="phone-cell">{inquiry.phone}</td>
                                                <td className="date-cell">{formatShortDate(inquiry.created_at)}</td>
                                                <td className="arrow-cell">
                                                    <span className="material-symbols-outlined">chevron_right</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 문의 상세 */}
                    <div className="detail-panel">
                        {selectedInquiry ? (
                            <>
                                <div className="panel-header">
                                    <span>문의 상세</span>
                                    <button onClick={() => setSelectedInquiry(null)} className="btn-close">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="detail-content">
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>문의 유형</label>
                                            <span
                                                className="type-badge"
                                                style={{ background: getTypeColor(selectedInquiry.inquiry_type) }}
                                            >
                                                {selectedInquiry.inquiry_type}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <label>이름</label>
                                            <span>{selectedInquiry.name}</span>
                                        </div>
                                        {selectedInquiry.company && (
                                            <div className="detail-row">
                                                <label>회사</label>
                                                <span>{selectedInquiry.company}</span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <label>연락처</label>
                                            <a href={`tel:${selectedInquiry.phone}`}>{selectedInquiry.phone}</a>
                                        </div>
                                        <div className="detail-row">
                                            <label>이메일</label>
                                            <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email}</a>
                                        </div>
                                        <div className="detail-row">
                                            <label>접수일시</label>
                                            <span>{formatDate(selectedInquiry.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label>문의 내용</label>
                                        <div className="message-box">
                                            {selectedInquiry.message}
                                        </div>
                                    </div>

                                    {/* 메모 섹션 */}
                                    <div className="detail-section memo-section">
                                        <label>메모</label>
                                        <textarea
                                            className="memo-textarea"
                                            placeholder="통화 내용, 처리 상태 등을 메모하세요..."
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            rows={4}
                                        />
                                        <button
                                            className={`btn-save-memo ${memoSaved ? 'saved' : ''}`}
                                            onClick={saveMemo}
                                            disabled={savingMemo}
                                        >
                                            {savingMemo ? '저장 중...' : memoSaved ? '✓ 저장됨' : '메모 저장'}
                                        </button>
                                    </div>

                                    <div className="detail-actions">
                                        <a
                                            href={`mailto:${selectedInquiry.email}?subject=Re: [도담부고] ${selectedInquiry.inquiry_type} 답변`}
                                            className="btn-action primary"
                                        >
                                            <span className="material-symbols-outlined">mail</span>
                                            이메일 답변
                                        </a>
                                        <a href={`tel:${selectedInquiry.phone}`} className="btn-action">
                                            <span className="material-symbols-outlined">call</span>
                                            전화하기
                                        </a>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">touch_app</span>
                                <p>문의를 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
