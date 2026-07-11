'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconX, IconEdit, IconTrash, IconFileInvoice } from '@tabler/icons-react';
import styles from './companies.module.css';

interface Company {
    id: string;
    name: string;
    business_no?: string;
    wreath_commission_amount: number;
    created_at: string;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 등록 / 수정 모달 상태
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    // 정산 내역 모달 상태
    const [settleModalOpen, setSettleModalOpen] = useState(false);
    const [settleCompany, setSettleCompany] = useState<Company | null>(null);
    const [settlements, setSettlements] = useState<any[]>([]);
    const [settleSummary, setSettleSummary] = useState<any>({ pending_amount: 0, completed_amount: 0, total_count: 0 });
    const [settleLoading, setSettleLoading] = useState(false);

    // 입력 필드 상태
    const [name, setName] = useState('');
    const [businessNo, setBusinessNo] = useState('');
    const [wreathCommission, setWreathCommission] = useState('5000');

    // 목록 조회
    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/b2b/admin/companies');
            if (!res.ok) throw new Error('상조회사 정보를 가져오는데 실패했습니다.');
            const data = await res.json();
            if (data.success) {
                setCompanies(data.companies);
            } else {
                setError(data.error || '목록을 불러오는 중 오류 발생');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류 발생');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    // 등록 / 수정 모달 열기
    const openModal = (company: Company | null = null) => {
        setEditingCompany(company);
        if (company) {
            setName(company.name);
            setBusinessNo(company.business_no || '');
            setWreathCommission(String(company.wreath_commission_amount));
        } else {
            setName('');
            setBusinessNo('');
            setWreathCommission('5000');
        }
        setModalOpen(true);
    };

    // 저장 처리 (등록 또는 수정)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const amount = parseInt(wreathCommission);
        if (!name.trim()) {
            setError('상조회사명을 입력해주세요.');
            return;
        }
        if (isNaN(amount) || amount < 0) {
            setError('정산 수당은 0원 이상의 정수로 입력해주세요.');
            return;
        }

        try {
            const method = editingCompany ? 'PUT' : 'POST';
            const res = await fetch('/api/b2b/admin/companies', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingCompany?.id,
                    name,
                    business_no: businessNo,
                    wreath_commission_amount: amount
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '저장에 실패했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                setModalOpen(false);
                fetchCompanies();
            } else {
                setError(data.error || '저장 중 오류 발생');
            }
        } catch (err: any) {
            setError(err.message || '요청 실패');
        }
    };

