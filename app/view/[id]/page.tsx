'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NaverMap from '@/components/NaverMap';
import './view.css';

interface BugoData {
    id: string;
    bugo_number: string;
    template_id?: string;
    applicant_name: string;
    phone_password: string;
    deceased_name: string;
    gender?: string;
    age?: number;
    death_date?: string;
    death_time?: string;
    encoffin_date?: string;
    encoffin_time?: string;
    religion?: string;
    relationship?: string;
    mourner_name?: string;
    contact?: string;
    mourners?: Array<{ relationship: string; name: string; contact: string }>;
    funeral_home?: string;
    room_number?: string;
    funeral_home_tel?: string;
    address?: string;
    address_detail?: string;
    funeral_date?: string;
    funeral_time?: string;
    burial_place?: string;
    burial_place2?: string;
    message?: string;
    account_info?: Array<{ bank: string; holder: string; number: string }> | null;
    photo_url?: string;
}

export default function ViewPage() {
    const params = useParams();
    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const id = params.id as string;
                const isUUID = id.includes('-') && id.length > 10;

                let data = null;
                let queryError = null;

                if (isUUID) {
                    const result = await supabase.from('bugo').select('*').eq('id', id).limit(1);
                    data = result.data?.[0] || null;
                    queryError = result.error;
                } else {
                    const result = await supabase.from('bugo').select('*').eq('bugo_number', id).order('created_at', { ascending: false }).limit(1);
                    data = result.data?.[0] || null;
                    queryError = result.error;
                }

                if (queryError || !data) {
                    setError('부고장을 찾을 수 없습니다.');
                    return;
                }

                if (data.mourners && typeof data.mourners === 'string') {
                    try { data.mourners = JSON.parse(data.mourners); } catch (e) { }
                }
                if (data.account_info && typeof data.account_info === 'string') {
                    try { data.account_info = JSON.parse(data.account_info); } catch (e) { }
                }

                setBugo(data);
            } catch (err: any) {
                setError('부고장을 찾을 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchBugo();
    }, [params.id]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekDay = weekDays[date.getDay()];
        return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekDay})`;
    };

    const formatDateShort = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const copyAddress = async () => {
        if (bugo?.address) {
            await navigator.clipboard.writeText(bugo.address + (bugo.address_detail ? ' ' + bugo.address_detail : ''));
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const openNaverMap = () => {
        if (bugo?.funeral_home) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(bugo.funeral_home)}`, '_blank');
        } else if (bugo?.address) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(bugo.address)}`, '_blank');
        }
    };

    const openKakaoNavi = () => {
        if (bugo?.funeral_home) {
            // 장례식장명으로 검색하면 마커가 정확히 찍힘
            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(bugo.funeral_home)}`, '_blank');
        } else if (bugo?.address) {
            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(bugo.address)}`, '_blank');
        }
    };

    const shareViaKakao = () => {
        const url = window.location.href;
        if (typeof window !== 'undefined' && (window as any).Kakao?.Share) {
            (window as any).Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: `故 ${bugo?.deceased_name}님 부고`,
                    description: bugo?.message || '삼가 고인의 명복을 빕니다.',
                    imageUrl: '',
                    link: { mobileWebUrl: url, webUrl: url }
                },
                buttons: [{ title: '부고장 보기', link: { mobileWebUrl: url, webUrl: url } }]
            });
        } else {
            copyToClipboard(url);
        }
    };

    const shareViaSMS = () => {
        const url = window.location.href;
        const text = `[부고] 故 ${bugo?.deceased_name}님께서 별세하셨습니다.\n\n${url}`;
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>부고장을 불러오는 중...</p>
            </div>
        );
    }

    if (error || !bugo) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <div className="error-icon">😢</div>
                    <h2>부고장을 찾을 수 없습니다</h2>
                    <p>요청하신 부고장이 존재하지 않거나 삭제되었습니다.</p>
                    <Link href="/" className="btn-home">홈으로</Link>
                </div>
            </div>
        );
    }

    // 상주 목록
    const mournersList: Array<{ relationship: string; name: string; contact: string }> = [];
    if (bugo.mourner_name) {
        mournersList.push({ relationship: bugo.relationship || '상주', name: bugo.mourner_name, contact: bugo.contact || '' });
    }
    if (bugo.mourners && Array.isArray(bugo.mourners)) {
        bugo.mourners.forEach(m => { if (m.name) mournersList.push(m); });
    }

    // 템플릿 이미지 결정
    const getTemplateImage = () => {
        const templateId = bugo.template_id || 'basic';
        return `/images/template-${templateId}.png`;
    };

    return (
        <main className="view-page">
            {/* 장례식장명 헤더 바 */}
            <div className="funeral-home-header">
                {bugo.funeral_home}
            </div>

            {/* 토스트 */}
            {copySuccess && <div className="toast">복사되었습니다</div>}

            {/* ========================================
                헤더 섹션 - 템플릿 이미지 + 동적 텍스트
            ======================================== */}
            <div className={`header-section template-${bugo.template_id || 'basic'}`}>
                <img src={getTemplateImage()} alt="" className="header-bg" />
                {/* 동적 텍스트만 오버레이 - 이미지에 謹弔/부고 등 정적 텍스트 포함됨 */}
                <div className="header-text-overlay">
                    <p className="header-dynamic-text">
                        故{bugo.deceased_name}님께서 {bugo.death_date ? formatDateShort(bugo.death_date) : ''}<br />
                        별세하셨기에 삼가 알려드립니다.<br />
                        마음으로 따뜻한 위로 부탁드리며<br />
                        고인의 명복을 빌어주시길 바랍니다.
                    </p>
                </div>
            </div>

            {/* 구분선 */}
            <div className="section-divider"></div>

            {/* ========================================
                빈소 오시는 길
            ======================================== */}
            <section className="section">
                <h2 className="section-title">빈소 오시는 길</h2>

                <div className="address-row">
                    <p className="address-text">{bugo.address} {bugo.address_detail || ''}</p>
                    <button className="btn-copy-address" onClick={copyAddress}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        주소 복사
                    </button>
                </div>

                {/* 지도 */}
                <div className="map-container">
                    <NaverMap
                        address={bugo.address || ''}
                        placeName={bugo.funeral_home}
                        height="200px"
                    />
                </div>

                {/* 내비 버튼 */}
                <div className="navi-buttons">
                    <button className="navi-btn" onClick={openNaverMap}>
                        <img src="/images/ic_naver_map.png" alt="네이버지도" className="navi-icon" />
                        <span>네이버지도</span>
                    </button>
                    <button className="navi-btn" onClick={openKakaoNavi}>
                        <img src="/images/ic_kakao_navi.png" alt="카카오내비" className="navi-icon" />
                        <span>카카오내비</span>
                    </button>
                </div>

                {/* 장례식장 박스 */}
                <div className="funeral-box">
                    <p className="funeral-name">{bugo.funeral_home}</p>
                    <p className="funeral-room">{bugo.room_number || ''}</p>
                </div>
            </section>

            {/* ========================================
                상주
            ======================================== */}
            <section className="section mourners-section">
                <h2 className="section-title">상주</h2>
                <div className="mourners-table">
                    {(() => {
                        // 관계별로 그룹핑
                        const grouped: Record<string, Array<{ name: string; contact: string }>> = {};
                        mournersList.forEach(m => {
                            if (!grouped[m.relationship]) grouped[m.relationship] = [];
                            grouped[m.relationship].push({ name: m.name, contact: m.contact });
                        });
                        return Object.entries(grouped).map(([rel, names], i) => (
                            <div className="mourner-row" key={i}>
                                <span className="mourner-rel">{rel}</span>
                                <span className="mourner-names">
                                    {names.map((n, j) => (
                                        <span key={j}>
                                            {j > 0 && ', '}
                                            {n.name}
                                            {n.contact && (
                                                <a href={`tel:${n.contact}`} className="mourner-tel-inline">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E8566" strokeWidth="2">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                    </svg>
                                                </a>
                                            )}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        ));
                    })()}
                </div>
            </section>

            {/* 구분선 */}
            <div className="section-divider"></div>

            {/* ========================================
                발인 및 장지
            ======================================== */}
            <section className="section">
                <div className="funeral-info-table">
                    {bugo.encoffin_date && (
                        <>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">입관</span>
                                <span className="funeral-info-value">{formatDate(bugo.encoffin_date)} {bugo.encoffin_time || ''}</span>
                            </div>
                            <div className="funeral-info-divider"></div>
                        </>
                    )}
                    {bugo.funeral_date && (
                        <div className="funeral-info-row">
                            <span className="funeral-info-label">발인</span>
                            <span className="funeral-info-value">{formatDate(bugo.funeral_date)} {bugo.funeral_time || ''}</span>
                        </div>
                    )}
                    {(bugo.burial_place || bugo.burial_place2) && (
                        <div className="funeral-info-row burial-section">
                            <span className="funeral-info-label">장지</span>
                            <div className="burial-list">
                                {bugo.burial_place && (
                                    <div className="burial-item">
                                        <div className="burial-box">
                                            <span className="burial-label">1차장지</span>
                                        </div>
                                        <span className="burial-text">{bugo.burial_place}</span>
                                    </div>
                                )}
                                {bugo.burial_place2 && (
                                    <div className="burial-item">
                                        <div className="burial-box">
                                            <span className="burial-label">2차장지</span>
                                        </div>
                                        <span className="burial-text">{bugo.burial_place2}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================
                계좌 정보
            ======================================== */}
            {bugo.account_info && Array.isArray(bugo.account_info) && bugo.account_info.length > 0 && (
                <section className="section">
                    <h2 className="section-title">부의금 계좌</h2>
                    <div className="account-list">
                        {bugo.account_info.map((acc, i) => (
                            <div className="account-row" key={i}>
                                <div className="account-info">
                                    <span className="account-bank">{acc.bank}</span>
                                    <span className="account-number">{acc.number}</span>
                                    <span className="account-holder">{acc.holder}</span>
                                </div>
                                <button className="btn-copy" onClick={() => copyToClipboard(acc.number)}>복사</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ========================================
                추모글 (방명록)
            ======================================== */}
            <section className="section guestbook-section">
                <h2 className="section-title">추모글</h2>
                <div className="guestbook-form">
                    <input type="text" placeholder="이름" className="form-input" />
                    <input type="password" placeholder="비밀번호 4자리" maxLength={4} className="form-input" />
                    <textarea placeholder="따뜻한 위로의 말씀을 전해주세요." className="form-textarea"></textarea>
                    <button className="btn-submit">조문 남기기</button>
                </div>
                <div className="guestbook-empty">
                    <p>아직 작성된 추모글이 없습니다.</p>
                </div>
            </section>

            {/* ========================================
                하단 버튼
            ======================================== */}
            <div className="bottom-buttons">
                <button className="bottom-btn" onClick={() => setShareModalOpen(true)}>
                    <img src="/images/ic_writing.svg" alt="" className="bottom-icon" />
                    <span>부고 알리기</span>
                </button>
                <div className="divider-vertical"></div>
                <button className="bottom-btn" disabled>
                    <img src="/images/ic_letter.svg" alt="" className="bottom-icon" />
                    <span>부의금 보내기</span>
                </button>
            </div>

            {/* ========================================
                마무리 메시지
            ======================================== */}
            <div className="footer-message">
                <p>따뜻한 마음의 위로 부탁드리며,<br />고인의 명복을 빌어주시길 바랍니다.</p>
            </div>

            {/* ========================================
                공유 모달
            ======================================== */}
            {shareModalOpen && (
                <div className="share-modal">
                    <div className="share-overlay" onClick={() => setShareModalOpen(false)}></div>
                    <div className="share-content">
                        <div className="share-header">
                            <h3>공유하기</h3>
                            <button className="share-close" onClick={() => setShareModalOpen(false)}>✕</button>
                        </div>
                        <button className="share-option" onClick={shareViaKakao}>
                            <img src="/images/icon-kakao.png" alt="카카오톡" />
                            <span>카카오톡으로 보내기</span>
                        </button>
                        <button className="share-option" onClick={shareViaSMS}>
                            <img src="/images/icon-message.png" alt="메세지" />
                            <span>메세지로 보내기</span>
                        </button>
                        <button className="share-option" onClick={() => copyToClipboard(window.location.href)}>
                            <img src="/images/icon-link.png" alt="링크" />
                            <span>링크 복사하기</span>
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
