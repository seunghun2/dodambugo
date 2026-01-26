'use client';

import { useState } from 'react';
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

interface ThanksContentProps {
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

// 종교별 문구
const messages: Record<ReligionType, { title: string; body: string[] }> = {
    general: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님의 마지막 길에<br/>함께해 주셔서 감사드립니다.',
            '보내주신 따뜻한 마음과 위로가<br/>슬픔 속에서 큰 힘이 되었습니다.',
            '직접 찾아뵙고 인사드려야 하나,<br/>이렇게 글로 먼저 감사의 말씀을 전합니다.',
            '건강하시고 좋은 일만 가득하시기를 기원합니다.',
        ],
    },
    christian: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님의 마지막 길에<br/>함께해 주시고 위로해 주셔서 진심으로 감사드립니다.',
            '보내주신 따뜻한 기도와 위로의 말씀이<br/>주님의 은혜처럼 저희 가족에게 큰 힘이 되었습니다.',
            '이제 주님 품에서 편히 쉬고 계시며,<br/>저희도 믿음 안에서 다시 만날 날을 소망합니다.',
            '주님의 사랑 안에서<br/>늘 축복 가득하시기를 기도드립니다.',
        ],
    },
    catholic: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님을 위해<br/>기도해 주시고 위로해 주셔서 깊이 감사드립니다.',
            '보내주신 따뜻한 위로와 기도가<br/>슬픔을 견디는 데 큰 힘이 되었습니다.',
            '이제 영원한 안식을 누리고 계시며,<br/>저희도 언젠가 다시 만날 날을 기다립니다.',
            '하느님의 은총이<br/>늘 함께하시기를 기도드립니다.',
        ],
    },
    buddhist: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님의 왕생길에<br/>함께해 주시고 명복을 빌어주셔서 깊이 감사드립니다.',
            '보내주신 따뜻한 위로와 독경이<br/>슬픔 속에서 큰 위안이 되었습니다.',
            '이제 극락세계에서 편히 쉬고 계시며,<br/>저희도 인연의 끈으로 다시 만날 날을 기다립니다.',
            '부처님의 가피로<br/>늘 평안하시기를 기원합니다.',
        ],
    },
};

// 탭 목록
const tabs: { key: ReligionType; label: string }[] = [
    { key: 'general', label: '일반' },
    { key: 'christian', label: '기독교' },
    { key: 'catholic', label: '천주교' },
    { key: 'buddhist', label: '불교' },
];

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
        // 이전 형식 (단일 문자열)인 경우 general에 할당
        return { general: thanksMessage };
    }
};