    // 삭제 처리
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`[${name}] 상조회사를 정말 삭제하시겠습니까?\n소속된 지도사 회원은 자동으로 소속이 해제(무소속)됩니다.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/b2b/admin/companies?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '삭제 실패');
            }

            const data = await res.json();
            if (data.success) {
                fetchCompanies();
            } else {
                setError(data.error || '삭제 중 오류 발생');
            }
        } catch (err: any) {
            setError(err.message || '삭제 실패');
        }
    };

    // 정산 내역 모달 열기 및 데이터 조회
    const openSettleModal = (company: Company) => {
        setSettleCompany(company);
        setSettleModalOpen(true);
        fetchSettlements(company.id);
    };

    const fetchSettlements = async (companyId: string) => {
        setSettleLoading(true);
        try {
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}`);
            if (!res.ok) throw new Error('정산 내역을 가져오는데 실패했습니다.');
            const data = await res.json();
            if (data.success) {
                setSettlements(data.settlements);
                setSettleSummary(data.summary);
            } else {
                alert(data.error || '정산 로드 중 오류 발생');
            }
        } catch (err: any) {
            alert(err.message || '네트워크 오류');
        } finally {
            setSettleLoading(false);
        }
    };

    // 일괄 송금 처리
    const handleCompleteSettlement = async (companyId: string) => {
        if (!confirm('미지급된 모든 정산 수당을 일괄 송금 완료 처리하시겠습니까?\n반드시 실제 은행 송금 완료 후 실행해주세요.')) {
            return;
        }

        try {
            const res = await fetch('/api/b2b/admin/companies/settlements', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '송금 완료 처리에 실패했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                alert(`정상 처리되었습니다. (완료 건수: ${data.updated_count}건)`);
                fetchSettlements(companyId);
            } else {
                alert(data.error || '오류 발생');
            }
        } catch (err: any) {
            alert(err.message || '요청 실패');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#64748b', fontSize: '14px' }}>
                상조회사 데이터를 불러오는 중...
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>상조회사 관리</h1>
                <p className={styles.subtitle}>B2B 소속 상조회사 본사를 등록하고, 각 본사별 화환 정산 수수료를 세팅합니다.</p>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', maxWidth: '600px' }}>
                    {error}
                </div>
            )}

            <div className={styles.actionArea}>
                <button className={styles.addBtn} onClick={() => openModal(null)}>
                    <IconPlus size={16} />
                    <span>상조회사 추가</span>
                </button>
            </div>

            <div className={styles.card}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>상조회사명</th>
                                <th className={styles.th}>사업자 번호</th>
                                <th className={styles.th}>화환 판매 본사 수수료</th>
                                <th className={styles.th}>등록일</th>
                                <th className={styles.th} style={{ width: '150px' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={styles.emptyState}>
                                        등록된 상조회사가 존재하지 않습니다. 상조회사를 등록해 주세요.
                                    </td>
                                </tr>
                            ) : (
                                companies.map((c) => (
                                    <tr key={c.id} className={styles.tr}>
                                        <td className={styles.td} style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {c.name}
                                        </td>
                                        <td className={styles.td}>
                                            {c.business_no || '-'}
                                        </td>
                                        <td className={styles.td} style={{ color: '#2563eb', fontWeight: '500' }}>
                                            {(c.wreath_commission_amount || 0).toLocaleString()}원
                                        </td>
                                        <td className={styles.td}>
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.rowActions}>
                                                <button className={styles.settleBtn} onClick={() => openSettleModal(c)}>
                                                    <IconFileInvoice size={14} style={{ marginRight: '2px' }} />
                                                    정산 내역
                                                </button>
                                                <button className={styles.editBtn} onClick={() => openModal(c)}>
                                                    <IconEdit size={14} style={{ marginRight: '2px' }} />
                                                    수정
                                                </button>
                                                <button className={styles.deleteBtn} onClick={() => handleDelete(c.id, c.name)}>
                                                    <IconTrash size={14} style={{ marginRight: '2px' }} />
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 등록 및 수정 모달 */}
            {modalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingCompany ? '상조회사 수당 정보 수정' : '신규 상조회사 등록'}
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>상조회사명 *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="예: 보람상조"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>사업자 번호</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={businessNo}
                                    onChange={(e) => setBusinessNo(e.target.value)}
                                    placeholder="예: 120-00-00000"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>화환 판매 본사 분배 수당 *</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        className={`${styles.input} ${styles.inputWithUnit}`}
                                        value={wreathCommission}
                                        onChange={(e) => setWreathCommission(e.target.value)}
                                        placeholder="예: 5000"
                                        required
                                    />
                                    <span className={styles.unit}>원</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', margin: '6px 0 0 0' }}>
                                    소속 파트너가 화환을 판매했을 때 상조 본사에 자동으로 적립해 줄 수당 금액입니다.
                                </p>
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>
                                    취소
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* 정산 상세 내역 모달 */}
            {settleModalOpen && settleCompany && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard} style={{ maxWidth: '640px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                [{settleCompany.name}] 정산 상세 내역
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setSettleModalOpen(false)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* 통계 요약 박스 */}
                            <div className={styles.settleSummaryBox}>
                                <div className={styles.settleSummaryCard}>
                                    <div className={styles.settleSummaryLabel}>미지급 정산금</div>
                                    <div className={styles.settleSummaryValue} style={{ color: '#d97706' }}>
                                        {(settleSummary.pending_amount || 0).toLocaleString()}원
                                    </div>
                                </div>
                                <div className={styles.settleSummaryCard}>
                                    <div className={styles.settleSummaryLabel}>지급완료 금액</div>
                                    <div className={styles.settleSummaryValue} style={{ color: '#059669' }}>
                                        {(settleSummary.completed_amount || 0).toLocaleString()}원
                                    </div>
                                </div>
                                <div className={styles.settleSummaryCard}>
                                    <div className={styles.settleSummaryLabel}>총 누적 건수</div>
                                    <div className={styles.settleSummaryValue}>
                                        {settleSummary.total_count || 0}건
                                    </div>
                                </div>
                            </div>

                            {/* 상세 내역 테이블 */}
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                                {settleLoading ? (
                                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                                        정산 내역을 로드하는 중...
                                    </div>
                                ) : settlements.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                                        발생한 화환 정산 내역이 없습니다.
                                    </div>
                                ) : (
                                    <table className={styles.table} style={{ fontSize: '13px' }}>
                                        <thead>
                                            <tr>
                                                <th className={styles.th} style={{ padding: '8px 12px' }}>발생일시</th>
                                                <th className={styles.th} style={{ padding: '8px 12px' }}>상품/주문자</th>
                                                <th className={styles.th} style={{ padding: '8px 12px' }}>정산금액</th>
                                                <th className={styles.th} style={{ padding: '8px 12px' }}>상태</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settlements.map((s) => (
                                                <tr key={s.id} className={styles.tr}>
                                                    <td className={styles.td} style={{ padding: '10px 12px', fontSize: '12px' }}>
                                                        {new Date(s.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </td>
                                                    <td className={styles.td} style={{ padding: '10px 12px' }}>
                                                        {s.order ? (
                                                            <div>
                                                                <div style={{ fontWeight: '600' }}>{s.order.product_name}</div>
                                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                                    주문자: {s.order.sender_name} | {s.order.funeral_home}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8' }}>주문 정보 누락 (ID: {s.order_id})</span>
                                                        )}
                                                    </td>
                                                    <td className={styles.td} style={{ padding: '10px 12px', fontWeight: '600' }}>
                                                        {s.amount.toLocaleString()}원
                                                    </td>
                                                    <td className={styles.td} style={{ padding: '10px 12px' }}>
                                                        {s.status === 'pending' ? (
                                                            <span className={`${styles.badge} ${styles.badgePending}`}>정산대기</span>
                                                        ) : (
                                                            <span className={`${styles.badge} ${styles.badgeCompleted}`}>송금완료</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* 송금 완료 처리 버튼 */}
                            <button
                                className={styles.completeAllBtn}
                                onClick={() => handleCompleteSettlement(settleCompany.id)}
                                disabled={settleLoading || !settleSummary.pending_amount}
                            >
                                미지급 정산금 일괄 송금 완료 처리
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
