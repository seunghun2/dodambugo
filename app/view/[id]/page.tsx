'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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

    const openTmap = () => {
        if (bugo?.address) {
            window.location.href = `tmap://route?goalname=${encodeURIComponent(bugo.funeral_home || '')}&goalx=&goaly=`;
        }
    };

    const openKakaoNavi = () => {
        if (bugo?.address) {
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

    const templateImage = bugo.template_id ? `/images/template-${bugo.template_id}.png` : '/images/template-basic.png';

    return (
        <main className="view-page">
            {/* 토스트 */}
            {copySuccess && <div className="toast">복사되었습니다</div>}

            {/* 헤더 이미지 */}
            <div className="header-section">
                <img src={templateImage} alt="" className="header-bg" />
                <div className="header-overlay">
                    <h1 className="header-title">訃告</h1>
                    <p className="header-message">
                        故{bugo.deceased_name}님께서 {bugo.death_date ? formatDateShort(bugo.death_date) : ''}<br />
                        별세하셨기에 삼가 알려드립니다.<br />
                        마음으로 따뜻한 위로 부탁드리며<br />
                        고인의 명복을 빌어주시길 바랍니다.
                    </p>
                </div>
            </div>

            {/* 빈소 오시는 길 */}
            <section className="section">
                <h2 className="section-title">빈소 오시는 길</h2>
                <div className="address-row">
                    <div className="address-text">
                        <span className="address-icon">📍</span>
                        <div className="address-info">
                            <p>{bugo.address} {bugo.address_detail || ''}</p>
                            {bugo.funeral_home_tel && <p className="tel">{bugo.funeral_home_tel}</p>}
                        </div>
                    </div>
                    <button className="btn-copy-address" onClick={copyAddress}>주소 복사</button>
                </div>

                {/* 지도 */}
                <div className="map-container">
                    <div id="map" className="map-area">
                        <iframe
                            src={`https://map.kakao.com/link/search/${encodeURIComponent(bugo.address || '')}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                        ></iframe>
                    </div>
                </div>

                {/* 내비 버튼 */}
                <div className="navi-buttons">
                    <button className="navi-btn" onClick={openTmap}>
                        <span className="navi-icon tmap">T</span>
                        <span>티맵</span>
                    </button>
                    <button className="navi-btn" onClick={openKakaoNavi}>
                        <span className="navi-icon kakao">🗺️</span>
                        <span>카카오내비</span>
                    </button>
                </div>

                {/* 장례식장 박스 */}
                <div className="funeral-box">
                    <p className="funeral-name">{bugo.funeral_home}</p>
                    <p className="funeral-room">{bugo.room_number}</p>
                </div>
            </section>

            {/* 상주 */}
            <section className="section">
                <h2 className="section-title">상주</h2>
                <div className="mourners-table">
                    {mournersList.map((m, i) => (
                        <div className="mourner-row" key={i}>
                            <span className="mourner-rel">{m.relationship}</span>
                            <span className="mourner-names">{m.name}</span>
                            {m.contact && <a href={`tel:${m.contact}`} className="mourner-tel">{m.contact}</a>}
                        </div>
                    ))}
                </div>
            </section>

            {/* 발인 */}
            <section className="section">
                <h2 className="section-title">발인</h2>
                <div className="info-table">
                    {bugo.funeral_date && (
                        <div className="info-row">
                            <span className="info-label">일시</span>
                            <span className="info-value">{formatDate(bugo.funeral_date)} {bugo.funeral_time || ''}</span>
                        </div>
                    )}
                    {bugo.burial_place && (
                        <div className="info-row">
                            <span className="info-label">장지</span>
                            <span className="info-value">{bugo.burial_place}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* 계좌 정보 */}
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

            {/* 방명록 */}
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

            {/* 하단 버튼 */}
            <div className="bottom-buttons">
                <button className="bottom-btn" onClick={() => setShareModalOpen(true)}>
                    <span className="btn-icon">📤</span>
                    <span>부고 알리기</span>
                </button>
                <div className="divider"></div>
                <button className="bottom-btn" disabled>
                    <span className="btn-icon">💌</span>
                    <span>부의금 보내기</span>
                </button>
            </div>

            {/* 마무리 메시지 */}
            <div className="footer-message">
                <p>따뜻한 마음의 위로 부탁드리며,<br />고인의 명복을 빌어주시길 바랍니다.</p>
            </div>

            {/* 공유 모달 */}
            {shareModalOpen && (
                <div className="share-modal">
                    <div className="share-overlay" onClick={() => setShareModalOpen(false)}></div>
                    <div className="share-content">
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