export default function ThanksContent({ bugo, bugoId }: ThanksContentProps) {
    const router = useRouter();
    // thanks_religion이 저장되어 있으면 그걸 사용, 없으면 기존 religion 사용
    const initialReligion = (bugo as any).thanks_religion || getReligionType(bugo.religion);
    const [activeTab, setActiveTab] = useState<ReligionType>(initialReligion);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [customMessages, setCustomMessages] = useState<ThanksMessages>(parseCustomMessages(bugo.thanks_message));
    const [editingMessage, setEditingMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 탭 변경 시 DB에 저장
    const handleTabChange = async (tab: ReligionType) => {
        setActiveTab(tab);

        // 백그라운드에서 저장
        try {
            await fetch(`/api/bugo/${bugo.id}/thanks-religion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ religion: tab }),
            });
        } catch (error) {
            console.error('종교 저장 실패:', error);
        }
    };

    // 공유 URL (card 페이지로 - DB의 thanks_religion 사용)
    const getShareUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/view/${bugoId}/thanks/card`;
        }
        return '';
    };

    // 카카오 공유
    const shareKakao = () => {
        const shareUrl = getShareUrl();
        // 동적 OG 이미지 URL
        const ogImageUrl = `https://maeumbugo.co.kr/api/og/thanks/${bugoId}`;

        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;
            if (!Kakao.isInitialized()) {
                Kakao.init('5aa868e69d68e913ed9da7c3def45151');
            }
            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: '삼가 감사 인사 드립니다',
                    description: `故 ${bugo.deceased_name}님의 마지막 가시는 길을 함께해 주셔서\n진심으로 감사드립니다.`,
                    imageUrl: ogImageUrl,
                    link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
                },
                buttons: [{ title: '답례글 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }]
            });
        }
        setIsShareModalOpen(false);
    };

    // SMS 공유
    const shareSMS = () => {
        const shareUrl = getShareUrl();
        const mournerName = bugo.mourner_name || '상주';
        const text = `[감사 인사]

故 ${bugo.deceased_name}님의 마지막 길을 함께해 주셔서 진심으로 감사드립니다.

보내주신 따뜻한 위로가 저희 가족에게 큰 힘이 되었습니다.

아래 링크를 통해 감사장을 확인해 주세요.

${shareUrl}

${mournerName} 배상`;
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
        setIsShareModalOpen(false);
    };

    // 밴드 공유
    const shareBand = () => {
        const shareUrl = getShareUrl();
        const title = `[감사장] 故 ${bugo.deceased_name || ''} 감사장`;
        const content = `故 ${bugo.deceased_name || ''} 님의 감사장입니다.`;
        const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(title + '\n' + content)}&route=${encodeURIComponent(shareUrl)}`;
        window.open(bandUrl, '_blank', 'width=500,height=700');
        setIsShareModalOpen(false);
    };

    // 링크 복사
    const copyLink = () => {
        navigator.clipboard.writeText(getShareUrl()).then(() => {
            alert('링크가 복사되었습니다.');
        });
        setIsShareModalOpen(false);
    };

    // 날짜 포맷
    const formatDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일`;
    };

    // 문구에서 {deceased} 치환
    const replaceDeceased = (text: string) => {
        return text.replace('{deceased}', bugo.deceased_name || '고인');
    };

    const currentMessage = messages[activeTab];
    const currentCustomMessage = customMessages[activeTab];

    // 기본 메시지를 텍스트로 변환
    const getDefaultMessageText = () => {
        return currentMessage.body
            .map(t => replaceDeceased(t).replace(/<br\/?>/g, '\n'))
            .join('\n\n');
    };

    // 편집 모달 열기
    const openEditModal = () => {
        setEditingMessage(currentCustomMessage || getDefaultMessageText());
        setIsEditModalOpen(true);
    };

    // 메시지 저장 (Optimistic Update)
    const handleSaveMessage = async () => {
        const updatedMessages = {
            ...customMessages,
            [activeTab]: editingMessage,
        };

        // 즉시 UI 업데이트
        setCustomMessages(updatedMessages);
        setIsEditModalOpen(false);

        // 백그라운드에서 저장
        try {
            await fetch(`/api/bugo/${bugo.id}/thanks-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: updatedMessages }),
            });
        } catch (error) {
            console.error('저장 실패:', error);
        }
    };

    return (
        <div className="thanks-page">
            {/* 탭 네비게이션 */}
            <div className="thanks-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`thanks-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 배경 이미지 (탭 아래 전체) */}
            <div className="thanks-bg">
                <Image
                    src={symbolImages[activeTab]}
                    alt=""
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                    priority
                />
            </div>

            {/* 컨텐츠 */}
            <div className="thanks-content">
                {/* 메시지 카드 */}
                <div className="thanks-card">
                    <h1 className="thanks-title">{currentMessage.title}</h1>

                    <div className="thanks-body">
                        {currentCustomMessage ? (
                            currentCustomMessage.split('\n\n').map((paragraph, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br/>') || '&nbsp;' }} />
                            ))
                        ) : (
                            currentMessage.body.map((text, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: replaceDeceased(text) }} />
                            ))
                        )}
                    </div>

                    <div className="thanks-footer">
                        <p className="thanks-date">{formatDate()}</p>
                        <p className="thanks-mourner">{bugo.mourner_name || '상주'} 배상</p>
                    </div>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="thanks-bottom">
                <button
                    className="thanks-edit-btn-bottom"
                    onClick={openEditModal}
                >
                    문구 수정
                </button>
                <button
                    className="thanks-cta-btn"
                    onClick={() => setIsShareModalOpen(true)}
                >
                    감사장 전달하기
                </button>
            </div>

            {/* 편집 모달 */}
            {isEditModalOpen && (
                <div className="thanks-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="thanks-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="thanks-modal-header">
                            <h2>감사장 문구 수정</h2>
                            <button className="thanks-modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
                        </div>
                        <div className="thanks-modal-body">
                            <textarea
                                value={editingMessage}
                                onChange={(e) => {
                                    const lines = e.target.value.split('\n');
                                    if (lines.length <= 14) {
                                        setEditingMessage(e.target.value);
                                    }
                                }}
                                placeholder="감사 인사 문구를 입력하세요..."
                                rows={14}
                            />
                        </div>
                        <div className="thanks-modal-footer">
                            <button
                                className="thanks-modal-cancel"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                취소
                            </button>
                            <button
                                className="thanks-modal-save"
                                onClick={handleSaveMessage}
                                disabled={isSaving}
                            >
                                {isSaving ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 공유 모달 - ViewContent 스타일 */}
            {isShareModalOpen && (
                <div className="share-modal">
                    <div className="share-overlay" onClick={() => setIsShareModalOpen(false)}></div>
                    <div className="share-content">
                        <div className="share-header">
                            <h3>공유하기</h3>
                            <button className="share-close" onClick={() => setIsShareModalOpen(false)}>✕</button>
                        </div>
                        <button className="share-option" onClick={shareKakao}>
                            <Image src="/images/icon-kakao.png" alt="카카오톡" width={32} height={32} />
                            <span>카카오톡으로 보내기</span>
                        </button>
                        <button className="share-option" onClick={shareSMS}>
                            <Image src="/images/icon-message.png" alt="메세지" width={32} height={32} />
                            <span>메세지로 보내기</span>
                        </button>
                        <button className="share-option" onClick={shareBand}>
                            <Image src="/images/icon-band.png" alt="밴드" width={32} height={32} />
                            <span>밴드로 보내기</span>
                        </button>
                        <button className="share-option" onClick={copyLink}>
                            <Image src="/images/icon-link.png" alt="링크" width={32} height={32} />
                            <span>링크 복사하기</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
