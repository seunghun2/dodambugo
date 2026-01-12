'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NaverMap from '@/components/NaverMap';
import { gaEvents } from '@/components/GoogleAnalytics';
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
    funeral_type?: string;
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

// 상주 관계 + 고인 성별 → 고인-상주 관계 자동 매핑
function getDeceasedRelation(mournerRelation: string, deceasedGender: string): string {
    const gender = deceasedGender === '남' ? 'male' : 'female';

    const relationMap: Record<string, { male: string; female: string }> = {
        '배우자': { male: '남편', female: '아내' },
        '아들': { male: '부친', female: '모친' },
        '딸': { male: '부친', female: '모친' },
        '며느리': { male: '시부', female: '시모' },
        '사위': { male: '장인', female: '장모' },
        '손': { male: '조부', female: '조모' },
        '손자': { male: '조부', female: '조모' },
        '손녀': { male: '조부', female: '조모' },
        '외손': { male: '외조부', female: '외조모' },
        '외손자': { male: '외조부', female: '외조모' },
        '외손녀': { male: '외조부', female: '외조모' },
        '증손': { male: '증조부', female: '증조모' },
        '부친': { male: '아들', female: '딸' },
        '모친': { male: '아들', female: '딸' },
        '형': { male: '형', female: '누나' },
        '오빠': { male: '오빠', female: '언니' },
        '누나': { male: '남동생', female: '여동생' },
        '언니': { male: '남동생', female: '여동생' },
        '동생': { male: '형/오빠', female: '누나/언니' },
        '형수': { male: '시동생', female: '시누이' },
        '제수': { male: '형', female: '언니' },
        '매형': { male: '처남', female: '처제' },
        '자제': { male: '부친', female: '모친' },
    };

    return relationMap[mournerRelation]?.[gender] || mournerRelation;
}
export default function ViewPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    // owner=true 파라미터 처리: localStorage에 저장하고 URL에서 제거
    const [isOwner, setIsOwner] = useState(false);
    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [showFloatingFlower, setShowFloatingFlower] = useState(false);
    const [flowerModalOpen, setFlowerModalOpen] = useState(false);
    const [selectedFlower, setSelectedFlower] = useState<number | null>(1); // 기본 선택: 1번

    // owner=true 파라미터 처리 (URL 정리)
    useEffect(() => {
        const ownerParam = searchParams.get('owner');
        const bugoId = params.id as string;
        const storageKey = `bugo_owner_${bugoId}`;

        if (ownerParam === 'true') {
            // localStorage에 저장
            localStorage.setItem(storageKey, 'true');
            setIsOwner(true);
            // URL에서 owner 파라미터 제거 (history.replaceState로 새로고침 없이)
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        } else {
            // localStorage에서 확인
            const savedOwner = localStorage.getItem(storageKey);
            setIsOwner(savedOwner === 'true');
        }
    }, [searchParams, params.id]);


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

                // GA 조회 이벤트
                gaEvents.viewBugo(data.bugo_number || data.id);

                // 조회수 증가 (한 번만)
                await supabase
                    .from('bugo')
                    .update({ view_count: (data.view_count || 0) + 1 })
                    .eq('id', data.id);
            } catch (err: any) {
                setError('부고장을 찾을 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchBugo();
    }, [params.id]);

    // 스크롤 시 플로팅 화환 버튼 표시 (상주가 아닐 때만)
    useEffect(() => {
        if (isOwner) return; // 상주는 표시 안 함

        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (scrollY > 100) {
                setShowFloatingFlower(true);
            } else {
                setShowFloatingFlower(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isOwner]);

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
            setToastMessage('주소가 복사되었습니다');
            setTimeout(() => setToastMessage(null), 2000);
        }
    };

    // 공유용 URL: owner 파라미터 제거 + 프로덕션 도메인 강제
    const getCleanShareUrl = () => {
        const pathname = window.location.pathname;
        if (window.location.hostname.includes('maeumbugo.co.kr')) {
            return `https://maeumbugo.co.kr${pathname}`;
        }
        return `${window.location.origin}${pathname}`;
    };

    const copyToClipboard = async (text: string, message?: string, isAccount?: boolean) => {
        await navigator.clipboard.writeText(text);
        if (isAccount) gaEvents.copyAccount();
        setToastMessage(message || '복사되었습니다');
        setTimeout(() => setToastMessage(null), 2000);
    };

    const openNaverMap = () => {
        gaEvents.clickMap();
        if (bugo?.funeral_home) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(bugo.funeral_home)}`, '_blank');
        } else if (bugo?.address) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(bugo.address)}`, '_blank');
        }
    };

    const openKakaoNavi = () => {
        gaEvents.clickMap();
        if (bugo?.funeral_home) {
            // 장례식장명으로 검색하면 마커가 정확히 찍힘
            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(bugo.funeral_home)}`, '_blank');
        } else if (bugo?.address) {
            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(bugo.address)}`, '_blank');
        }
    };

    const shareViaKakao = () => {
        const shareUrl = getCleanShareUrl();

        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;

            // 초기화 안되어있으면 초기화
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

            console.log('[카카오 공유] shareUrl:', shareUrl);

            gaEvents.shareBugo('kakao');
            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: `故${bugo?.deceased_name}님${ageText}께서 ${formatKakaoDate()} 별세하셨음을 삼가 알려 드립니다`,
                    description: bugo?.funeral_home
                        ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''}`
                        : '',
                    imageUrl: 'https://maeumbugo.co.kr/og-bugo-v3.png',
                    link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
                },
                buttons: [{ title: '부고 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }]
            });
        } else {
            copyToClipboard(shareUrl);
        }
    };

    const shareViaSMS = () => {
        const url = window.location.href;

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
${url}

발인일: ${funeralDateTime || '추후 공지'}
빈소: ${bugo?.funeral_home || ''}${bugo?.room_number ? ' ' + bugo.room_number : ''}

갑작스러운 비보에 직접 연락드리지 못하고
모바일 부고장으로 알려드리는 점
너그러이 헤아려 주시기 바랍니다.`;

        gaEvents.shareBugo('sms');
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    };

    const shareViaBand = () => {
        const shareUrl = getCleanShareUrl();
        const title = `[訃告] 故 ${bugo?.deceased_name || ''} 부고장`;
        const content = `故 ${bugo?.deceased_name || ''} 님의 부고장입니다.`;

        gaEvents.shareBugo('band');
        // 밴드 공유 URL 형식
        const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(title + '\n' + content)}&route=${encodeURIComponent(shareUrl)}`;
        window.open(bandUrl, '_blank', 'width=500,height=700');
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
                    <img src="/images/mourning-ribbon.png" alt="추모" className="error-ribbon" />
                    <h2>부고장을 찾을 수 없습니다</h2>
                    <p>요청하신 부고장이 존재하지 않거나 삭제되었습니다.</p>
                    <Link href="/" className="btn-home">홈으로</Link>
                </div>
            </div>
        );
    }

    // 1달 이상 지난 부고는 비공개 처리
    const isExpired = () => {
        if (!bugo.funeral_date) return false;
        const funeralDate = new Date(bugo.funeral_date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        return funeralDate < oneMonthAgo;
    };

    // 발인 후 3일 경과 여부 (추모 오버레이용)
    const isFuneralEnded = () => {
        if (!bugo.funeral_date) return false;
        const funeralDate = new Date(bugo.funeral_date);
        const threeDaysAfter = new Date(funeralDate);
        threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
        return new Date() > threeDaysAfter;
    };

    // 발인 일시 경과 여부 (화환 버튼 숨김용 - 발인 시간 지나면 바로)
    const isFuneralPassed = () => {
        if (!bugo.funeral_date) return false;
        const funeralDate = new Date(bugo.funeral_date);
        // 발인 시간이 있으면 추가
        if (bugo.funeral_time) {
            const [hours, minutes] = bugo.funeral_time.split(':').map(Number);
            funeralDate.setHours(hours || 0, minutes || 0, 0, 0);
        }
        return new Date() > funeralDate;
    };

    if (isExpired()) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <div className="error-icon">🕊️</div>
                    <h2>열람 기간이 종료되었습니다</h2>
                    <p>개인정보 보호를 위해 발인 후 30일이 지난 부고장은 비공개 처리됩니다.</p>
                    <Link href="/" className="btn-home">홈으로</Link>
                </div>
            </div>
        );
    }

    const showMemorialOverlay = isFuneralEnded();

    // 상주 목록 (대표상주 + 추가 상주들, 중복 방지)
    const mournersList: Array<{ relationship: string; name: string; contact: string }> = [];
    if (bugo.mourner_name) {
        mournersList.push({ relationship: bugo.relationship || '상주', name: bugo.mourner_name, contact: bugo.contact || '' });
    }
    if (bugo.mourners && Array.isArray(bugo.mourners)) {
        // 대표상주와 이름+관계가 같으면 중복이므로 제외
        bugo.mourners.forEach(m => {
            if (m.name && !(m.name === bugo.mourner_name && m.relationship === bugo.relationship)) {
                mournersList.push(m);
            }
        });
    }

    // 템플릿 이미지 결정
    const getTemplateImage = () => {
        const templateId = bugo.template_id || 'basic';
        return `/images/template-${templateId}.png`;
    };

    return (
        <main className="view-page">
            {/* 발인 완료 추모 오버레이 */}
            {showMemorialOverlay && (
                <div className="memorial-overlay">
                    <div className="memorial-content">
                        <img src="/images/mourning-ribbon.png" alt="추모" className="memorial-ribbon" />
                        <p className="memorial-message">발인이 끝난 고인입니다.</p>
                        <p className="memorial-sub">삼가 고인의 명복을 빕니다.</p>
                    </div>
                </div>
            )}

            {/* 토스트 */}
            {toastMessage && <div className="toast" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', background: '#000000' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" style={{ marginRight: '8px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>{toastMessage}</div>}

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

            {/* 장례식장 박스 - 일반 장례일 때만, 헤더 바로 아래 */}
            {(!bugo.funeral_type || bugo.funeral_type === '일반 장례') && bugo.funeral_home && (
                <>
                    <div className="funeral-box funeral-box-inline funeral-box-top">
                        <span className="funeral-name">{bugo.funeral_home}</span>
                        {bugo.room_number && (
                            <>
                                <span className="funeral-divider">|</span>
                                <span className="funeral-room">{bugo.room_number}</span>
                            </>
                        )}
                    </div>
                    {/* 구분선 */}
                    <div className="section-divider"></div>
                </>
            )}

            {/* ========================================
                발인 및 장지
            ======================================== */}
            <section className="section">
                <div className="funeral-info-table">
                    {/* 고인 */}
                    <div className="funeral-info-row funeral-highlight">
                        <span className="funeral-info-label">고인</span>
                        <span className="funeral-info-value">故{bugo.deceased_name} {bugo.age ? `(향년 ${bugo.age}세)` : ''}</span>
                    </div>
                    <div className="funeral-info-divider"></div>
                    {bugo.funeral_date && (
                        <div className="funeral-info-row funeral-highlight">
                            <span className="funeral-info-label">발인</span>
                            <span className="funeral-info-value">{formatDate(bugo.funeral_date)} {bugo.funeral_time || ''}</span>
                        </div>
                    )}
                    {bugo.death_date && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">별세</span>
                                <span className="funeral-info-value">{formatDate(bugo.death_date)} {bugo.death_time || ''}</span>
                            </div>
                        </>
                    )}
                    {/* 가족장일 때 빈소 표시 */}
                    {bugo.funeral_type === '가족장' && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">빈소</span>
                                <span className="funeral-info-value">가족의 뜻을 담아 조용히 가족장으로 모십니다.</span>
                            </div>
                        </>
                    )}
                    {/* 무빈소장례일 때 빈소 표시 */}
                    {bugo.funeral_type === '무빈소장례' && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">빈소</span>
                                <span className="funeral-info-value">조용한 배웅으로 빈소를 마련하지 않고 무빈소로 고인을 모십니다.</span>
                            </div>
                        </>
                    )}
                    {/* 장지 - 1개면 단순 표시, 2개면 1차/2차 표시 */}
                    {bugo.burial_place && !bugo.burial_place2 && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">장지</span>
                                <span className="funeral-info-value">{bugo.burial_place}</span>
                            </div>
                        </>
                    )}
                    {bugo.burial_place && bugo.burial_place2 && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row burial-multi">
                                <span className="funeral-info-label">장지</span>
                                <div className="funeral-info-value">
                                    <div>1차 장지 : {bugo.burial_place}</div>
                                    <div>2차 장지 : {bugo.burial_place2}</div>
                                </div>
                            </div>
                        </>
                    )}
                    {bugo.message && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">안내사항</span>
                                <span className="funeral-info-value">{bugo.message}</span>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* 구분선 */}
            <div className="section-divider"></div>

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
                {/* 부고 공유하기 / 부의금 보내기 버튼 - 새 디자인 */}
                {/* 가족장/무빈소장례는 주소가 없으므로 숨김 */}
                {bugo.funeral_type !== '가족장' && bugo.funeral_type !== '무빈소장례' && (() => {
                    const hasAccount = (bugo.account_info && Array.isArray(bugo.account_info) && bugo.account_info.length > 0) ||
                        (bugo.mourners && Array.isArray(bugo.mourners) && bugo.mourners.some((m: any) => m.bank && m.accountNumber));

                    if (hasAccount) {
                        return (
                            <div className="action-bar action-bar-split">
                                <button className="action-bar-btn" onClick={() => setAccountModalOpen(true)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </svg>
                                    <span>부의금보내기</span>
                                </button>
                                <div className="action-bar-divider"></div>
                                <button className="action-bar-btn" onClick={() => setShareModalOpen(true)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                    <span>지인에게 공유하기</span>
                                </button>
                            </div>
                        );
                    } else {
                        return (
                            <div className="action-bar">
                                <button className="action-bar-btn" onClick={() => setShareModalOpen(true)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                    <span>지인에게 공유하기</span>
                                </button>
                            </div>
                        );
                    }
                })()}
            </section>

            {/* ========================================
                빈소 오시는 길 - 일반 장례일 때만 표시
            ======================================== */}
            {(!bugo.funeral_type || bugo.funeral_type === '일반 장례') && (
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

                    {/* 장례식장 전화하기 버튼 */}
                    {bugo.funeral_home_tel && (
                        <a href={`tel:${bugo.funeral_home_tel}`} className="call-funeral-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <div className="call-btn-text">
                                <span className="call-btn-title">장례식장에 전화하기</span>
                                <span className="call-btn-number">{bugo.funeral_home_tel}</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </a>
                    )}
                </section>
            )}

            {/* 계좌 정보는 모달로 표시 */}


            {/* ========================================
                꽃으로 마음을 보내신 분 - 상주가 볼 때는 숨김
            ======================================== */}
            {!isOwner && (
                <section className="section flower-section">
                    <h2 className="section-title">꽃으로 마음을 보내신 분</h2>

                    {/* 보내신 분 리스트 - 추후 DB 연동 */}
                    <div className="flower-list">
                        <div className="flower-empty">
                            <p>아직 보내신 분이 없습니다.</p>
                        </div>
                    </div>
                </section>
            )}


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
                        <button className="share-option" onClick={shareViaBand}>
                            <img src="/images/icon-band.png" alt="밴드" />
                            <span>밴드로 보내기</span>
                        </button>
                        <button className="share-option" onClick={() => copyToClipboard(getCleanShareUrl(), '모바일부고장이 복사되었습니다')}>
                            <img src="/images/icon-link.png" alt="링크" />
                            <span>링크 복사하기</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================
                부의금 계좌 바텀시트 모달
            ======================================== */}
            {accountModalOpen && (
                <div className="account-modal-overlay" onClick={() => setAccountModalOpen(false)}>
                    <div className="account-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-header">
                            <h3>부의금 계좌</h3>
                            <button className="sheet-close" onClick={() => setAccountModalOpen(false)}>✕</button>
                        </div>
                        <div className="account-list">
                            {(() => {
                                const allAccounts: Array<{ bank: string; holder: string; number: string; relationship?: string }> = [];

                                // 대표상주 계좌 (account_info)
                                if (bugo.account_info && Array.isArray(bugo.account_info)) {
                                    bugo.account_info.forEach(acc => {
                                        if (acc.bank && acc.number) {
                                            allAccounts.push({
                                                bank: acc.bank,
                                                holder: acc.holder || bugo.mourner_name || '',
                                                number: acc.number,
                                                relationship: bugo.relationship || '상주'
                                            });
                                        }
                                    });
                                }

                                // 추가 상주들 계좌 (mourners[0] 제외 - 대표상주와 중복 방지)
                                if (bugo.mourners && Array.isArray(bugo.mourners)) {
                                    bugo.mourners.slice(1).forEach((m: any) => {
                                        if (m.bank && m.accountNumber) {
                                            allAccounts.push({
                                                bank: m.bank,
                                                holder: m.accountHolder || m.name || '',
                                                number: m.accountNumber,
                                                relationship: m.relationship || ''
                                            });
                                        }
                                    });
                                }

                                return allAccounts.map((acc, i) => (
                                    <div className="account-row" key={i}>
                                        <div className="account-info">
                                            <span className="account-bank">{acc.bank}</span>
                                            <span className="account-number">{acc.number}</span>
                                            <span className="account-holder">{acc.holder}</span>
                                        </div>
                                        <button className="btn-copy" onClick={() => copyToClipboard(acc.number, '계좌번호가 복사되었습니다', true)}>복사</button>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* 모바일 플로팅 화환 보내기/주문하기 버튼 - 스크롤 시 표시 (상주/발인완료/모달오픈 시 숨김) */}
            {!isOwner && !isFuneralPassed() && !shareModalOpen && !accountModalOpen && (
                <div className={`floating-flower-cta ${showFloatingFlower ? 'show' : 'hide'} ${flowerModalOpen ? 'modal-open' : ''}`}>
                    {/* 돋보기 버튼 - 상세 페이지로 이동 */}
                    <button
                        className={`btn-flower-search-floating ${flowerModalOpen ? 'show' : ''}`}
                        onClick={() => selectedFlower && router.push(`/view/${params.id}/flower/${selectedFlower}`)}
                    >
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    {/* 메인 버튼 - 화환보내기 → 주문하기 */}
                    <button
                        className="btn-floating-flower"
                        onClick={() => {
                            if (flowerModalOpen && selectedFlower) {
                                router.push(`/view/${params.id}/order/${selectedFlower}`);
                            } else {
                                setFlowerModalOpen(true);
                            }
                        }}
                    >
                        {flowerModalOpen ? '주문하기' : '화환 보내기'}
                    </button>
                </div>
            )}

            {/* 화환 주문 바텀시트 모달 */}
            {flowerModalOpen && (
                <div className="flower-modal-overlay" onClick={() => setFlowerModalOpen(false)}>
                    <div className="flower-modal" onClick={(e) => e.stopPropagation()}>
                        {/* 헤더 */}
                        <div className="flower-modal-header">
                            <button className="flower-modal-close" onClick={() => setFlowerModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <h2 className="flower-modal-title">故{bugo?.deceased_name}님</h2>
                            <p className="flower-modal-subtitle">
                                {bugo?.mourners?.[0]?.relationship} {bugo?.mourners?.[0]?.name}님의 {getDeceasedRelation(bugo?.mourners?.[0]?.relationship || '', bugo?.gender || '')} 故{bugo?.deceased_name}님께서<br />
                                {bugo?.death_date?.split('T')[0]?.replace(/-/g, '.')} 별세하셨기에 삼가 알려드립니다
                            </p>
                        </div>

                        {/* 상품 리스트 */}
                        <div className="flower-product-list">
                            {[
                                { id: 1, name: '프리미엄형 화환', desc: '복도에 비치되는 고급근조 3단 특대 형태로 제작됩니다', originalPrice: 150000, price: 120000, image: '/images/flower-wreath.png' },
                                { id: 2, name: '대통령 화환', desc: '복도에 비치되는 고급근조 3단 특대 형태로 제작됩니다', originalPrice: 180000, price: 150000, image: '/images/flower-wreath.png' },
                                { id: 3, name: '스탠다드 화환', desc: '복도에 비치되는 표준형 3단 화환입니다', originalPrice: 120000, price: 100000, image: '/images/flower-wreath.png' },
                                { id: 4, name: '베이직 화환', desc: '간결하면서도 정성이 담긴 기본형 화환입니다', originalPrice: 100000, price: 80000, image: '/images/flower-wreath.png' },
                                { id: 5, name: '고급 근조 화환', desc: '최고급 생화로 제작되는 프리미엄 화환입니다', originalPrice: 200000, price: 170000, image: '/images/flower-wreath.png' },
                            ].map((product) => (
                                <div
                                    key={product.id}
                                    className="flower-product-item"
                                    onClick={() => setSelectedFlower(selectedFlower === product.id ? null : product.id)}
                                >
                                    <div className={`flower-radio ${selectedFlower === product.id ? 'checked' : ''}`} />
                                    <div className="flower-product-image">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <div className="flower-product-info">
                                        <h3 className="flower-product-name">{product.name}</h3>
                                        <p className="flower-product-desc">{product.desc}</p>
                                        <div className="flower-product-price">
                                            <span className="original-price">{product.originalPrice.toLocaleString()}원</span>
                                            <span className="sale-price">{product.price.toLocaleString()}원</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
