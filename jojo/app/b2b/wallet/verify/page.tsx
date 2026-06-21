'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './verify.module.css';

export default function VerifyIntroPage() {
    const router = useRouter();
    const [agree1, setAgree1] = useState(false); // 필수
    const [agreeTax, setAgreeTax] = useState(false); // 필수
    const [agree2, setAgree2] = useState(false); // 선택
    const [showModal, setShowModal] = useState<string | null>(null);

    useEffect(() => {
        // 로그인 체크
        const token = localStorage.getItem('b2b_token');
        if (!token) {
            router.push('/b2b/login');
        }
    }, [router]);

    const handleAllAgree = () => {
        const target = !(agree1 && agreeTax && agree2);
        setAgree1(target);
        setAgreeTax(target);
        setAgree2(target);
    };

    const handleStart = () => {
        if (!agree1 || !agreeTax) return;
        router.push('/b2b/wallet/verify/form');
    };

    const openTerms = (type: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setShowModal(type);
    };

    return (
        <div className={styles.page}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push('/b2b/wallet')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            </header>

            <div className={styles.content}>
                <h1 className={styles.title}>환급 신청 안내</h1>
                <p className={styles.desc}>
                    계좌변경 또는 첫 환급신청 시 출금을 위해 최초 1회 본인인증이 필요합니다.
                </p>

                {/* 프로세스 맵 가이드 */}
                <div className={styles.stepList}>
                    <div className={styles.stepItem}>
                        <div className={`${styles.stepIcon} ${styles.stepIconActive}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                        </div>
                        <span className={`${styles.stepText} ${styles.stepTextActive}`}>
                            개인 정보 입력 (본인인증)
                        </span>
                    </div>

                    <div style={{ paddingLeft: '20px', borderLeft: '2px dashed #e9ecef', height: '24px', marginLeft: '19px' }} />

                    <div className={styles.stepItem}>
                        <div className={styles.stepIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <span className={styles.stepText}>환급 완료</span>
                    </div>
                </div>

                {/* 약관 동의 및 시작 버튼 */}
                <div className={styles.termsArea}>
                    {/* 개별 약관 1 */}
                    <div className={styles.termItem} onClick={() => setAgree1(!agree1)}>
                        <div className={styles.termLeft}>
                            <div className={`${styles.checkbox} ${agree1 ? styles.checkboxChecked : ''}`}>
                                {agree1 && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span>
                                <span className={styles.termRequired}>[필수]</span> 개인정보 수집 및 이용안내
                            </span>
                        </div>
                        <button className={styles.arrowBtn} onClick={(e) => openTerms('privacy', e)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    {/* 개별 약관 3 (소득세 원천징수 동의) */}
                    <div className={styles.termItem} onClick={() => setAgreeTax(!agreeTax)}>
                        <div className={styles.termLeft}>
                            <div className={`${styles.checkbox} ${agreeTax ? styles.checkboxChecked : ''}`}>
                                {agreeTax && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span>
                                <span className={styles.termRequired}>[필수]</span> 소득세 원천징수 동의서
                            </span>
                        </div>
                        <button className={styles.arrowBtn} onClick={(e) => openTerms('income-tax', e)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    {/* 개별 약관 2 */}
                    <div className={styles.termItem} onClick={() => setAgree2(!agree2)}>
                        <div className={styles.termLeft}>
                            <div className={`${styles.checkbox} ${agree2 ? styles.checkboxChecked : ''}`}>
                                {agree2 && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span>
                                <span className={styles.termOptional}>[선택]</span> 마케팅 수신 동의 약관
                            </span>
                        </div>
                        <button className={styles.arrowBtn} onClick={(e) => openTerms('marketing', e)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    {/* 전체 동의하기 박스 */}
                    <div
                        className={`${styles.allAgreeBox} ${agree1 && agreeTax && agree2 ? styles.allAgreeBoxActive : ''}`}
                        onClick={handleAllAgree}
                    >
                        <div className={`${styles.checkbox} ${(agree1 && agreeTax && agree2) ? styles.checkboxChecked : ''}`}>
                            {(agree1 && agreeTax && agree2) && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                        <span className={styles.allAgreeText}>전체 동의하기</span>
                    </div>

                    {/* 시작 버튼 */}
                    <button
                        className={styles.submitBtn}
                        onClick={handleStart}
                        disabled={!agree1 || !agreeTax}
                    >
                        시작하기
                    </button>
                </div>
            </div>

            {/* 약관 디테일 모달 */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(null)}>
                    <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                {showModal === 'privacy' ? '개인정보 수집 및 이용안내' : showModal === 'income-tax' ? '소득세 원천징수 동의서' : '마케팅 수신 동의 약관'}
                            </h3>
                            <button className={styles.modalCloseBtn} onClick={() => setShowModal(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            {showModal === 'privacy' && (
                                `부고온은 원활한 프리랜서 소득 원천징수 신고 및 환급금(출금) 처리를 위해 아래와 같이 개인정보를 수집 및 이용합니다.

1. 수집하는 개인정보 항목:
- 필수: 실명, 주민등록번호(또는 운전면허 정보), 휴대폰 번호, 본인인증 데이터

2. 수집 및 이용 목적:
- 프리랜서(사업소득) 3.3% 원천징수 세무 신고 대행
- 환급금 지급을 위한 본인 확인 및 본인 명의 계좌 송금 처리

3. 보유 및 이용 기간:
- 관련 세법(국세기본법 등)에 따른 소득신고 증빙자료 보관 기한(5년) 종료 시 즉시 파기`
                            )}
                            {showModal === 'income-tax' && (
                                `마음부고 B2B 파트너 정산금 지급 시 발생하는 사업소득 원천징수 신고를 위해, 세법에 따른 동의 사항을 다음과 같이 안내해 드립니다.

1. 사업소득 원천징수 및 정산금 지급:
- 프리랜서 사업소득에 해당하며, 지급금액의 3.3% (소득세 3% + 지방소득세 0.3%) 원천징수 세액을 공제한 잔액을 지급합니다.

2. 고유식별정보의 수집 및 이용 동의:
- 수집 항목: 성명, 주민등록번호, 연락처, 은행명, 계좌번호, 예금주명
- 보유 및 이용 기간: 소득 지급일로부터 5년 (세법상의 법정 보존기간)

3. 개인정보 제3자 제공 동의:
- 제공처: 국세청 및 관할 세무서, 회사 수임 세무사
- 목적: 소득세 원천징수 신고 및 지급명세서 제출

※ 상세 사항은 /b2b/income-tax 페이지에서 확인하실 수 있습니다.`
                            )}
                            {showModal === 'marketing' && (
                                `부고온 파트너 앱에서 제공하는 혜택, 이벤트, 각종 정산 보고서 알림 및 마케팅 정보를 수신하는 것에 동의합니다.

- 수신 매체: SMS, 알림톡, 이메일, 앱 푸시
- 동의 철회는 설정 메뉴에서 언제든지 가능하며, 미동의 시에도 환급 서비스를 정상 이용하실 수 있습니다.`
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
