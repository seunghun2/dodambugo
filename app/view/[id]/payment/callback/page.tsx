'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

export default function PaymentCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const routeBugoId = params.id as string;  // URL 경로에서 id 추출 (폴백용)
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('결제를 처리하고 있습니다...');

    useEffect(() => {
        async function processPayment() {
            // URL 파라미터에서 결제 정보 추출
            const paymentToken = searchParams.get('paymentToken');
            const tid = searchParams.get('tid');
            const mid = searchParams.get('mid');
            const amt = searchParams.get('amt');
            const taxFreeAmt = searchParams.get('taxFreeAmt') || '0';
            const moid = searchParams.get('moid');
            const resultCode = searchParams.get('resultCode');
            const resultMsg = searchParams.get('resultMsg');
            const mallReserved = searchParams.get('mallReserved');
            const payMethod = searchParams.get('payMethod'); // 결제 수단 (CARD, EPAY, VBANK)

            // 가상계좌 관련 파라미터
            const bankCode = searchParams.get('bankCode');
            const bankName = searchParams.get('bankName');
            const accountNo = searchParams.get('accountNo');
            const depositName = searchParams.get('depositName');
            const expDate = searchParams.get('expDate');

            console.log('Payment callback received:', { paymentToken, tid, mid, amt, moid, resultCode, resultMsg, payMethod });

            // 결제 실패 체크 (resultCode가 있고 실패인 경우에만)
            if (resultCode && resultCode !== '0000' && resultCode !== '00') {
                setStatus('error');
                setMessage(resultMsg || '결제가 취소되었거나 실패했습니다.');
                return;
            }

            // mallReserved에서 bugoId 추출
            let bugoId = '';
            let orderId = '';
            try {
                if (mallReserved) {
                    const reserved = JSON.parse(mallReserved);
                    bugoId = reserved.bugoId;
                    orderId = reserved.orderId;
                }
            } catch (e) {
                console.error('mallReserved 파싱 오류:', e);
            }

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
                console.log('📤 승인 API 호출 시작...', { paymentToken, tid, mid, amt, taxFreeAmt, moid, orderId });

                const approveResponse = await fetch('/api/payment/innopay/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentToken,
                        tid,
                        mid,
                        amt,
                        taxFreeAmt,
                        moid,
                        orderId,
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

                // 완료 페이지로 이동
                setTimeout(() => {
                    const finalBugoId = bugoId || routeBugoId;
                    if (finalBugoId) {
                        router.push(`/view/${finalBugoId}/order/complete`);
                    } else {
                        router.push('/');
                    }
                }, 1500);

            } catch (err: any) {
                console.error('결제 승인 오류:', err);
                setStatus('error');
                setMessage(err.message || '결제 승인 중 오류가 발생했습니다.');
            }
        }

        processPayment();
    }, [searchParams, router]);

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
