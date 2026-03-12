'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { gaEvents } from '@/components/GoogleAnalytics';
import './complete.css';

interface BugoData {
    bugo_number: string;
    deceased_name: string;
    age?: number;
    mourner_name?: string;
    mourners?: Array<{ relationship: string; name: string; contact: string }>;
    funeral_type?: string;
    funeral_home?: string;
    room_number?: string;
    funeral_date?: string;
    funeral_time?: string;
    death_date?: string;
    death_time?: string;
    address?: string;
    template_id?: string;
}

export default function CompletePage() {
    const params = useParams();
    const router = useRouter();
    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [showAlimtalkModal, setShowAlimtalkModal] = useState(false);
    const [applicantPhone, setApplicantPhone] = useState<string>('');
    const [showAdditionalMournerModal, setShowAdditionalMournerModal] = useState(false);
    const [additionalMournerConsent, setAdditionalMournerConsent] = useState(false);
    const [sendingAdditionalNotify, setSendingAdditionalNotify] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    // 프로덕션 환경에서는 도메인 강제 고정 (www 제거, https 강제)
    const getOrigin = () => {
        if (typeof window === 'undefined') return '';
        if (window.location.hostname.includes('maeumbugo.co.kr')) {
            return 'https://maeumbugo.co.kr';
        }
        return window.location.origin;
    };

    const bugoUrl = `${getOrigin()}/view/${params.bugoNumber}`;

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const { data, error } = await supabase
                    .from('bugo')
                    .select('*')
                    .eq('bugo_number', params.bugoNumber)
                    .single();

                if (error) throw error;
                setBugo(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (params.bugoNumber) {
            fetchBugo();
            // 상주 인증은 토큰 방식으로만 처리 (view 페이지에서 token 파라미터로 접속 시)

            // QR 코드 생성 (클라이언트에서 즉시)
            const url = `${getOrigin()}/view/${params.bugoNumber}`;
            QRCode.toDataURL(url, { width: 180, margin: 1 })
                .then(dataUrl => setQrDataUrl(dataUrl))
                .catch(err => console.error('QR 생성 실패:', err));

            // Google Ads 전환 추적
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17911391889/lh3xCPb08IYcEJHN6NxC',
                    'value': 1.0,
                    'currency': 'KRW'
                });
            }

            // 신규 생성 시 알림톡 모달 표시
            const isNewBugo = sessionStorage.getItem('new_bugo_created');
            const savedPhone = sessionStorage.getItem('new_bugo_phone');
            if (isNewBugo) {
                sessionStorage.removeItem('new_bugo_created');
                sessionStorage.removeItem('new_bugo_phone');
                if (savedPhone) setApplicantPhone(savedPhone);
                // 잠시 후 모달 표시 (페이지 로딩 후)
                setTimeout(() => {
                    setShowAlimtalkModal(true);
                }, 500);
            }
        }

        // 카카오 SDK 로드
        if (typeof window !== 'undefined' && !(window as any).Kakao) {
            const script = document.createElement('script');
            script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.5.0/kakao.min.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, [params.bugoNumber]);

    const formatDate = (dateStr?: string, timeStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[date.getDay()];
        return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일 (${dayName}) ${timeStr || ''}`;
    };

    const copyLink = () => {
        navigator.clipboard.writeText(bugoUrl);
        gaEvents.shareBugo('link');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareKakao = () => {
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;
            if (!Kakao.isInitialized()) {
                Kakao.init('5aa868e69d68e913ed9da7c3def45151');
            }

            // 날짜/시간 포맷
            const formatKakaoDate = () => {
                if (!bugo?.death_date) return '';
                const date = new Date(bugo.death_date);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                if (bugo.death_time) {
                    const [hour, minute] = bugo.death_time.split(':');
                    const ampm = parseInt(hour) < 12 ? '오전' : '오후';
                    const h = parseInt(hour) % 12 || 12;
                    return `${month}월 ${day}일 ${ampm} ${h}시 ${minute}분경`;
                }
                return `${month}월 ${day}일`;
            };

            const ageText = bugo?.age ? `(향년 ${bugo.age}세)` : '';
            const kakaoTitle = `故${bugo?.deceased_name}님${ageText}께서 ${formatKakaoDate()} 별세하셨음을 삼가 알려 드립니다`;
            const kakaoDesc = bugo?.funeral_home
                ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''}`
                : '';

            // 디버그: 공유되는 URL 확인
            console.log('[카카오 공유] bugoUrl:', bugoUrl);

            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: kakaoTitle,
                    description: kakaoDesc,
                    imageUrl: 'https://maeumbugo.co.kr/og-bugo-v3.png',
                    link: { mobileWebUrl: bugoUrl, webUrl: bugoUrl }
                },
                buttons: [{ title: '부고 확인하기', link: { mobileWebUrl: bugoUrl, webUrl: bugoUrl } }]
            });
            gaEvents.shareBugo('kakao');
        } else {
            navigator.clipboard.writeText(bugoUrl);
            setToast('링크가 복사되었습니다');
            setTimeout(() => setToast(null), 2500);
        }
    };

    const shareSms = () => {
        // 날짜/시간 포맷
        const formatDateTime = (dateStr?: string, timeStr?: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const ampm = timeStr ? (parseInt(timeStr.split(':')[0]) < 12 ? '오전' : '오후') : '';
            const hour = timeStr ? (parseInt(timeStr.split(':')[0]) % 12 || 12) : '';
            const minute = timeStr ? timeStr.split(':')[1] : '';
            return timeStr
                ? `${year}년 ${month}월 ${day}일 ${ampm} ${hour}시 ${minute}분`
                : `${year}년 ${month}월 ${day}일`;
        };

        const deathDateTime = formatDateTime(bugo?.death_date, bugo?.death_time);
        const funeralDateTime = formatDateTime(bugo?.funeral_date, bugo?.funeral_time);
        const mournerName = bugo?.mourner_name || '';

        const text = `[訃告]
故 ${bugo?.deceased_name} 님께서${mournerName ? ` (상주 ${mournerName})` : ''}
${deathDateTime}에
별세하셨기에 아래와 같이 부고를 전해드립니다.

[부고장 확인하기]
${bugoUrl}

발인일: ${funeralDateTime || '추후 공지'}
빈소: ${bugo?.funeral_home || ''}${bugo?.room_number ? ' ' + bugo.room_number : ''}

갑작스러운 비보에 직접 연락드리지 못하고
모바일 부고장으로 알려드리는 점
너그러이 헤아려 주시기 바랍니다.`;

        gaEvents.shareBugo('sms');
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    };

    const duplicateBugo = () => {
        if (!bugo) return;
        // 전체 데이터 복사 (bugo_number만 제외 - 새로 생성됨)
        const duplicateData = {
            ...bugo,
            bugo_number: undefined, // 새로 생성될 것
        };
        sessionStorage.setItem('duplicateBugo', JSON.stringify(duplicateData));

        // 같은 템플릿으로 이동 - 기존 draft 삭제
        const templateId = bugo.template_id || 'basic';
        localStorage.removeItem(`bugo_draft_${templateId}`);
        localStorage.removeItem('bugo_draft_basic');
        localStorage.removeItem('bugo_draft_1');

        router.push(`/create/${templateId}`);
    };

    const handleDelete = async () => {
        if (deletePassword.length !== 4 || deleting) return;
        setDeleting(true);
        setDeleteError('');

        try {
            // 신청자 전화번호 조회
            const { data: bugoCheck } = await supabase
                .from('bugo')
                .select('applicant_phone, phone_password')
                .eq('bugo_number', params.bugoNumber)
                .single();

            if (!bugoCheck) {
                setDeleteError('부고장을 찾을 수 없습니다.');
                setDeleting(false);
                return;
            }

            // 전화번호 뒷4자리 검증
            const phone = (bugoCheck.applicant_phone || bugoCheck.phone_password || '').replace(/-/g, '');
            const last4 = phone.slice(-4);

            if (deletePassword !== last4) {
                setDeleteError('번호가 일치하지 않습니다.');
                setDeleting(false);
                return;
            }

            // 부고장 소프트 삭제 (어드민에서 확인/복구 가능)
            const { error } = await supabase
                .from('bugo')
                .update({ deleted_at: new Date().toISOString() })
                .eq('bugo_number', params.bugoNumber);

            if (error) throw error;

            setShowDeleteModal(false);
            setToast('부고장이 삭제되었습니다');
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (err) {
            console.error('삭제 오류:', err);
            setDeleteError('삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="complete-loading">
                <div className="spinner"></div>
                <p>부고장을 불러오는 중...</p>
            </div>
        );
    }

    if (!bugo) {
        return (
            <div className="complete-error">
                <p>부고장을 찾을 수 없습니다.</p>
                <Link href="/create" className="btn-home">돌아가기</Link>
            </div>
        );
    }

    const mournerName = bugo.mourners && bugo.mourners.length > 0
        ? bugo.mourners[0].name
        : bugo.mourner_name || '상주';

    // QR 코드는 이제 qrDataUrl 상태로 관리 (클라이언트 생성)

    return (
        <div className="complete-page">
            {/* 커스텀 토스트 */}
            {toast && (
                <div className="custom-toast">
                    <span className="material-symbols-outlined">check_circle</span>
                    {toast}
                </div>
            )}

            {/* 공통 헤더 */}
            <Header showCTA={true} />

            {/* 메인 컨텐츠 */}
            <main className="complete-main">
                {/* 제목 섹션 */}
                <div className="title-section">
                    <h1 className="page-title">상주 {mournerName} 님의 부고장</h1>
                    <Link href={`/create/edit/${params.bugoNumber}`} className="btn-edit-light">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        수정하기
                    </Link>
                </div>

                {/* 정보 카드 */}
                <div className="info-card">
                    <div className="info-row">
                        <span className="info-label">고인명</span>
                        <span className="info-value">故{bugo.deceased_name}{bugo.age ? `[${bugo.age}세]` : ''}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">장례종류</span>
                        <span className="info-value">{bugo.funeral_type || '일반 장례'}</span>
                    </div>
                    {/* 일반 장례일 때만 장례식장/주소 표시 */}
                    {(!bugo.funeral_type || bugo.funeral_type === '일반 장례') && (
                        <>
                            <div className="info-row">
                                <span className="info-label">장례식장</span>
                                <span className="info-value">{bugo.funeral_home || '-'} {bugo.room_number || ''}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">주소</span>
                                <span className="info-value">{bugo.address || '-'}</span>
                            </div>
                        </>
                    )}
                    <div className="info-row">
                        <span className="info-label">발인일시</span>
                        <span className="info-value">{formatDate(bugo.funeral_date, bugo.funeral_time)}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">부고장 보기</span>
                        <a href={bugoUrl} className="info-link" target="_blank">{bugoUrl}</a>
                    </div>
                </div>

                {/* 공유 섹션 */}
                <div className="share-section">
                    <h2 className="section-title">모바일 부고장 보내기</h2>
                    <div className="share-grid">
                        {/* QR 코드 */}
                        <div className="share-card" onClick={() => window.open(bugoUrl, '_blank')}>
                            <div className="qr-wrapper">
                                {qrDataUrl ? <img src={qrDataUrl} alt="QR 코드" className="qr-image" /> : <div className="qr-loading">로딩중...</div>}
                            </div>
                            <span className="share-label">모바일부고장 보기</span>
                        </div>

                        {/* 카카오톡 */}
                        <div className="share-card" onClick={shareKakao}>
                            <div className="share-icon-wrapper">
                                <Image src="/images/icon-kakao.png" alt="카카오톡" className="share-icon-img" width={40} height={40} />
                            </div>
                            <span className="share-label">카카오톡으로 보내기</span>
                        </div>

                        {/* 문자 */}
                        <div className="share-card" onClick={shareSms}>
                            <div className="share-icon-wrapper">
                                <Image src="/images/icon-sms.png" alt="문자" className="share-icon-img" width={40} height={40} />
                            </div>
                            <span className="share-label">메세지로 보내기</span>
                        </div>
                    </div>
                </div>

                {/* 복제 배너 */}
                <div className="copy-banner">
                    <p>부고장을 복제하여 다른 이름으로<br />변경하여 사용하실 수 있습니다</p>
                    <button className="btn-copy-bugo" onClick={duplicateBugo}>복제하기</button>
                </div>

                {/* 삭제하기 */}
                <div className="delete-section">
                    <button className="btn-delete-text" onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(''); }}>부고장 삭제하기</button>
                </div>
            </main>

            {/* 알림톡 발송 완료 모달 */}
            {showAlimtalkModal && (
                <div className="alimtalk-modal-overlay">
                    <div className="alimtalk-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="alimtalk-modal-icon">
                            <Image src="/images/icon-kakao.png" alt="카카오톡" width={40} height={40} />
                        </div>
                        <h2 className="alimtalk-modal-title">알림톡 발송 완료</h2>
                        <p className="alimtalk-modal-desc">
                            카카오톡으로 모바일부고장을<br />보내드렸습니다
                        </p>
                        {applicantPhone && (
                            <p className="alimtalk-modal-phone">
                                {applicantPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3')}
                            </p>
                        )}
                        <p className="alimtalk-modal-hint">잠시 후 알림톡이 도착합니다</p>
                        <button className="alimtalk-modal-btn" onClick={() => {
                            setShowAlimtalkModal(false);
                            // 추가 상주 중 전화번호 있는 사람이 있으면 두 번째 모달
                            const additionalWithPhone = bugo?.mourners?.filter(
                                (m, i) => i > 0 && m.contact && m.contact.trim() !== ''
                            ) || [];
                            if (additionalWithPhone.length > 0) {
                                setTimeout(() => setShowAdditionalMournerModal(true), 300);
                            }
                        }}>
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* 추가 상주 알림 발송 모달 */}
            {showAdditionalMournerModal && (() => {
                const additionalMourners = bugo?.mourners?.filter(
                    (m, i) => i > 0 && m.contact && m.contact.trim() !== ''
                ) || [];
                return (
                    <div className="alimtalk-modal-overlay">
                        <div className="alimtalk-modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowAdditionalMournerModal(false)}
                                style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '20px', color: '#aaa', padding: '4px', lineHeight: 1
                                }}
                            >✕</button>
                            <div className="alimtalk-modal-icon">
                                <Image src="/images/icon-kakao.png" alt="카카오톡" width={40} height={40} />
                            </div>
                            <h2 className="alimtalk-modal-title" style={{ marginTop: '8px' }}>
                                추가 상주에게도<br />부고장을 보내시겠습니까?
                            </h2>
                            <div style={{ margin: '16px 0', textAlign: 'left', width: '100%' }}>
                                {additionalMourners.map((m, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', background: '#f8f9fa', borderRadius: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ flex: 1 }}>
                                            <strong>{m.name}</strong>
                                            <span style={{ color: '#888', marginLeft: '4px' }}>({m.relationship})</span>
                                        </span>
                                        <span style={{ color: '#666', fontSize: '14px' }}>
                                            {m.contact.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div
                                onClick={() => setAdditionalMournerConsent(!additionalMournerConsent)}
                                style={{
                                    background: 'transparent', borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px 12px', margin: '38px 0 16px', width: '100%',
                                    cursor: 'pointer'
                                }}>
                                <div
                                    onClick={() => setAdditionalMournerConsent(!additionalMournerConsent)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        cursor: 'pointer', fontSize: '13px', color: '#333'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        border: additionalMournerConsent ? 'none' : '1.5px solid #ddd',
                                        background: additionalMournerConsent ? '#f5c519' : '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, transition: 'all 0.2s'
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={additionalMournerConsent ? '#fff' : '#333'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    수신 동의를 받았습니다.
                                </div>
                                <p style={{
                                    fontSize: '11px', color: '#aaa', textAlign: 'left',
                                    margin: '2px 0 0 30px'
                                }}>
                                    수신 동의가 없는 번호에는 발송하실 수 없습니다.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                <button
                                    className="alimtalk-modal-btn"
                                    style={{
                                        width: '100%',
                                        opacity: additionalMournerConsent ? 1 : 0.4
                                    }}
                                    disabled={!additionalMournerConsent || sendingAdditionalNotify}
                                    onClick={async () => {
                                        setSendingAdditionalNotify(true);
                                        try {
                                            const res = await fetch('/api/bugo-notify-additional', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    parent_bugo_number: bugo?.bugo_number,
                                                    additional_mourners: additionalMourners.map(m => ({
                                                        name: m.name,
                                                        relationship: m.relationship,
                                                        contact: m.contact
                                                    }))
                                                })
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setShowAdditionalMournerModal(false);
                                                setToast(data.scheduled ? '오전 8시에 발송 예정입니다' : '알림을 발송했습니다');
                                                setTimeout(() => setToast(null), 2500);
                                            }
                                        } catch (err) {
                                            console.error('추가 상주 알림 발송 실패:', err);
                                        } finally {
                                            setSendingAdditionalNotify(false);
                                        }
                                    }}
                                >
                                    {sendingAdditionalNotify ? '발송 중...' : '보내기'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 부고장 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="alimtalk-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="alimtalk-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                <circle cx="12" cy="16" r="1" fill="#888" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#191919', margin: '0 0 8px', textAlign: 'center' }}>비밀번호 입력</h2>
                        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px', textAlign: 'center', lineHeight: 1.6 }}>
                            신청 시 입력한 휴대전화번호<br />뒷자리 4자리를 입력해주세요
                        </p>
                        <div
                            onClick={() => document.getElementById('delete-pin')?.focus()}
                            style={{
                                width: '100%', padding: '16px', border: `1px solid ${deleteError ? '#ef4444' : '#ddd'}`,
                                borderRadius: '10px', boxSizing: 'border-box', cursor: 'text',
                                display: 'flex', justifyContent: 'center', gap: '16px',
                                marginBottom: deleteError ? '6px' : '16px',
                            }}
                        >
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} style={{
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    background: deletePassword.length > i ? '#555' : '#ddd',
                                    transition: 'background 0.15s',
                                }} />
                            ))}
                        </div>
                        <input
                            id="delete-pin"
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={deletePassword}
                            onChange={(e) => { setDeletePassword(e.target.value.replace(/\D/g, '')); setDeleteError(''); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && deletePassword.length === 4 && !deleting) {
                                    handleDelete();
                                }
                            }}
                            autoFocus
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />
                        {deleteError && <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 12px', textAlign: 'center' }}>{deleteError}</p>}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    flex: 1, padding: '13px', border: '1px solid #ddd', borderRadius: '10px',
                                    background: '#fff', fontSize: '15px', fontWeight: 600, color: '#666', cursor: 'pointer',
                                }}
                            >취소</button>
                            <button
                                onClick={handleDelete}
                                disabled={deletePassword.length !== 4 || deleting}
                                style={{
                                    flex: 1, padding: '13px', border: 'none', borderRadius: '10px',
                                    background: '#FFCC45', fontSize: '15px', fontWeight: 600, color: '#191919',
                                    cursor: deletePassword.length === 4 && !deleting ? 'pointer' : 'default',
                                    opacity: deletePassword.length === 4 && !deleting ? 1 : 0.5,
                                }}
                            >{deleting ? '삭제 중...' : '확인'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
