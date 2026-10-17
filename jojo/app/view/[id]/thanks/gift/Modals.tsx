'use client';

import { useState } from 'react';
import { CARD_OPTIONS, type CardId } from '@/lib/gift/thanks-messages';
import { ProductThumb } from './ProductPicker';
import { won, type GiftProduct } from './types';

export type Align = 'left' | 'center' | 'right';

// 카카오 JS SDK 중 공유에 쓰는 부분만 (SDK 는 전역 스크립트로 로드됨)
interface KakaoSdk {
    isInitialized(): boolean;
    cleanup(): void;
    init(key: string): void;
    Share: { sendDefault(options: unknown): void };
}

// ---------------------------------------------------------------------------
// 상주 확인 (이름 + 연락처 뒷 4자리) — 조의금/화환 목록, 결제에 필요
// ---------------------------------------------------------------------------
export function AuthModal({
    bugoId,
    defaultName,
    onSuccess,
    onClose,
}: {
    bugoId: string;
    defaultName: string;
    onSuccess: () => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(defaultName);
    const [last4, setLast4] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (busy) return;
        if (!name.trim() || last4.length !== 4) return setError('이름과 연락처 뒷 4자리를 입력해주세요.');
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/gift/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bugoId, name: name.trim(), last4 }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error || '확인에 실패했습니다.');
            onSuccess();
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="gs-overlay gs-center-wrap" onClick={onClose}>
            <div className="gs-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="상주 확인">
                <h3 className="gs-h3">상주 확인</h3>
                <p className="gs-hint">받는 분 연락처와 조의금 내역은 상주 본인만 볼 수 있어요. 부고 신청 시 입력하신 정보로 확인합니다.</p>
                <label className="gs-field">
                    이름
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="상주 이름" maxLength={20} />
                </label>
                <label className="gs-field">
                    연락처 뒷 4자리
                    <input
                        value={last4}
                        onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        placeholder="0000"
                        maxLength={4}
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                    />
                </label>
                {error && <p className="gs-error">{error}</p>}
                <div className="gs-dialog-btns">
                    <button className="gs-btn-light" onClick={onClose}>
                        취소
                    </button>
                    <button className="gs-btn-dark" onClick={submit} disabled={busy}>
                        {busy ? '확인 중…' : '확인'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// 미리보기 — 조문객이 받게 될 화면 (카드 + 문구 [+ 답례품])
// ---------------------------------------------------------------------------
export function PreviewModal({
    cardId,
    message,
    hideMessage,
    align,
    mournerName,
    product,
    onClose,
}: {
    cardId: CardId;
    message: string;
    hideMessage: boolean;
    align: Align;
    mournerName: string;
    product: GiftProduct | null; // null 이면 카드만 보기
    onClose: () => void;
}) {
    const card = CARD_OPTIONS.find((c) => c.id === cardId);
    const today = new Date();
    const dateText = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;

    return (
        <div className="gs-overlay gs-fullscreen gs-preview-wrap" role="dialog" aria-modal="true" aria-label="미리보기">
            <header className="gs-picker-header">
                <button className="gs-icon-btn" onClick={onClose} aria-label="닫기">
                    ✕
                </button>
                <h2>미리보기</h2>
                <span className="gs-header-spacer" />
            </header>
            <div className="gs-preview-body">
                <div className="gs-preview-card" style={card?.image ? { backgroundImage: `url(${card.image})` } : undefined}>
                    <div className="gs-preview-inner">
                        <h4>삼가 감사 인사 드립니다</h4>
                        {!hideMessage && (
                            <div className="gs-preview-text" style={{ textAlign: align }}>
                                {message.split('\n').map((line, i) => (
                                    <p key={i}>{line || '\u00A0'}</p>
                                ))}
                            </div>
                        )}
                        <p className="gs-preview-sign">
                            {dateText}
                            <br />
                            {mournerName || '상주'} 배상
                        </p>
                    </div>
                </div>

                {product && (
                    <div className="gs-preview-gift">
                        <p className="gs-preview-gift-title">감사의 마음을 담은 답례품이 도착했어요</p>
                        <ProductThumb product={product} />
                        <p className="gs-card-name">
                            [{product.brand}] {product.name}
                        </p>
                        <p className="gs-hint">받는 분께는 모바일 쿠폰(MMS/알림톡)으로 전달됩니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// 카드만 공유 (기존 감사장 공유 방식과 동일: 카카오 / 문자 / 밴드 / 링크 복사)
// ---------------------------------------------------------------------------
export function ShareSheet({
    shareUrl,
    deceasedName,
    mournerName,
    onClose,
    notify,
}: {
    shareUrl: string;
    deceasedName: string;
    mournerName: string;
    onClose: () => void;
    notify: (m: string) => void;
}) {
    const kakao = () => {
        const K = (window as unknown as { Kakao?: KakaoSdk }).Kakao;
        if (!K) {
            notify('카카오톡 공유를 사용할 수 없습니다. 링크 복사를 이용해주세요.');
            return;
        }
        if (K.isInitialized()) {
            try {
                K.cleanup();
            } catch {}
        }
        K.init('5aa868e69d68e913ed9da7c3def45151');
        K.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: `故${deceasedName}님 감사장`,
                description: '감사의 마음을 전합니다.',
                imageUrl: 'https://maeumbugo.co.kr/og-bugo-v3.png',
                link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
            },
            buttons: [{ title: '감사장 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
        });
        onClose();
    };
    const sms = () => {
        const text = `[감사 인사]\n\n故 ${deceasedName}님의 마지막 길을 함께해 주셔서 진심으로 감사드립니다.\n\n보내주신 따뜻한 위로가 저희 가족에게 큰 힘이 되었습니다.\n\n아래 링크를 통해 감사장을 확인해 주세요.\n\n${shareUrl}\n\n${mournerName || '상주'} 배상`;
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
        onClose();
    };
    const band = () => {
        const title = `[감사장] 故 ${deceasedName} 감사장`;
        const content = `故 ${deceasedName} 님의 감사장입니다.`;
        window.open(
            `https://band.us/plugin/share?body=${encodeURIComponent(title + '\n' + content)}&route=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=500,height=700'
        );
        onClose();
    };
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            notify('링크가 복사되었습니다.');
        } catch {
            notify('링크 복사에 실패했습니다.');
        }
        onClose();
    };

    return (
        <div className="gs-overlay gs-sheet-wrap" onClick={onClose}>
            <div className="gs-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="공유하기">
                <div className="gs-row-between">
                    <h3 className="gs-h3">공유하기</h3>
                    <button className="gs-icon-btn" onClick={onClose} aria-label="닫기">
                        ✕
                    </button>
                </div>
                <button className="gs-share-opt" onClick={kakao}>
                    카카오톡으로 보내기
                </button>
                <button className="gs-share-opt" onClick={sms}>
                    메세지로 보내기
                </button>
                <button className="gs-share-opt" onClick={band}>
                    밴드로 보내기
                </button>
                <button className="gs-share-opt" onClick={copy}>
                    링크 복사하기
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// 결제 확인 / 완료 안내
// ---------------------------------------------------------------------------
export function ConfirmModal({
    product,
    count,
    isTest,
    hasRefs,
    busy,
    onConfirm,
    onClose,
}: {
    product: GiftProduct;
    count: number;
    isTest: boolean;
    hasRefs: boolean;
    busy: boolean;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <div className="gs-overlay gs-center-wrap" onClick={busy ? undefined : onClose}>
            <div className="gs-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="주문 확인">
                <h3 className="gs-h3">답례품 주문 확인</h3>
                <p className="gs-confirm-line">
                    [{product.brand}] {product.name}
                </p>
                <p className="gs-confirm-line">
                    {count}명 × {won(product.sale_price)} = <strong>{won(product.sale_price * count)}</strong>
                </p>
                {hasRefs && <p className="gs-hint">조의금/화환 목록과 번호가 겹치는 분은 주문 시 한 번만 포함되어 금액이 줄 수 있어요.</p>}
                {isTest && <p className="gs-test-note">테스트 모드입니다. 실제 결제와 발송은 이루어지지 않습니다.</p>}
                <div className="gs-dialog-btns">
                    <button className="gs-btn-light" onClick={onClose} disabled={busy}>
                        취소
                    </button>
                    <button className="gs-btn-dark" onClick={onConfirm} disabled={busy}>
                        {busy ? '처리 중…' : isTest ? '테스트 주문하기' : '결제하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DoneModal({
    orderNumber,
    count,
    total,
    isTest,
    onClose,
}: {
    orderNumber: string;
    count: number;
    total: number;
    isTest: boolean;
    onClose: () => void;
}) {
    return (
        <div className="gs-overlay gs-center-wrap" onClick={onClose}>
            <div className="gs-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="주문 완료">
                <h3 className="gs-h3">{isTest ? '테스트 주문이 접수되었습니다' : '주문이 접수되었습니다'}</h3>
                <p className="gs-confirm-line">
                    {count}명 · {won(total)}
                </p>
                <p className="gs-hint">주문번호 {orderNumber}</p>
                {isTest && <p className="gs-test-note">실제 결제·발송은 이루어지지 않았습니다.</p>}
                <div className="gs-dialog-btns">
                    <button className="gs-btn-dark" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
