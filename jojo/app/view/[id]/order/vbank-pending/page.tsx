'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface VBankInfo {
    bankCode: string;
    bankName: string;
    accountNo: string;
    depositName: string;
    expDate: string;
    amt: string;
    orderId: string;
    moid: string;
}

export default function VBankPendingPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const isB2b = pathname.startsWith('/b2b');
    const pathPrefix = isB2b ? '/b2b' : '';
    const bugoId = params.id as string;
    const [vbankInfo, setVbankInfo] = useState<VBankInfo | null>(null);

    useEffect(() => {
        // sessionStorage에서 가상계좌 정보 가져오기
        const stored = sessionStorage.getItem(`vbank_${bugoId}`);
        if (stored) {
            setVbankInfo(JSON.parse(stored));
        }
    }, [bugoId]);

    // 계좌번호 복사
    const copyAccountNo = () => {
        if (vbankInfo?.accountNo) {
            navigator.clipboard.writeText(vbankInfo.accountNo);
            alert('계좌번호가 복사되었습니다.');
        }
    };

    // 입금기한 포맷
    const formatExpDate = (expDate: string) => {
        if (!expDate || expDate.length !== 8) return expDate;
        return `${expDate.slice(0, 4)}.${expDate.slice(4, 6)}.${expDate.slice(6, 8)}`;
    };

    if (!vbankInfo) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
            }}>
                <p>가상계좌 정보를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '20px',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px 0',
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    backgroundColor: isB2b ? '#3A8F47' : '#FFC107',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '32px' }}>🏦</span>
                </div>
                <h1 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    color: '#1A1A1A',
                }}>
                    가상계좌 발급 완료
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: '#666',
                }}>
                    아래 계좌로 입금해 주시면 결제가 완료됩니다.
                </p>
            </div>

            {/* 계좌 정보 카드 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '20px',
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#88', marginBottom: '4px' }}>입금은행</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>
                        {vbankInfo.bankName}
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#88', marginBottom: '4px' }}>계좌번호</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', letterSpacing: '1px' }}>
                            {vbankInfo.accountNo}
                        </p>
                        <button
                            onClick={copyAccountNo}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: isB2b ? '#3A8F47' : '#4A7C59',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            복사
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#88', marginBottom: '4px' }}>예금주</p>
                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#1A1A1A' }}>
                        {vbankInfo.depositName || '마음부고'}
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#88', marginBottom: '4px' }}>입금금액</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: isB2b ? '#3A8F47' : '#4A7C59' }}>
                        {Number(vbankInfo.amt).toLocaleString()}원
                    </p>
                </div>

                <div style={{
                    padding: '12px',
                    backgroundColor: isB2b ? '#EDF7ED' : '#FFF3CD',
                    borderRadius: '8px',
                    border: isB2b ? '1px solid #C3E6CB' : '1px solid #FFEEBA',
                }}>
                    <p style={{ fontSize: '13px', color: isB2b ? '#1E4620' : '#856404' }}>
                        ⏰ 입금기한: <strong>{formatExpDate(vbankInfo.expDate)} 23:59</strong>까지
                    </p>
                </div>
            </div>

            {/* 안내 메시지 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1A1A1A' }}>
                    📌 안내사항
                </h3>
                <ul style={{
                    fontSize: '13px',
                    color: '#66',
                    paddingLeft: '16px',
                    lineHeight: 1.8,
                }}>
                    <li>입금 후 자동으로 결제가 완료됩니다.</li>
                    <li>입금자명은 주문자명과 동일해야 합니다.</li>
                    <li>입금기한 내 미입금 시 주문이 자동 취소됩니다.</li>
                </ul>
            </div>

            {/* 버튼 */}
            <Link
                href={`${pathPrefix}/view/${bugoId}`}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: isB2b ? '#3A8F47' : '#4A7C59',
                    color: 'white',
                    textAlign: 'center',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                }}
            >
                부고 페이지로 돌아가기
            </Link>

            <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#999',
                marginTop: '16px',
            }}>
                주문번호: {vbankInfo.moid}
            </p>
        </div>
    );
}
