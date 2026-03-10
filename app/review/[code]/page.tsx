'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import './review.css';

export default function BurialReviewPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const reviewCode = params.code as string;
    const stepParam = searchParams.get('step');

    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [burialPlace, setBurialPlace] = useState('');
    const [burialPlace2, setBurialPlace2] = useState('');
    const [mournerName, setMournerName] = useState('');
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

    const step = stepParam === '2' ? 2 : 1;

    // 1차 리뷰
    const [rating1, setRating1] = useState(0);
    const [reviewText1, setReviewText1] = useState('');
    const [photos1, setPhotos1] = useState<string[]>([]);

    // 2차 리뷰
    const [rating2, setRating2] = useState(0);
    const [reviewText2, setReviewText2] = useState('');
    const [photos2, setPhotos2] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);

    useEffect(() => {
        async function fetchBugo() {
            try {
                const res = await fetch(`/api/burial-review?code=${reviewCode}`);
                const data = await res.json();
                if (res.ok) {
                    setAuthorized(true);
                    setBurialPlace(data.burialPlace || '');
                    setBurialPlace2(data.burialPlace2 || '');
                    setMournerName(data.mournerName || '');
                    setAlreadyReviewed(data.alreadyReviewed || false);
                } else {
                    setAuthorized(false);
                }
            } catch (e) {
                console.error(e);
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        }
        fetchBugo();
    }, [reviewCode]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const setPhotos = step === 1 ? setPhotos1 : setPhotos2;
        const currentPhotos = step === 1 ? photos1 : photos2;
        Array.from(files).forEach(file => {
            if (currentPhotos.length >= 10) return;
            const reader = new FileReader();
            reader.onload = () => setPhotos(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        const setPhotos = step === 1 ? setPhotos1 : setPhotos2;
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const currentRating = step === 1 ? rating1 : rating2;
    const currentReviewText = step === 1 ? reviewText1 : reviewText2;
    const currentPhotos = step === 1 ? photos1 : photos2;
    const currentPlace = step === 1 ? burialPlace : burialPlace2;
    const setCurrentRating = step === 1 ? setRating1 : setRating2;
    const setCurrentReviewText = step === 1 ? setReviewText1 : setReviewText2;

    const handleNext = () => {
        if (currentRating === 0) { alert('별점을 선택해주세요.'); return; }
        if (!currentReviewText.trim()) { alert('이용 소감을 작성해주세요.'); return; }
        router.push(`/review/${reviewCode}?step=2`);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        router.push(`/review/${reviewCode}`);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        if (currentRating === 0) { alert('별점을 선택해주세요.'); return; }
        if (!currentReviewText.trim()) { alert('이용 소감을 작성해주세요.'); return; }

        setSubmitting(true);
        try {
            // 1차 장지 리뷰
            const res1 = await fetch('/api/burial-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewCode,
                    burialPlace,
                    mournerName,
                    rating: rating1,
                    reviewText: reviewText1,
                    photos: photos1,
                    consentAgreed: true,
                }),
            });

            if (!res1.ok) {
                const err = await res1.json();
                alert(err.error || '후기 등록에 실패했습니다.');
                setSubmitting(false);
                return;
            }

            // 2차 장지 리뷰 (있으면)
            if (burialPlace2 && rating2 > 0) {
                const res2 = await fetch('/api/burial-review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewCode,
                        burialPlace: burialPlace2,
                        mournerName,
                        rating: rating2,
                        reviewText: reviewText2,
                        photos: photos2,
                        consentAgreed: true,
                    }),
                });

                if (!res2.ok) {
                    const err = await res2.json();
                    console.error('2차 장지 리뷰 오류:', err);
                }
            }

            setSubmitted(true);
        } catch (e) {
            console.error('리뷰 제출 오류:', e);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="review-container"><div className="review-loading">불러오는 중...</div></div>;
    }

    if (!authorized) {
        return (
            <div className="review-container">
                <div className="review-empty">
                    <div className="review-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <p>잘못된 접근입니다.</p>
                </div>
            </div>
        );
    }

    if (!burialPlace) {
        return (
            <div className="review-container">
                <div className="review-empty"><p>장지 정보를 찾을 수 없습니다.</p></div>
            </div>
        );
    }

    if (alreadyReviewed) {
        return (
            <div className="review-container">
                <div className="review-done">
                    <div className="review-done-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2>이미 후기를 작성하셨습니다</h2>
                    <p>소중한 후기 감사합니다.</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="review-container">
                <div className="review-card">
                    <div className="review-done">
                        <div className="review-done-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2>후기가 등록되었습니다</h2>
                        <p>소중한 경험을 나눠주셔서 감사합니다.<br />투명한 장례 문화를 위해 큰 힘이 됩니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    const hasTwoPlaces = !!burialPlace2;
    const isLastStep = !hasTwoPlaces || step === 2;

    return (
        <div className="review-container">
            <div className="review-card">
                {/* 뒤로가기 (2차일 때) */}
                {step === 2 && (
                    <button className="review-back" onClick={handleBack} type="button">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                )}

                <div className="review-header">
                    <h1>장지 이용 후기</h1>
                    <p className="review-subtitle">
                        {mournerName && <span>{mournerName}님, </span>}
                        소중한 경험을 나눠주세요
                    </p>
                </div>

                {/* 장지명 */}
                <div className="review-place">
                    <div className="review-place-label">
                        {hasTwoPlaces ? (step === 1 ? '1차 장지' : '2차 장지') : '이용하신 장지'}
                    </div>
                    <div className="review-place-name">{currentPlace}</div>
                </div>

                {/* 별점 */}
                <div className="review-section">
                    <label className="review-label">전반적인 만족도</label>
                    <div className="review-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} className={`star-btn ${currentRating >= star ? 'active' : ''}`}
                                onClick={() => setCurrentRating(star)} type="button">★</button>
                        ))}
                    </div>
                    {currentRating > 0 && (
                        <div className="rating-text">
                            {['', '아쉬워요', '보통이에요', '괜찮아요', '만족해요', '매우 만족해요'][currentRating]}
                        </div>
                    )}
                </div>

                {/* 후기 텍스트 */}
                <div className="review-section">
                    <label className="review-label">이용 소감</label>
                    <textarea className="review-textarea"
                        placeholder="시설, 위치, 분위기 등 이용하면서 느끼신 점을 자유롭게 작성해주세요."
                        value={currentReviewText}
                        onChange={e => setCurrentReviewText(e.target.value)}
                        maxLength={500} rows={4} />
                    <div className="char-count">{currentReviewText.length}/500</div>
                </div>

                {/* 사진 업로드 */}
                <div className="review-section">
                    <label className="review-label">사진 <span className="optional">(선택, 최대 10장)</span></label>
                    <div className="photo-grid">
                        {currentPhotos.map((photo, idx) => (
                            <div key={idx} className="photo-item">
                                <img src={photo} alt={`사진 ${idx + 1}`} />
                                <button className="photo-remove" onClick={() => removePhoto(idx)} type="button">✕</button>
                            </div>
                        ))}
                        {currentPhotos.length < 10 && (
                            <label className="photo-add">
                                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} hidden />
                                <svg className="photo-add-svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span className="photo-add-text">사진 추가</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* 버튼 */}
                {isLastStep ? (
                    <button className="review-submit" onClick={handleSubmit} disabled={submitting || currentRating === 0}>
                        {submitting ? '등록 중...' : '후기 등록하기'}
                    </button>
                ) : (
                    <button className="review-submit" onClick={handleNext} disabled={currentRating === 0}>
                        다음
                    </button>
                )}

                {/* 동의 텍스트 */}
                <div className="review-consent-text" onClick={() => setShowConsentModal(true)}>
                    후기 활용에 동의합니다. <span className="consent-arrow">›</span>
                </div>
            </div>

            {/* 동의 팝업 모달 */}
            {showConsentModal && (
                <div className="consent-overlay" onClick={() => setShowConsentModal(false)}>
                    <div className="consent-modal" onClick={e => e.stopPropagation()}>
                        <div className="consent-modal-header">
                            <h3>후기 활용 동의</h3>
                            <button className="consent-modal-close" onClick={() => setShowConsentModal(false)}>✕</button>
                        </div>
                        <div className="consent-modal-body">
                            <p><strong>수집 항목</strong></p>
                            <p>별점, 후기 내용, 사진, 장지명</p>
                            <br />
                            <p><strong>활용 목적</strong></p>
                            <p>장례 정보 서비스 개선 및 장지 이용 후기 제공</p>
                            <br />
                            <p><strong>보유 기간</strong></p>
                            <p>후기 삭제 요청 시까지</p>
                            <br />
                            <p>후기 등록 시 위 내용에 동의한 것으로 간주됩니다. 작성하신 후기는 장례 정보 서비스에서 다른 이용자에게 제공될 수 있습니다.</p>
                        </div>
                        <button className="consent-modal-btn" onClick={() => setShowConsentModal(false)}>확인</button>
                    </div>
                </div>
            )}
        </div>
    );
}
