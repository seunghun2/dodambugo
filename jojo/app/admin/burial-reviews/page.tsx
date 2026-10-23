'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface BurialReview {
    id: string;
    bugo_number: string;
    burial_place: string;
    mourner_name: string;
    mourner_phone: string | null;
    funeral_home: string | null;
    deceased_name: string | null;
    rating: number;
    review_text: string;
    photos: string[];
    consent_agreed: boolean;
    created_at: string;
}

export default function AdminBurialReviewsPage() {
    const [reviews, setReviews] = useState<BurialReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<BurialReview | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/burial-reviews');
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
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

    const renderStars = (rating: number) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return '#22c55e';
        if (rating >= 3) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="admin-pc">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>장지 후기 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {reviews.length}건</span>
                        <button onClick={fetchReviews} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 리뷰 목록 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>장지 후기 ({reviews.length})</span>
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
                                            <th>별점</th>
                                            <th>장지명</th>
                                            <th>상주명</th>
                                            <th>연락처</th>
                                            <th>이용 소감</th>
                                            <th>사진</th>
                                            <th>작성일</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    작성된 후기가 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            reviews.map(review => (
                                                <tr
                                                    key={review.id}
                                                    className={selectedReview?.id === review.id ? 'selected' : ''}
                                                    onClick={() => setSelectedReview(review)}
                                                >
                                                    <td>
                                                        <span style={{ color: getRatingColor(review.rating), fontWeight: 700 }}>
                                                            {review.rating}
                                                        </span>
                                                    </td>
                                                    <td className="name-cell">{review.burial_place}</td>
                                                    <td>{review.mourner_name || '-'}</td>
                                                    <td>{review.mourner_phone || '-'}</td>
                                                    <td className="name-cell" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {review.review_text || '-'}
                                                    </td>
                                                    <td>{review.photos?.length || 0}장</td>
                                                    <td className="date-cell">{formatDate(review.created_at)}</td>
                                                    <td className="arrow-cell">
                                                        <span className="material-symbols-outlined">chevron_right</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 상세 패널 */}
                    <div className="detail-panel">
                        {selectedReview ? (
                            <>
                                <div className="panel-header">
                                    <span>후기 상세</span>
                                    <button onClick={() => setSelectedReview(null)} className="btn-close">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="detail-content">
                                    {/* 별점 */}
                                    <div className="detail-section">
                                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                            <div style={{
                                                fontSize: '32px',
                                                color: '#f59e0b',
                                                letterSpacing: '4px',
                                            }}>
                                                {renderStars(selectedReview.rating)}
                                            </div>
                                            <div style={{
                                                fontSize: '14px',
                                                color: getRatingColor(selectedReview.rating),
                                                fontWeight: 600,
                                                marginTop: '4px',
                                            }}>
                                                {['', '아쉬워요', '보통이에요', '괜찮아요', '만족해요', '매우 만족해요'][selectedReview.rating]}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 정보 */}
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>장지명</label>
                                            <span>{selectedReview.burial_place}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>상주명</label>
                                            <span>{selectedReview.mourner_name || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>연락처</label>
                                            <span>{selectedReview.mourner_phone || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>장례식장</label>
                                            <span>{selectedReview.funeral_home || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>부고번호</label>
                                            <span className="bugo-num">{selectedReview.bugo_number}</span>
                                        </div>
                                    </div>

                                    {/* 이용 소감 */}
                                    <div className="detail-section">
                                        <label>이용 소감</label>
                                        <div className="message-box">
                                            {selectedReview.review_text || '(작성하지 않음)'}
                                        </div>
                                    </div>

                                    {/* 사진 */}
                                    {selectedReview.photos && selectedReview.photos.length > 0 && (
                                        <div className="detail-section">
                                            <label>첨부 사진 ({selectedReview.photos.length}장)</label>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '8px',
                                                marginTop: '8px'
                                            }}>
                                                {selectedReview.photos.map((photo, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={photo}
                                                        alt={`사진 ${idx + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            aspectRatio: '1',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() => window.open(photo, '_blank')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 작성일 */}
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>작성일</label>
                                            <span>{formatDate(selectedReview.created_at)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>활용 동의</label>
                                            <span style={{
                                                color: selectedReview.consent_agreed ? '#22c55e' : '#ef4444'
                                            }}>
                                                {selectedReview.consent_agreed ? '동의' : '미동의'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">rate_review</span>
                                <p>후기를 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
