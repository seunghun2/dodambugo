'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CareContentProps {
    bugoId: string;
    deceasedName?: string;
    mournerName?: string;
}

export default function CareContent({ bugoId, deceasedName }: CareContentProps) {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);

    const phoneUrl = process.env.NEXT_PUBLIC_BGZT_PHONE_URL || '';
    const consignUrl = process.env.NEXT_PUBLIC_BGZT_CONSIGN_URL || '';

    const handleApply = (type: 'phone' | 'consign') => {
        const target = type === 'phone' ? phoneUrl : consignUrl;
        if (target) {
            const sep = target.includes('?') ? '&' : '?';
            window.location.href = `${target}${sep}utm_source=maeumbugo&utm_medium=care&utm_content=${type}&bugo_id=${encodeURIComponent(bugoId)}`;
            return;
        }
        setModalOpen(true);
    };

    return (
        <div className="care-page">
            <header className="care-header">
                <span className="care-badge">장례 후 사후 정리 지원 안내</span>
                <h1 className="care-title">
                    {deceasedName ? `故 ${deceasedName}님 장례 이후` : '장례 이후'}
                    <br />
                    유품 및 디지털 기기 정리 안내
                </h1>
                <p className="care-subtitle">
                    경황이 없으신 유가족분들을 위해 휴대폰 개인정보 완전 삭제와
                    유품 수거·정리 절차를 안내해 드립니다.
                </p>
            </header>

            <main className="care-container">
                {/* 1. 디지털 기기 데이터 삭제 및 정리 */}
                <section className="care-card">
                    <span className="care-card-tag">디지털 기기 안심 정리</span>
                    <h2 className="care-card-title">휴대폰·태블릿 데이터 완전 삭제 및 정리</h2>
                    <p className="care-card-desc">
                        고인의 휴대폰 속 개인정보·사진·금융 정보가 외부로 유출되지 않도록
                        복구 불가능한 수준으로 완전 삭제하고 삭제 인증 보고서를 발급해 드립니다.
                    </p>

                    <ul className="care-point-list">
                        <li>
                            <span className="care-point-dot">•</span>
                            <span><strong>과학기술정보통신부 인증</strong> 중고 단말 안심거래 기준 데이터 완전 삭제</span>
                        </li>
                        <li>
                            <span className="care-point-dot">•</span>
                            <span>비대면 택배 회수 후 <strong>데이터 삭제·검수 완료 보고서</strong> 개별 발송</span>
                        </li>
                        <li>
                            <span className="care-point-dot">•</span>
                            <span>검수 후 기기 가치 산정 및 유가족 지정 계좌 정산 (정리 불가 구형 기기는 안전 반환)</span>
                        </li>
                    </ul>

                    <div className="care-steps">
                        <div className="care-step">
                            <span className="care-step-num">STEP 1</span>
                            <span className="care-step-label">온라인 신청</span>
                        </div>
                        <div className="care-step">
                            <span className="care-step-num">STEP 2</span>
                            <span className="care-step-label">택배 회수</span>
                        </div>
                        <div className="care-step">
                            <span className="care-step-num">STEP 3</span>
                            <span className="care-step-label">완전 삭제</span>
                        </div>
                        <div className="care-step">
                            <span className="care-step-num">STEP 4</span>
                            <span className="care-step-label">보고서·정산</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="care-btn"
                        onClick={() => handleApply('phone')}
                    >
                        휴대폰·태블릿 정리 안내 및 신청
                    </button>
                </section>

                {/* 2. 유품 위탁 정리 */}
                <section className="care-card">
                    <span className="care-card-tag consign">유품 수거·위탁 정리</span>
                    <h2 className="care-card-title">의류·가방·시계·잡화 위탁 정리</h2>
                    <p className="care-card-desc">
                        정리 기한이 짧아 일일이 분류하기 어려운 의류·신발·가방·명품 등을
                        전용 가방에 담아 두시면 수거부터 검수·정산·기부 연결까지 대행합니다.
                    </p>

                    <ul className="care-point-list">
                        <li>
                            <span className="care-point-dot">•</span>
                            <span><strong>전용 수거 가방 발송</strong> — 유가족은 물품을 담아 두기만 하면 비대면 수거 진행</span>
                        </li>
                        <li>
                            <span className="care-point-dot">•</span>
                            <span>유가족 정보 및 물품 출처 비공개 원칙으로 안전하게 위탁 정리 진행</span>
                        </li>
                        <li>
                            <span className="care-point-dot">•</span>
                            <span>정리되지 않은 물품은 유가족 선택에 따라 반환 또는 <strong>아름다운가게 기부(기부금영수증 발급)</strong> 연결</span>
                        </li>
                    </ul>

                    <div className="care-steps">
                        <div className="care-step">
                            <span className="care-step-num">STEP 1</span>
                            <span className="care-step-label">수거 신청</span>
                        </div>
                        <div className="care-step">
                            <span className="care-step-num">STEP 2</span>
                            <span className="care-step-label">가방 수거</span>
                        </div>
                        <div className="care-step">
                            <span className="care-step-num">STEP 3</span>
                            <span className="care-step-label">분류·검수</span>
                        </div>
                        <div className="care-step">
                            <span className="care-step-num">STEP 4</span>
                            <span className="care-step-label">정산·기부</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="care-btn secondary"
                        onClick={() => handleApply('consign')}
                    >
                        유품 위탁 정리 안내 및 신청
                    </button>
                </section>

                {/* 3. 신청 전 유의사항 */}
                <aside className="care-notice">
                    <strong>신청 전 확인사항</strong>
                    <ul>
                        <li>물품 및 기기 처분 권한이 있는 대표 상주(또는 유족 간 협의가 완료된 대표자)께서 신청해 주세요.</li>
                        <li>가구 및 대형 가전은 위탁 수거 대상에서 제외됩니다.</li>
                        <li>상속포기 또는 한정승인을 고려 중이신 경우, 고인의 유품·기기 처분이 법적 단순승인 사유에 해당할 수 있으므로 신청 전 법률 전문가와 먼저 상의해 주시기 바랍니다.</li>
                    </ul>
                </aside>

                <div className="care-back-wrap">
                    <button
                        type="button"
                        className="care-back-btn"
                        onClick={() => router.push(`/view/${bugoId}/thanks`)}
                    >
                        ← 조문 감사장 페이지로 돌아가기
                    </button>
                </div>
            </main>

            {modalOpen && (
                <div className="care-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="care-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>전용 접수 창구 연결 준비 중</h3>
                        <p>
                            현재 제휴 전담 접수 페이지 점검 중입니다.
                            빠른 안내가 필요하신 경우 마음부고 고객센터(010-4837-5076)로 문의해 주시면 즉시 안내해 드리겠습니다.
                        </p>
                        <button
                            type="button"
                            className="care-modal-close"
                            onClick={() => setModalOpen(false)}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
