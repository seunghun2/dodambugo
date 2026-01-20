'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import './share.css';

export default function ThanksSharePage() {
    const params = useParams();
    const bugoId = params.id as string;

    // 현재 URL
    const getShareUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/view/${bugoId}/thanks`;
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
                    imageUrl: `${window.location.origin}/images/thanks/thanks-general.jpg`,
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

    return (
        <div className="share-page">
            {/* 헤더 */}
            <header className="share-header">
                <Link href={`/view/${bugoId}/thanks`} className="share-back">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </Link>
                <h1 className="share-title">감사장 전달하기</h1>
                <div style={{ width: 24 }}></div>
            </header>

            {/* 공유 옵션 */}
            <div className="share-content">
                <p className="share-description">
                    감사장을 전달할 방법을<br />선택해 주세요.
                </p>

                <div className="share-buttons">
                    <button className="share-btn share-kakao" onClick={shareKakao}>
                        <Image src="/images/icon-kakao.png" alt="카카오톡" width={48} height={48} />
                        <span>카카오톡</span>
                    </button>

                    <button className="share-btn share-sms" onClick={shareSMS}>
                        <Image src="/images/icon-message.png" alt="메세지" width={48} height={48} />
                        <span>메세지</span>
                    </button>

                    <button className="share-btn share-link" onClick={copyLink}>
                        <Image src="/images/icon-link.png" alt="주소복사" width={48} height={48} />
                        <span>주소복사</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
