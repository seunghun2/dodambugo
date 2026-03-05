'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { gaEvents } from '@/components/GoogleAnalytics';

// 모듈 레벨: React StrictMode에서도 중복 실행 완전 차단
let paymentProcessed = false;

export default function PaymentCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const routeBugoId = params.id as string;  // URL 경로에서 id 추출 (폴백용)
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('결제를 처리하고 있습니다...');

    useEffect(() => {
        async function processPayment() {
            // 중복 실행 방지 (모듈 레벨)
            if (paymentProcessed) {
                console.log('⚠️ processPayment 중복 실행 차단');
                return;
            }
            paymentProcessed = true;
            // URL 파라미터에서 결제 정보 추출
            // useSearchParams가 비어있을 수 있으므로 window.location.search 폴백 사용
            const urlParams = new URLSearchParams(window.location.search);
            const getParam = (key: string) => searchParams.get(key) || urlParams.get(key) || '';

            const paymentToken = getParam('paymentToken');
            const tid = getParam('tid');
            const mid = getParam('mid');
            const amt = getParam('amt');
            const taxFreeAmt = getParam('taxFreeAmt') || '0';
            const moid = getParam('moid');
            const resultCode = getParam('resultCode');
            const resultMsg = getParam('resultMsg');
            const mallReserved = getParam('mallReserved');
            const payMethod = getParam('payMethod');

            // 가상계좌 관련 파라미터
            const bankCode = getParam('bankCode');
            const bankName = getParam('bankName');
            const accountNo = getParam('accountNo');
            const depositName = getParam('depositName');
            const expDate = getParam('expDate');

            console.log('Payment callback received:', { paymentToken, tid, mid, amt, moid, resultCode, resultMsg, payMethod });

            // 결제 실패 체크 (resultCode가 있고 실패인 경우에만)
            if (resultCode && resultCode !== '0000' && resultCode !== '00') {
                setStatus('error');
                setMessage(resultMsg || '결제가 취소되었거나 실패했습니다.');
                gaEvents.failFlowerPayment(resultMsg || `결제실패_${resultCode}`);
                return;
            }

            // mallReserved에서 bugoId, type, originalTaxFreeAmt 추출
            let bugoId = '';
            let orderId = '';
            let originalTaxFreeAmt = '';
            let paymentType = getParam('type'); // condolence 여부
            try {
                if (mallReserved) {
                    // URL 인코딩된 경우 디코딩
                    const decodedReserved = decodeURIComponent(mallReserved);
                    const reserved = JSON.parse(decodedReserved);
                    bugoId = reserved.bugoId || '';
                    orderId = reserved.orderId || '';
                    originalTaxFreeAmt = reserved.originalTaxFreeAmt || '';
                    if (reserved.type) paymentType = reserved.type;
                }
            } catch (e) {
                console.error('mallReserved 파싱 오류:', e, mallReserved);
            }

            // moid가 COND_로 시작하면 부의금 결제
            if (!paymentType && moid && moid.startsWith('COND_')) {
                paymentType = 'condolence';
            }

            console.log('📋 결제 타입 판별:', { paymentType, moid, bugoId });

            // 🏦 가상계좌인 경우 - 입금 대기 페이지로 이동
            if (payMethod === 'VBANK') {
                console.log('📦 가상계좌 결제 - 입금 대기:', { bankName, accountNo, expDate });

                // 가상계좌 정보를 sessionStorage에 저장
                const finalBugoId = bugoId || routeBugoId;
                sessionStorage.setItem(`vbank_${finalBugoId}`, JSON.stringify({
                    bankCode,
                    bankName,
                    accountNo,
                    depositName,
                    expDate,
                    amt,
                    orderId,
                    moid,
                }));

                setStatus('success');
                setMessage('가상계좌가 발급되었습니다.');

                // 입금 대기 페이지로 이동
                setTimeout(() => {
                    router.push(`/view/${finalBugoId}/order/vbank-pending`);
                }, 1000);
                return;
            }



            if (!paymentToken || !tid) {
                setStatus('error');
                setMessage('결제 정보가 올바르지 않습니다.');
                return;
            }

            try {
                // 서버에서 결제 승인 처리
                // originalTaxFreeAmt가 있으면 콜백의 taxFreeAmt 대신 사용 (INNOPAY 콜백이 면세금액을 누락할 수 있음)
                const finalTaxFreeAmt = originalTaxFreeAmt || taxFreeAmt;
                console.log('📤 승인 API 호출 시작...', { paymentToken, tid, mid, amt, taxFreeAmt, originalTaxFreeAmt, finalTaxFreeAmt, moid, orderId });

                const approveResponse = await fetch('/api/payment/innopay/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentToken,
                        tid,
                        mid,
                        amt,
                        taxFreeAmt: finalTaxFreeAmt,
                        moid,
                        orderId,
                        payMethod,  // CARD, EPAY, VBANK 등 실제 결제수단
                    }),
                });

                console.log('📥 승인 API 응답:', approveResponse.status);
                const approveResult = await approveResponse.json();
                console.log('📥 승인 결과:', approveResult);

                if (!approveResponse.ok || !approveResult.success) {
                    const errorCode = approveResult.code || approveResult.innopayResponse?.resultCode || 'Unknown';
                    const errorMsg = approveResult.error || approveResult.message || '결제 승인 실패';

                    // 상세 에러 메시지 생성
                    const detailedMsg = `[${errorCode}] ${errorMsg}`;
                    console.error('결제 승인 실패 상세:', approveResult);

                    throw new Error(detailedMsg);
                }

                // 성공 - receiptUrl, orderNumber 저장
                const receiptUrl = approveResult.data?.receiptUrl;
                const orderNumber = approveResult.data?.orderNumber;

                // approve 응답에서 paymentType 직접 추출 (가장 확실한 방법)
                if (!paymentType && approveResult.data?.paymentType) {
                    paymentType = approveResult.data.paymentType;
                }

                // approve 응답의 mallReserved에서도 type 추출 (추가 폴백)
                if (!paymentType) {
                    try {
                        const respMallReserved = approveResult.data?.etc?.mallReserved;
                        if (respMallReserved) {
                            const decoded = JSON.parse(decodeURIComponent(respMallReserved));
                            if (decoded.type) paymentType = decoded.type;
                            if (decoded.bugoId && !bugoId) bugoId = decoded.bugoId;
                        }
                    } catch (e) {
                        console.error('approve mallReserved 파싱 오류:', e);
                    }
                }

                // orderNumber가 COND_로 시작하면 부의금 (최종 폴백)
                if (!paymentType && orderNumber && orderNumber.startsWith('COND_')) {
                    paymentType = 'condolence';
                }

                console.log('🔍 최종 paymentType:', paymentType, 'orderNumber:', orderNumber, 'moid:', moid);

                const finalBugoId = bugoId || routeBugoId;
                const existingPayment = sessionStorage.getItem(`payment_${finalBugoId}`);
                if (existingPayment) {
                    const paymentData = JSON.parse(existingPayment);
                    if (receiptUrl) paymentData.receiptUrl = receiptUrl;
                    if (orderNumber) paymentData.orderNumber = orderNumber;
                    sessionStorage.setItem(`payment_${finalBugoId}`, JSON.stringify(paymentData));
                } else {
                    // payment 데이터가 없으면 새로 생성
                    sessionStorage.setItem(`payment_${finalBugoId}`, JSON.stringify({
                        receiptUrl,
                        orderNumber,
                    }));
                }

                setStatus('success');
                setMessage('결제가 완료되었습니다!');

                const finalBugoId2 = bugoId || routeBugoId;

                // 부의금 결제인 경우 - 서버 approve에서 송금 처리 완료됨, 완료 페이지로 이동
                if (paymentType === 'condolence') {
                    const condolenceData = sessionStorage.getItem(`condolence_payment_${finalBugoId2}`);

                    if (condolenceData) {
                        const parsedData = JSON.parse(condolenceData);
                        parsedData.tid = tid;
                        parsedData.receiptUrl = receiptUrl;
                        parsedData.paymentCompleted = true;
                        parsedData.transferCompleted = true; // 서버에서 이미 송금 완료
                        sessionStorage.setItem(`condolence_payment_${finalBugoId2}`, JSON.stringify(parsedData));
                    }

                    setTimeout(() => {
                        if (orderNumber && orderNumber.startsWith('CO')) {
                            router.push(`/order/${orderNumber}`);
                        } else {
                            router.push(`/view/${finalBugoId2}/condolence/complete`);
                        }
                    }, 1000);
                    return;
                }

                // 화환 결제인 경우 (기존 로직)
                setTimeout(() => {
                    if (orderNumber) {
                        router.push(`/order/${orderNumber}`);
                    } else {
                        if (finalBugoId2) {
                            router.push(`/view/${finalBugoId2}/order/complete`);
                        } else {
                            router.push('/');
                        }
                    }
                }, 1500);

            } catch (err: any) {
                console.error('결제 승인 오류:', err);
                setStatus('error');
                setMessage(err.message || '결제 승인 중 오류가 발생했습니다.');
                gaEvents.failFlowerPayment(err.message || '결제승인오류');
            }
        }

        processPayment();
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
        }}>
            {status === 'processing' && (
                <>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #e0e0e0',
                        borderTopColor: '#4A7C59',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <style jsx>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </>
            )}

            {status === 'success' && (
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#4A7C59',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                }}>
                    <span style={{ color: 'white', fontSize: '32px' }}>✓</span>
                </div>
            )}

            {status === 'error' && (
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#e74c3c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                }}>
                    <span style={{ color: 'white', fontSize: '32px' }}>✕</span>
                </div>
            )}

            <h2 style={{
                marginTop: '24px',
                fontSize: '18px',
                fontWeight: 600,
                color: status === 'error' ? '#e74c3c' : '#333',
            }}>
                {message}
            </h2>

            {status === 'error' && (
                <button
                    onClick={() => router.back()}
                    style={{
                        marginTop: '24px',
                        padding: '12px 24px',
                        backgroundColor: '#4A7C59',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    다시 시도
                </button>
            )}
        </div>
    );
}
