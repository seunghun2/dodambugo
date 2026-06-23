'use client';

import { useState, useEffect } from 'react';
import { 
    IconMessage2, 
    IconRefresh, 
    IconX, 
    IconChevronRight, 
    IconDownload, 
    IconLoader2 
} from '@tabler/icons-react';
import styles from './reviews.module.css';

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
    company_name?: string;
}

export default function B2BAdminBurialReviewsPage() {
    const [reviews, setReviews] = useState<BurialReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<BurialReview | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/admin/burial-reviews');
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

    // CSV 다운로드 기능
    const handleDownloadExcel = () => {
        if (reviews.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['작성일', '파트너사', '별점', '장지명', '상주명', '고인명', '연락처', '장례식장', '부고번호', '이용 소감', '활용 동의'];
        const rows = reviews.map(r => [
            formatDate(r.created_at),
            r.company_name || 'B2B 파트너',
            String(r.rating),
            r.burial_place,
            r.mourner_name || '-',
            r.deceased_name || '-',
            r.mourner_phone || '-',
            r.funeral_home || '-',
            r.bugo_number,
            r.review_text || '-',
            r.consent_agreed ? '동의' : '미동의'
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
        link.setAttribute('download', `b2b_burial_reviews_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <div>
                    <h1 className={styles.title}>편지 후기 관리</h1>
                    <p className={styles.subtitle}>B2B 파트너들이 생성한 부고에 작성된 장지 후기를 관리합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.totalCount}>총 {reviews.length}건</span>
                    <button onClick={fetchReviews} className={styles.btnRefresh}>
                        <IconRefresh size={16} />
                        새로고침
                    </button>
                    <button onClick={handleDownloadExcel} className={styles.btnExcel}>
                        <IconDownload size={16} />
                        엑셀 다운로드
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* 리뷰 목록 */}
                <div className={styles.tableCard}>
                    {loading ? (
                        <div className={styles.emptyState}>
                            <IconLoader2 size={32} className={styles.spinning} style={{ color: '#d4a84b' }} />
                            <span>불러오는 중...</span>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>파트너사</th>
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
                                            <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                                작성된 후기가 없습니다
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.map(review => (
                                            <tr
                                                key={review.id}
                                                className={selectedReview?.id === review.id ? styles.selectedRow : ''}
                                                onClick={() => setSelectedReview(review)}
                                            >
                                                <td style={{ fontWeight: 600, color: '#475569' }}>
                                                    {review.company_name || 'B2B 파트너'}
                                                </td>
                                                <td>
                                                    <span style={{ color: getRatingColor(review.rating), fontWeight: 700 }}>
                                                        {review.rating} 점
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{review.burial_place}</td>
                                                <td>{review.mourner_name || '-'}</td>
                                                <td>{review.mourner_phone || '-'}</td>
                                                <td>
                                                    <div className={styles.ellipsisText}>
                                                        {review.review_text || '-'}
                                                    </div>
                                                </td>
                                                <td>{review.photos?.length || 0}장</td>
                                                <td style={{ color: '#64748b', fontSize: '13px' }}>{formatDate(review.created_at)}</td>
                                                <td>
                                                    <IconChevronRight size={18} style={{ color: '#cbd5e1' }} />
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
                <div className={styles.detailCard}>
                    {selectedReview ? (
                        <>
                            <div className={styles.detailHeader}>
                                <span className={styles.detailTitle}>후기 상세 정보</span>
                                <button onClick={() => setSelectedReview(null)} className={styles.btnClose}>
                                    <IconX size={18} />
                                </button>
                            </div>
                            <div className={styles.detailContent}>
                                {/* 별점 */}
                                <div className={styles.detailSection}>
                                    <div className={styles.starsArea}>
                                        <div className={styles.stars}>
                                            {renderStars(selectedReview.rating)}
                                        </div>
                                        <div 
                                            className={styles.ratingText}
                                            style={{ color: getRatingColor(selectedReview.rating) }}
                                        >
                                            {['', '아쉬워요', '보통이에요', '괜찮아요', '만족해요', '매우 만족해요'][selectedReview.rating]}
                                        </div>
                                    </div>
                                </div>

                                {/* 정보 */}
                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>파트너사</span>
                                        <span className={styles.detailValue} style={{ color: '#d4a84b' }}>
                                            {selectedReview.company_name || 'B2B 파트너'}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>장지명</span>
                                        <span className={styles.detailValue}>{selectedReview.burial_place}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>상주명</span>
                                        <span className={styles.detailValue}>{selectedReview.mourner_name || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>연락처</span>
                                        <span className={styles.detailValue}>{selectedReview.mourner_phone || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>장례식장</span>
                                        <span className={styles.detailValue}>{selectedReview.funeral_home || '-'}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>부고번호</span>
                                        <span className={styles.bugoNum}>{selectedReview.bugo_number}</span>
                                    </div>
                                </div>

                                {/* 이용 소감 */}
                                <div className={styles.detailSection}>
                                    <span className={styles.detailSectionTitle}>이용 소감</span>
                                    <div className={styles.messageBox}>
                                        {selectedReview.review_text || '(작성하지 않음)'}
                                    </div>
                                </div>

                                {/* 사진 */}
                                {selectedReview.photos && selectedReview.photos.length > 0 && (
                                    <div className={styles.detailSection}>
                                        <span className={styles.detailSectionTitle}>첨부 사진 ({selectedReview.photos.length}장)</span>
                                        <div className={styles.photoGrid}>
                                            {selectedReview.photos.map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={photo}
                                                    alt={`사진 ${idx + 1}`}
                                                    className={styles.photoItem}
                                                    onClick={() => window.open(photo, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 작성일 */}
                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>작성일</span>
                                        <span className={styles.detailValue}>{formatDate(selectedReview.created_at)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>활용 동의</span>
                                        <span 
                                            className={styles.detailValue}
                                            style={{ color: selectedReview.consent_agreed ? '#22c55e' : '#ef4444' }}
                                        >
                                            {selectedReview.consent_agreed ? '동의' : '미동의'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.detailEmptyState}>
                            <IconMessage2 size={40} style={{ color: '#cbd5e1' }} />
                            <p>후기를 선택하시면<br />상세 정보를 확인할 수 있습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
