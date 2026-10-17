'use client';

import { Fragment, useState } from 'react';
import { CARD_OPTIONS, type CardId } from '@/lib/gift/thanks-messages';
import { won, type GiftProduct } from './types';


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
// 미리보기 — 받는 분이 보게 될 감사장 카드.
//  기존 감사장 화면(thanks)과 같은 구조/치수: 카드 좌우 20px 안쪽, 안쪽 여백 200px 20px 80px, 배경 이미지 위에 글씨만.
//  상품은 보여주지 않는다(쿠폰은 별도로 자동 발송).
// ---------------------------------------------------------------------------
export function PreviewModal({
    cardId,
    message,
    mournerName,
    onClose,
}: {
    cardId: CardId;
    message: string;
    mournerName: string;
    onClose: () => void;
}) {
    const card = CARD_OPTIONS.find((c) => c.id === cardId);
    const today = new Date();
    const dateText = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;

    return (
        <div className="gs-overlay gs-pv" role="dialog" aria-modal="true" aria-label="미리보기">
            <header className="gs-header">
                <button className="gs-icon-btn" onClick={onClose} aria-label="닫기">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>미리보기</h1>
                <span className="gs-header-spacer" />
            </header>
            <div className="gs-pv-wrap" style={card?.image ? { backgroundImage: `url(${card.image})` } : undefined}>
                <div className="gs-pv-content">
                    <div className="gs-pv-card">
                        <h2 className="gs-pv-title">삼가 감사 인사 드립니다</h2>
                        <div className="gs-pv-body">
                            {message.split('\n\n').map((para, i) => (
                                <p key={i}>
                                    {para.split('\n').map((line, j, arr) => (
                                        <Fragment key={j}>
                                            {line || '\u00A0'}
                                            {j < arr.length - 1 && <br />}
                                        </Fragment>
                                    ))}
                                </p>
                            ))}
                        </div>
                        <div className="gs-pv-foot">
                            <p>{dateText}</p>
                            <strong>{mournerName || '상주'} 배상</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div className="gs-bottom">
                <button className="gs-bottom-cta" onClick={onClose}>
                    닫기
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
                <p className="gs-hint">결제 완료 10분 후 감사장과 모바일 쿠폰이 함께 발송됩니다. (10분 이내 취소 가능)</p>
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
                <p className="gs-hint">결제 후 10분 뒤 감사장과 모바일 쿠폰이 자동 발송됩니다.</p>
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
