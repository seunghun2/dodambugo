'use client';

import { useRouter } from 'next/navigation';

export default function IncomeTaxPage() {
    const router = useRouter();

    return (
        <div className="legal-page">
            <header className="legal-header">
                <button 
                    onClick={() => router.back()} 
                    className="back-btn" 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h1>소득세 원천징수 동의서</h1>
            </header>

            <main className="legal-content">
                <section className="terms-section">
                    <p className="privacy-intro" style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                        부고온 B2B 파트너(이하 "파트너") 정산금 지급 시 발생하는 사업소득 원천징수 신고를 위해, 세법에 따른 동의 사항을 다음과 같이 안내해 드립니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>1. 사업소득 원천징수 및 정산금 지급 안내</h2>
                    <p>
                        개인(프리랜서) 자격의 파트너에게 지급되는 정산금은 소득세법상 인적용역 제공에 따른 <strong>'사업소득'</strong>에 해당합니다. 
                        이에 따라 회사는 정산금 지급 시 소득세법 제127조 및 제129조에 의거하여 다음과 같이 원천징수 세액을 공제한 후 지급합니다.
                    </p>
                    <ul>
                        <li><strong>원천징수 세율:</strong> 지급금액의 3.3% (사업소득세 3% + 지방소득세 0.3%)</li>
                        <li><strong>지급 방식:</strong> 정산 신청 금액에서 3.3%를 공제한 세후 금액을 등록된 파트너 명의 계좌로 입금</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>2. 고유식별정보 및 개인정보의 수집·이용 동의 (필수)</h2>
                    <p>회사는 국세청 소득신고(원천징수 영수증 발행 및 원천징수 이행상황신고서 제출 등)의 의무를 이행하기 위해 아래와 같이 고유식별정보를 포함한 개인정보를 수집 및 이용합니다.</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', marginBottom: '12px', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-100)', borderTop: '1px solid var(--gray-300)', borderBottom: '1px solid var(--gray-300)' }}>
                                <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>수집 목적</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>수집 항목</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>보유 및 이용 기간</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: '10px', verticalAlign: 'top' }}>소득세법에 따른 프리랜서 사업소득(3.3%) 국세청 세무 신고 및 원천징수영수증 발급</td>
                                <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                    성명, <strong>주민등록번호</strong>(또는 외국인등록번호), 본인인증 정보(휴대폰 번호), 은행명, 계좌번호, 예금주명
                                </td>
                                <td style={{ padding: '10px', verticalAlign: 'top', fontWeight: '600', color: 'var(--gray-900)' }}>
                                    <strong>소득 지급일로부터 5년</strong><br/>(세법에 따른 법정 보존기간)
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                        ※ 소득세법 시행령 제208조의2 등에 따라 소득 신고서 작성을 위하여 주민등록번호 수집이 법적으로 의무화되어 있습니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>3. 개인정보 제3자 제공 동의 (필수)</h2>
                    <p>회사는 수집된 소득 신고 정보를 법적 의무 이행을 위해 다음과 같이 관할 세무 당국에 제공합니다.</p>
                    <ul>
                        <li><strong>제공받는 자:</strong> 국세청 및 관할 세무서, 회사 수임 세무사</li>
                        <li><strong>제공 항목:</strong> 성명, 주민등록번호, 정산 지급액, 지급일자, 업종코드</li>
                        <li><strong>제공 목적:</strong> 소득세 원천징수 신고 및 지급명세서 제출</li>
                        <li><strong>제공받는 자의 보유 기간:</strong> 국세청 등 세무 행정 기관의 법적 보존 기한 준수</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>4. 동의 거부 권리 및 불이익 안내</h2>
                    <p>
                        귀하는 고유식별정보 및 개인정보의 수집·이용 및 제3자 제공에 대한 동의를 거부할 권리가 있습니다. 
                        다만, 본 동의는 소득세법에 규정된 국가 신고 의무 이행을 위한 필수 사항이므로, 
                        동의하지 않으실 경우 B2B 파트너 서비스 이용 중 <strong>정산금 환급(출금) 신청이 불가능</strong>합니다.
                    </p>
                </section>

                <section className="terms-section" style={{ marginTop: '30px', padding: '16px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                    <p style={{ margin: 0, textAlign: 'center', fontWeight: '600', color: 'var(--gray-900)' }}>
                        본인은 부고온의 소득세 원천징수 및 관련 개인정보·고유식별정보의 수집, 이용, 제3자 제공 사항을 충분히 이해하였으며, 이에 동의합니다.
                    </p>
                </section>
            </main>
        </div>
    );
}
