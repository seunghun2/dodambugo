'use client';

import Link from 'next/link';

export default function CondolenceRefundPage() {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <Link href="/" className="back-btn" style={{ textDecoration: 'none' }}>
                    <span className="material-symbols-outlined">chevron_left</span>
                </Link>
                <h1>부의금 결제 환불 정책</h1>
            </header>

            <main className="legal-content">
                <section className="terms-section">
                    <h2>제 1조 (약관의 목적)</h2>
                    <p>
                        이 약관은 마음부고가 운영하는 온라인 부의금 카드결제 서비스 이용과 관련하여,
                        환불이 제한되는 사유와 이용자의 권리·의무에 관한 사항을 정하는 것을 목적으로 합니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>제 2조 (환불 제한 사유)</h2>

                    <h3>① 즉시 정산 특성</h3>
                    <p>본 서비스를 통해 결제된 부의금은 결제 완료와 동시에 유족(상주)에게 정산 처리됩니다.
                        이미 정산이 완료된 금액은 마음부고의 관리 범위를 벗어나므로 취소나 환불이 불가합니다.</p>

                    <h3>② 결제자 귀책사유</h3>
                    <p>결제 금액 오입력, 수취인 정보 착오 등 결제자의 실수로 인한 결제 건은 환불 대상에서 제외됩니다.
                        결제 전 반드시 모든 정보를 재확인하시기 바랍니다.</p>

                    <h3>③ 플랫폼의 역할</h3>
                    <p>마음부고는 결제자와 유족 사이의 부의금 전달을 지원하는 플랫폼으로서,
                        정산 완료 후에는 해당 금액에 대한 권한을 보유하지 않습니다.
                        부득이한 사정으로 환불이 필요한 경우, 유족과 직접 협의하셔야 합니다.</p>
                </section>

                <section className="terms-section">
                    <h2>제 3조 (결제 시 주의사항)</h2>
                    <p>결제자는 다음 사항을 결제 전에 반드시 확인해야 합니다:</p>
                    <ul>
                        <li>유족(상주) 정보의 정확성</li>
                        <li>결제 금액의 정확성</li>
                        <li>본인의 결제 의사</li>
                    </ul>
                    <p>확인 없이 결제를 진행하여 발생하는 문제에 대해서는 결제자 본인에게 책임이 있으며,
                        결제 완료 후에는 정보 수정이나 취소가 불가합니다.</p>
                </section>

                <section className="terms-section">
                    <h2>제 4조 (예외적 환불 검토)</h2>
                    <p>다음의 경우에 한하여 환불을 검토할 수 있습니다:</p>

                    <h3>① 시스템 장애</h3>
                    <p>결제 시스템 오류로 인한 중복 과금이나 비정상 결제가 발생한 경우,
                        관련 증빙자료(결제 내역, 오류 화면 등)를 첨부하여 문의해 주시면 검토 후 환불 여부를 결정합니다.</p>

                    <h3>② 유족의 환불 동의</h3>
                    <p>유족이 환불에 동의하고 마음부고에 정식으로 요청한 경우에 한하여 환불을 진행할 수 있습니다.
                        이 경우 발생하는 수수료는 결제자가 부담합니다.</p>
                </section>

                <section className="terms-section">
                    <h2>제 5조 (결제 안내 및 동의)</h2>
                    <ul>
                        <li>마음부고는 결제 화면에서 환불 정책과 결제 정보 확인을 안내합니다.</li>
                        <li>결제 버튼 클릭은 본 약관에 동의한 것으로 간주됩니다.</li>
                        <li>결제 완료 시 결제 확인 내역을 제공합니다.</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>제 6조 (이상 거래 신고)</h2>
                    <p>명의 도용, 중복 결제 등 이상 거래가 의심되는 경우 즉시 고객센터로 신고해 주시기 바랍니다.
                        확인된 이상 거래에 대해서는 관련 법령에 따라 적절한 조치를 취합니다.</p>
                </section>

                <section className="terms-section">
                    <h2>제 7조 (책임 범위)</h2>
                    <p>마음부고는 결제 대행 서비스만을 제공하며, 정산 완료 후 발생하는 금전적 분쟁에 대해서는 책임지지 않습니다.
                        결제자와 유족 간의 분쟁이 발생할 경우 당사자 간 협의로 해결해야 합니다.</p>
                </section>

                <section className="terms-section">
                    <h2>제 8조 (약관 변경)</h2>
                    <p>본 약관은 서비스 내 공지를 통해 효력이 발생하며,
                        마음부고는 필요시 약관을 개정할 수 있습니다.
                        개정된 약관은 공지 후 7일 경과 시점부터 적용됩니다.</p>
                </section>

                <section className="terms-section">
                    <h2>부칙</h2>
                    <p>본 약관은 2025년 1월 22일부터 시행되며,
                        시행일 이후 진행된 모든 부의금 결제에 적용됩니다.</p>
                </section>
            </main>
        </div>
    );
}
