'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ReligionType = 'general' | 'christian' | 'catholic' | 'buddhist';

interface ThanksMessages {
    general?: string;
    christian?: string;
    catholic?: string;
    buddhist?: string;
}

interface BugoData {
    id: string;
    deceased_name: string;
    mourner_name?: string;
    religion?: string;
    funeral_date?: string;
    thanks_message?: string | ThanksMessages;
}

interface ShareContentProps {
    bugo: BugoData;
    bugoId: string;
}

// 종교별 심볼 이미지
const symbolImages: Record<ReligionType, string> = {
    general: '/images/thanks/thanks-general.jpg',
    christian: '/images/thanks/thanks-christian.jpg',
    catholic: '/images/thanks/thanks-catholic.jpg',
    buddhist: '/images/thanks/thanks-buddhist.jpg',
};

// 종교별 기본 문구
const defaultMessages: Record<ReligionType, string[]> = {
    general: [
        '귀한 시간 내시어 故{deceased}님의 마지막 길에\n함께해 주셔서 감사드립니다.',
        '보내주신 따뜻한 마음과 위로가\n슬픔 속에서 큰 힘이 되었습니다.',
        '직접 찾아뵙고 인사드려야 하나,\n이렇게 글로 먼저 감사의 말씀을 전합니다.',
        '건강하시고 좋은 일만 가득하시기를 기원합니다.',
    ],
    christian: [
        '귀한 시간 내시어 故{deceased}님의 마지막 길에\n함께해 주시고 위로해 주셔서 진심으로 감사드립니다.',
        '보내주신 따뜻한 기도와 위로의 말씀이\n주님의 은혜처럼 저희 가족에게 큰 힘이 되었습니다.',
        '이제 주님 품에서 편히 쉬고 계시며,\n저희도 믿음 안에서 다시 만날 날을 소망합니다.',
        '주님의 사랑 안에서\n늘 축복 가득하시기를 기도드립니다.',
    ],
    catholic: [
        '귀한 시간 내시어 故{deceased}님을 위해\n기도해 주시고 위로해 주셔서 깊이 감사드립니다.',
        '보내주신 따뜻한 위로와 기도가\n슬픔을 견디는 데 큰 힘이 되었습니다.',
        '이제 영원한 안식을 누리고 계시며,\n저희도 언젠가 다시 만날 날을 기다립니다.',
        '하느님의 은총이\n늘 함께하시기를 기도드립니다.',
    ],
    buddhist: [
        '귀한 시간 내시어 故{deceased}님의 왕생길에\n함께해 주시고 명복을 빌어주셔서 깊이 감사드립니다.',
        '보내주신 따뜻한 위로와 독경이\n슬픔 속에서 큰 위안이 되었습니다.',
        '이제 극락세계에서 편히 쉬고 계시며,\n저희도 인연의 끈으로 다시 만날 날을 기다립니다.',
        '부처님의 가피로\n늘 평안하시기를 기원합니다.',
    ],
};

// 종교 매핑
const getReligionType = (religion?: string): ReligionType => {
    if (religion === '기독교') return 'christian';
    if (religion === '천주교') return 'catholic';
    if (religion === '불교') return 'buddhist';
    return 'general';
};

// thanks_message 파싱
const parseCustomMessages = (thanksMessage: string | ThanksMessages | undefined): ThanksMessages => {
    if (!thanksMessage) return {};
    if (typeof thanksMessage === 'object') return thanksMessage;
    try {
        return JSON.parse(thanksMessage);
    } catch {
        return { general: thanksMessage };
    }
};

export default function ShareContent({ bugo, bugoId }: ShareContentProps) {
    const router = useRouter();
    const religionType = getReligionType(bugo.religion);
    const customMessages = parseCustomMessages(bugo.thanks_message);
    const customMessage = customMessages[religionType];
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDateStr(`${year}년 ${month}월 ${day}일`);
    }, []);

    // 문구 치환
    const replaceDeceased = (text: string) => {
        return text.replace('{deceased}', bugo.deceased_name || '고인');
    };

    // 표시할 메시지
    const getDisplayMessage = () => {
        if (customMessage) {
            return customMessage.split('\n\n').map(p => p.replace(/\n/g, '<br/>'));
        }
        return defaultMessages[religionType].map(t => replaceDeceased(t).replace(/\n/g, '<br/>'));
    };

    // 공유 URL (공개용 카드 페이지)
    const getShareUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/view/${bugoId}/thanks/card`;
        }
        return '';
    };

    // 카카오톡 공유
    const shareKakao = () => {
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;
            if (!Kakao.isInitialized()) {
                Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
            }
            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: '감사 인사',
                    description: '삼가 감사인사 올립니다.',
                    imageUrl: `${window.location.origin}${symbolImages[religionType]}`,
                    link: {
                        mobileWebUrl: getShareUrl(),
                        webUrl: getShareUrl(),
                    },
                },
                buttons: [
                    {
                        title: '감사장 보기',
                        link: {
                            mobileWebUrl: getShareUrl(),
                            webUrl: getShareUrl(),
                        },
                    },
                ],
            });
        }
    };

    // SMS 공유
    const shareSMS = () => {
        const message = `삼가 감사인사 올립니다.\n${getShareUrl()}`;
        window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    };

    // 링크 복사
    const copyLink = () => {
        navigator.clipboard.writeText(getShareUrl()).then(() => {
            alert('링크가 복사되었습니다.');
        });
    };

    const displayMessage = getDisplayMessage();

    return (
        <div className="share-page">
            {/* 미리보기 카드 */}
            <div className="share-preview">
                <div className="share-preview-card">
                    {/* 수정하기 버튼 */}
                    <button
                        className="share-edit-pill"
                        onClick={() => router.push(`/view/${bugoId}/thanks`)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        수정하기
                    </button>

                    {/* 배경 이미지 */}
                    <div className="share-card-bg">
                        <Image
                            src={symbolImages[religionType]}
                            alt=""
                            fill
                            style={{ objectFit: 'cover', objectPosition: 'top' }}
                        />
                    </div>

                    {/* 카드 내용 */}
                    <div className="share-card-content">
                        <h2 className="share-card-title">삼가 감사 인사 드립니다</h2>

                        <div className="share-card-body">
                            {displayMessage.map((text, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: text }} />
                            ))}
                        </div>

                        <div className="share-card-footer">
                            <p className="share-card-date">{dateStr}</p>
                            <p className="share-card-mourner">{bugo.mourner_name || '상주'} 배상</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 고정 공유 바 */}
            <div className="share-bottom-bar">
                <div className="share-bottom-label">
                    감사장 공유하기
                </div>
                <div className="share-bottom-buttons">
                    <button className="share-bottom-btn" onClick={shareKakao}>
                        <Image src="/images/icon-kakao.png" alt="카카오톡" width={44} height={44} />
                        <span>카카오톡</span>
                    </button>

                    <button className="share-bottom-btn" onClick={shareSMS}>
                        <Image src="/images/icon-message.png" alt="메세지" width={44} height={44} />
                        <span>메세지</span>
                    </button>

                    <button className="share-bottom-btn" onClick={copyLink}>
                        <Image src="/images/icon-link.png" alt="주소복사" width={44} height={44} />
                        <span>주소복사</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
