'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
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

    const bugoUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/view/${params.bugoNumber}`
        : `/view/${params.bugoNumber}`;

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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareKakao = () => {
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;
            if (!Kakao.isInitialized()) {
                Kakao.init('e089c191f6b67a3b7a05531e949eea8d');
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
            const kakaoTitle = `故 ${bugo?.deceased_name}님 부고${ageText}`;
            const kakaoDesc = bugo?.funeral_home
                ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''} | ${formatKakaoDate()} 별세하셨음을 삼가 알려드립니다.`
                : `${formatKakaoDate()} 별세하셨음을 삼가 알려드립니다.`;

            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: kakaoTitle,
                    description: kakaoDesc,
                    imageUrl: 'https://dodambugo.com/og-bugo-v4.png',
                    link: { mobileWebUrl: bugoUrl, webUrl: bugoUrl }
                },
                buttons: [{ title: '부고 확인하기', link: { mobileWebUrl: bugoUrl, webUrl: bugoUrl } }]
            });
        } else {
            navigator.clipboard.writeText(bugoUrl);
            setToast('링크가 복사되었습니다');
            setTimeout(() => setToast(null), 2500);
        }
    };

    const shareSms = () => {
        const text = `[부고] 故${bugo?.deceased_name || ''}님의 부고장입니다.\n\n장례식장: ${bugo?.funeral_home || ''}\n발인일: ${formatDate(bugo?.funeral_date, bugo?.funeral_time)}\n\n부고장 보기: ${bugoUrl}`;
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

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(bugoUrl)}`;

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
                        <span className="material-symbols-outlined">edit</span>
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
                                <img src={qrCodeUrl} alt="QR 코드" className="qr-image" />
                            </div>
                            <span className="share-label">모바일부고장 보기</span>
                        </div>

                        {/* 카카오톡 */}
                        <div className="share-card" onClick={shareKakao}>
                            <div className="share-icon-wrapper">
                                <img src="/images/icon-kakao.png" alt="카카오톡" className="share-icon-img" />
                            </div>
                            <span className="share-label">카카오톡으로 보내기</span>
                        </div>

                        {/* 문자 */}
                        <div className="share-card" onClick={shareSms}>
                            <div className="share-icon-wrapper">
                                <img src="/images/icon-sms.png" alt="문자" className="share-icon-img" />
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
            </main>
        </div>
    );
}
