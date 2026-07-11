'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconX, IconEdit, IconTrash, IconFileInvoice } from '@tabler/icons-react';
import styles from './companies.module.css';

interface Company {
    id: string;
    name: string;
    business_no?: string;
    wreath_commission_amount: number;
    created_at: string;
    owner_name?: string;
    address?: string;
    business_type?: string;
    business_item?: string;
}

export default function CompaniesPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 등록 / 수정 모달 상태
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    // 입력 필드 상태
    const [name, setName] = useState('');
    const [businessNo, setBusinessNo] = useState('');
    const [wreathCommission, setWreathCommission] = useState('5000');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [businessItem, setBusinessItem] = useState('');

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
            setOwnerName(company.owner_name || '');
            setAddress(company.address || '');
            setBusinessType(company.business_type || '');
            setBusinessItem(company.business_item || '');
        } else {
            setName('');
            setBusinessNo('');
            setWreathCommission('5000');
            setOwnerName('');
            setAddress('');
            setBusinessType('');
            setBusinessItem('');
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
                    wreath_commission_amount: amount,
                    owner_name: ownerName,
                    address,
                    business_type: businessType,
                    business_item: businessItem
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

    // 정산 내역 단독 페이지로 이동
    const openSettleModal = (company: Company) => {
        router.push(`/b2b/admin/companies/settlements?companyId=${company.id}&name=${encodeURIComponent(company.name)}`);
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
                                <th className={styles.th}>대표자명</th>
                                <th className={styles.th}>업태 / 종목</th>
                                <th className={styles.th}>화환 판매 본사 수수료</th>
                                <th className={styles.th}>등록일</th>
                                <th className={styles.th} style={{ width: '150px' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={styles.emptyState}>
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
                                        <td className={styles.td}>
                                            {c.owner_name || '-'}
                                        </td>
                                        <td className={styles.td} style={{ fontSize: '12px' }}>
                                            {c.business_type || c.business_item ? `${c.business_type || '-' } / ${c.business_item || '-'}` : '-'}
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
                                <label className={styles.label}>대표자명</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="예: 홍길동"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>소재지 주소</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="예: 서울특별시 마포구 백범로 31"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.label}>업태</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={businessType}
                                        onChange={(e) => setBusinessType(e.target.value)}
                                        placeholder="예: 서비스업"
                                    />
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.label}>종목</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={businessItem}
                                        onChange={(e) => setBusinessItem(e.target.value)}
                                        placeholder="예: 상조업, 장례식장"
                                    />
                                </div>
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
        </div>
    );
}
