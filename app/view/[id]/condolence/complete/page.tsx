'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { gaEvents } from '@/components/GoogleAnalytics';
import '@/app/view/[id]/condolence/condolence.css';

interface CondolencePaymentData {
    buyerName: string;
    buyerPhone: string;
    selectedAmount: number;
    totalAmount: number;
    fee: number;
    orderNumber: string;
    paymentMethod: string;
    moid: string;
    tid?: string;
    receiptUrl?: string;
    paymentCompleted?: boolean;
    account?: {
        relationship: string;
        name: string;
        bank: string;
        holder: string;
        number: string;
    };
}

export default function CondolenceCompletePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('orderNumber') || '';
    const [paymentData, setPaymentData] = useState<CondolencePaymentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1차: sessionStorage에서 데이터 로드
        const stored = sessionStorage.getItem(`condolence_payment_${params.id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPaymentData(parsed);
                if (parsed.totalAmount) {
                    gaEvents.completeCondolence(parsed.totalAmount);
                }
            } catch (e) {
                console.error('결제 데이터 파싱 오류:', e);
            }
        }

        // 2차: orderNumber가 있으면 DB에서도 조회
        if (orderNumber) {
            fetchOrderFromDB(orderNumber);
        } else {
            setLoading(false);
        }
    }, [params.id, orderNumber]);

    const fetchOrderFromDB = async (orderNum: string) => {
        try {
            const res = await fetch(`/api/condolence/orders/${orderNum}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.order) {
                    const order = data.order;
                    setPaymentData(prev => ({
                        buyerName: order.buyer_name || prev?.buyerName || '',
                        buyerPhone: order.buyer_phone || prev?.buyerPhone || '',
                        selectedAmount: order.amount || prev?.selectedAmount || 0,
                        totalAmount: order.total_amount || prev?.totalAmount || 0,
                        fee: order.fee || prev?.fee || 0,
                        orderNumber: order.order_number || orderNum,
                        paymentMethod: order.payment_method || prev?.paymentMethod || '',
                        moid: order.moid || prev?.moid || '',
                        tid: order.tid || prev?.tid || '',
                        receiptUrl: order.receipt_url || prev?.receiptUrl || '',
                        paymentCompleted: true,
                        account: prev?.account || {
                            relationship: '',
                            name: order.recipient_name || '',
                            bank: order.bank_name || '',
                            holder: order.recipient_name || '',
                            number: order.account_no || '',
                        },
                    }));
                }
            }
        } catch (e) {
            console.error('주문 DB 조회 오류:', e);
        } finally {
            setLoading(false);
        }
    };

    const fee = paymentData?.fee || (paymentData?.selectedAmount ? Math.round(paymentData.selectedAmount * 0.086) : 0);

    return (
        <main className="condolence-page">
            <header className="condolence-header">
                <div style={{ width: 40 }} />
                <h1>결제 완료</h1>
                <div style={{ width: 40 }} />
            </header>

            <div className="condolence-content" style={{ paddingTop: 40, paddingBottom: 40 }}>
                {/* 성공 아이콘 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: 32,
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4A7C59, #5a9a6a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        boxShadow: '0 4px 16px rgba(74, 124, 89, 0.3)',
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                    <h2 style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#333',
                        marginBottom: 8,
                    }}>
                        부의금이 전달되었습니다
                    </h2>
                    <p style={{
                        fontSize: 14,
                        color: '#888',
                        textAlign: 'center',
                        lineHeight: 1.6,
                    }}>
                        따뜻한 마음이 상주님께 전해질 예정입니다.
                    </p>
                </div>

                {/* 결제 상세 정보 */}
                {paymentData && (
                    <section style={{
                        background: '#FAFAFA',
                        borderRadius: 12,
                        padding: '20px',
                        margin: '0 20px',
                    }}>
                        {orderNumber && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                <span style={{ fontSize: 14, color: '#888' }}>주문번호</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{orderNumber}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ fontSize: 14, color: '#888' }}>보내신 분</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{paymentData.buyerName}</span>
                        </div>
                        {paymentData.account && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                <span style={{ fontSize: 14, color: '#888' }}>받으시는 분</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                                    {paymentData.account.relationship} {paymentData.account.name}
                                </span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ fontSize: 14, color: '#888' }}>부의금</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                                {paymentData.selectedAmount?.toLocaleString()}원
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ fontSize: 14, color: '#888' }}>수수료</span>
                            <span style={{ fontSize: 14, color: '#888' }}>
                                {fee.toLocaleString()}원
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>결제금액</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#4A7C59' }}>
                                {paymentData.totalAmount?.toLocaleString()}원
                            </span>
                        </div>
                    </section>
                )}

                {/* 안내 문구 */}
                <div style={{
                    margin: '24px 20px 0',
                    padding: '16px',
                    background: '#FFF8E1',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#8B6914',
                    lineHeight: 1.6,
                }}>
                    <p style={{ marginBottom: 4 }}>※ 부의금은 상주님 계좌로 입금 처리됩니다.</p>
                    <p>※ 결제 관련 문의: 010-4837-5076</p>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="condolence-footer">
                <button
                    type="button"
                    className="submit-button active"
                    onClick={() => router.push(`/view/${params.id}`)}
                >
                    부고 페이지로 돌아가기
                </button>
            </div>

            {/* Footer */}
            <footer className="view-footer">
                <p className="view-footer-company">마음부고</p>
                <p>서울특별시 강남구 압구정로 306</p>
                <p>대표: 김미연 | 대표번호: 010-4837-5076</p>
                <p>사업자등록번호: 408-22-68851 | 통신판매업신고: 2026-서울강남-00502</p>
                <p className="view-footer-copyright">© 2026 maeumbugo. All rights reserved.</p>
            </footer>
        </main>
    );
}
