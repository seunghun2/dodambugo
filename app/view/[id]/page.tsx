'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '@/public/css/view-toss.css';
import '@/public/css/view-overlay.css';

interface BugoData {
    id: string;
    bugo_number: string;
    template?: string;
    applicant_name: string;
    phone_password: string;
    deceased_name: string;
    gender?: string;
    age?: number;
    death_date?: string;
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
    const [activeTab, setActiveTab] = useState<'info' | 'guestbook'>('info');
    const [copySuccess, setCopySuccess] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const id = params.id as string;

                // UUID 형식인지 확인 (xxxx-xxxx-xxxx 패턴)
                const isUUID = id.includes('-') && id.length > 10;

                let data = null;
                let error = null;

                if (isUUID) {
                    // UUID로 검색
                    const result = await supabase
                        .from('bugo')
                        .select('*')
                        .eq('id', id)
                        .single();
                    data = result.data;
                    error = result.error;
                } else {
                    // 부고번호로 검색
                    const result = await supabase
                        .from('bugo')
                        .select('*')
                        .eq('bugo_number', id)
                        .single();
                    data = result.data;
                    error = result.error;
                }

                if (error || !data) {
                    setError('부고장을 찾을 수 없습니다.');
                    return;
                }

                setBugo(data);
            } catch (err: any) {
                setError('부고장을 찾을 수 없습니다.');
                console.log('Bugo not found:', params.id);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchBugo();
        }
    }, [params.id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setShareModalOpen(false);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const shareViaKakao = () => {
        // 카카오톡 공유 (카카오 SDK 필요)
        const url = window.location.href;
        if (typeof window !== 'undefined' && (window as any).Kakao?.Share) {
            (window as any).Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: `故 ${bugo?.deceased_name}님 부고`,
                    description: bugo?.funeral_home || '부고장',
                    imageUrl: 'https://dodambugo.com/images/og-image.png',
                    link: { mobileWebUrl: url, webUrl: url }
                },
                buttons: [{ title: '부고장 보기', link: { mobileWebUrl: url, webUrl: url } }]
            });
        } else {
            // 카카오톡 앱 직접 실행 (폴백)
            window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}`);
        }
        setShareModalOpen(false);
    };

    const shareViaSMS = () => {
        const url = window.location.href;
        const text = `[부고] 故 ${bugo?.deceased_name}님 부고장입니다. ${url}`;
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
        setShareModalOpen(false);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
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
                    <div className="error-actions">
                        <Link href="/" className="btn-primary">홈으로</Link>
                    </div>
                </div>
            </div>
        );
    }

    // 상주 목록 생성
    const mournersList = bugo.mourners && bugo.mourners.length > 0
        ? bugo.mourners
        : bugo.mourner_name
            ? [{ relationship: bugo.relationship || '상주', name: bugo.mourner_name, contact: bugo.contact || '' }]
            : [];

    // 템플릿 설정
    const templateClass = bugo.template ? `template-${bugo.template}` : 'template-basic';
    const templateImage = bugo.template ? `/images/template-${bugo.template}.png` : '/images/template-basic.png';

    return (
        <main className={`bugo-view ${templateClass}`}>
            {/* 복사 성공 토스트 */}
            {copySuccess && (
                <div className="copy-toast">
                    ✓ 링크가 복사되었습니다
                </div>
            )}

            {/* 헤더 이미지 */}
            <div className="bugo-header">
                <img src={templateImage} alt="부고장" style={{ width: '100%' }} />
                <div className="text-overlay">
                    <p className="overlay-text overlay-full-message" style={{ display: 'block' }}>
                        故{bugo.deceased_name}님께서 {bugo.death_date ? formatDate(bugo.death_date) : ''}<br />
                        별세하셨기에 삼가 알려드립니다.<br />
                        마음으로 따뜻한 위로 부탁드리며<br />
                        고인의 명복을 빌어주시길 바랍니다.
                    </p>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    <span className="material-symbols-outlined">description</span>
                    <span>부고정보</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'guestbook' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guestbook')}
                >
                    <span className="material-symbols-outlined">edit_note</span>
                    <span>방명록</span>
                </button>
            </div>

            {/* 부고 정보 탭 */}
            <div className={`bugo-content ${activeTab !== 'info' ? 'hidden' : ''}`}>
                {/* 고인 정보 */}
                <section className="content-section">
                    <h3 className="content-title">고인</h3>
                    <div className="info-list">
                        <div className="info-row">
                            <span className="info-label">고인</span>
                            <span className="info-value">故 {bugo.deceased_name}</span>
                        </div>
                        {bugo.age && (
                            <div className="info-row">
                                <span className="info-label">향년</span>
                                <span className="info-value">{bugo.age}세</span>
                            </div>
                        )}
                        {bugo.gender && (
                            <div className="info-row">
                                <span className="info-label">성별</span>
                                <span className="info-value">{bugo.gender}</span>
                            </div>
                        )}
                        {bugo.religion && (
                            <div className="info-row">
                                <span className="info-label">종교</span>
                                <span className="info-value">{bugo.religion}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 상주 정보 */}
                <section className="content-section">
                    <h3 className="content-title">상주</h3>
                    <div className="mourners-list">
                        {mournersList.map((mourner, index) => (
                            <div className="mourner-card" key={index}>
                                <div className="mourner-main">
                                    <span className="mourner-relation">{mourner.relationship}</span>
                                    <span className="mourner-name">{mourner.name}</span>
                                </div>
                                {mourner.contact && (
                                    <div className="mourner-contact">
                                        <a href={`tel:${mourner.contact}`}>{mourner.contact}</a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 빈소 정보 */}
                <section className="content-section">
                    <h3 className="content-title">빈소</h3>
                    <div className="info-list">
                        {bugo.funeral_home && (
                            <div className="info-row">
                                <span className="info-label">장례식장</span>
                                <span className="info-value">{bugo.funeral_home}</span>
                            </div>
                        )}
                        {bugo.room_number && (
                            <div className="info-row">
                                <span className="info-label">호실</span>
                                <span className="info-value">{bugo.room_number}</span>
                            </div>
                        )}
                        {bugo.funeral_home_tel && (
                            <div className="info-row">
                                <span className="info-label">연락처</span>
                                <span className="info-value">
                                    <a href={`tel:${bugo.funeral_home_tel}`}>{bugo.funeral_home_tel}</a>
                                </span>
                            </div>
                        )}
                        {bugo.address && (
                            <div className="info-row">
                                <span className="info-label">주소</span>
                                <span className="info-value">{bugo.address} {bugo.address_detail || ''}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 일정 정보 */}
                <section className="content-section">
                    <h3 className="content-title">일정</h3>
                    <div className="info-list">
                        {bugo.death_date && (
                            <div className="info-row">
                                <span className="info-label">별세</span>
                                <span className="info-value">{formatDate(bugo.death_date)}</span>
                            </div>
                        )}
                        {bugo.funeral_date && (
                            <div className="info-row">
                                <span className="info-label">발인</span>
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
                {bugo.account_info && bugo.account_info.length > 0 && (
                    <section className="content-section">
                        <h3 className="content-title">부의금 계좌</h3>
                        <div className="account-list">
                            {bugo.account_info.map((account, index) => (
                                <div className="account-card" key={index}>
                                    <div className="account-details">
                                        <div className="account-bank">{account.bank}</div>
                                        <div className="account-number">{account.number}</div>
                                        <div className="account-holder">{account.holder}</div>
                                    </div>
                                    <button
                                        className="btn-copy-account"
                                        onClick={() => copyToClipboard(account.number)}
                                    >
                                        복사
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 인사말 */}
                {bugo.message && (
                    <section className="content-section">
                        <div className="condolence-message">
                            <p className="condolence-text">{bugo.message}</p>
                        </div>
                    </section>
                )}

                {/* 마무리 */}
                <section className="content-section">
                    <div className="footer-notice">
                        <p className="notice-text">
                            황망한 마음에 일일이 연락드리지 못함을<br />
                            너그러이 양해해 주시기 바랍니다.
                        </p>
                    </div>
                </section>
            </div>

            {/* 방명록 탭 */}
            <div className={`guestbook-content ${activeTab === 'guestbook' ? 'active' : ''}`}>
                <div className="guestbook-form">
                    <input type="text" placeholder="이름" />
                    <input type="password" placeholder="비밀번호 4자리" maxLength={4} />
                    <textarea placeholder="따뜻한 위로의 말씀을 전해주세요."></textarea>
                    <button className="btn-submit">조문 남기기</button>
                </div>
                <div className="guestbook-empty">
                    <p>아직 작성된 방명록이 없습니다.</p>
                </div>
            </div>

            {/* 하단 공유 버튼 */}
            <div className="bugo-actions">
                <button className="action-btn btn-primary" onClick={() => setShareModalOpen(true)}>
                    <span className="material-symbols-outlined">share</span>
                    공유하기
                </button>
            </div>

            {/* 공유 바텀시트 모달 */}
            {shareModalOpen && (
                <div className="share-modal">
                    <div className="share-modal-overlay" onClick={() => setShareModalOpen(false)}></div>
                    <div className="share-modal-content">
                        <div className="share-options">
                            <button className="share-option" onClick={shareViaKakao}>
                                <img src="/images/icon-kakao.png" alt="카카오톡" className="share-icon-img" />
                                <span>카카오톡으로 보내기</span>
                            </button>
                            <button className="share-option" onClick={shareViaSMS}>
                                <img src="/images/icon-message.png" alt="메세지" className="share-icon-img" />
                                <span>메세지로 보내기</span>
                            </button>
                            <button className="share-option" onClick={() => copyToClipboard(window.location.href)}>
                                <img src="/images/icon-link.png" alt="링크" className="share-icon-img" />
                                <span>링크 복사하기</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
