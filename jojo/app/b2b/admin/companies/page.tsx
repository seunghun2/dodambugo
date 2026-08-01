'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconX, IconEdit, IconTrash, IconFileInvoice, IconUser } from '@tabler/icons-react';
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
    const [wreathCommission, setWreathCommission] = useState('20000');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [businessItem, setBusinessItem] = useState('');

    // 계정 관리 모달 상태
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [selectedCompanyForAccount, setSelectedCompanyForAccount] = useState<Company | null>(null);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    
    // 신규 본사 계정 발급용 폼 상태
    const [newAccName, setNewAccName] = useState('');
    const [newAccPhone, setNewAccPhone] = useState('');
    const [newAccPassword, setNewAccPassword] = useState('');
    const [newAccError, setNewAccError] = useState('');

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

    // 계정 관리 로직 추가
    const fetchCompanyUsers = async (companyId: string) => {
        try {
            const res = await fetch(`/api/b2b/admin/companies/accounts?companyId=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setCompanyUsers(data.users || []);
                }
            }
        } catch (err) {
            console.error('본사 계정 목록 로드 실패:', err);
        }
    };

    const openAccountModal = (company: Company) => {
        setSelectedCompanyForAccount(company);
        setNewAccName('');
        setNewAccPhone('');
        setNewAccPassword('');
        setNewAccError('');
        setCompanyUsers([]);
        fetchCompanyUsers(company.id);
        setAccountModalOpen(true);
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewAccError('');

        if (!newAccName.trim() || !newAccPhone.trim() || !newAccPassword.trim()) {
            setNewAccError('모든 항목을 입력해 주세요.');
            return;
        }

        try {
            const res = await fetch('/api/b2b/admin/companies/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: selectedCompanyForAccount?.id,
                    companyName: selectedCompanyForAccount?.name,
                    ownerName: newAccName,
                    phone: newAccPhone,
                    password: newAccPassword
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setNewAccName('');
                setNewAccPhone('');
                setNewAccPassword('');
                fetchCompanyUsers(selectedCompanyForAccount!.id);
                alert('본사 담당자 계정이 정상적으로 추가 발급되었습니다.');
            } else {
                setNewAccError(data.error || '계정 발급 실패');
            }
        } catch {
            setNewAccError('서버 연결 실패');
        }
    };

    const handleResetPassword = async (userId: string, ownerName: string) => {
        const newPw = prompt(`[${ownerName}] 님의 새로운 비밀번호를 입력해 주세요:`, '00000000');
        if (!newPw) return;

        try {
            const res = await fetch('/api/b2b/admin/companies/accounts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password: newPw })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('비밀번호가 성공적으로 변경되었습니다.');
            } else {
                alert(data.error || '비밀번호 변경 실패');
            }
        } catch {
            alert('서버 연결 실패');
        }
    };

    const handleRemoveMapping = async (userId: string, ownerName: string) => {
        if (!confirm(`[${ownerName}] 님의 본사 관리자 소속 매핑을 해제하시겠습니까?\n해제 시 해당 상조 본사 화면으로 로그인할 수 없게 됩니다.`)) {
            return;
        }

        try {
            const res = await fetch('/api/b2b/admin/companies/accounts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, companyId: null })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchCompanyUsers(selectedCompanyForAccount!.id);
                alert('본사 소속 매핑이 성공적으로 해제되었습니다.');
            } else {
                alert(data.error || '매핑 해제 실패');
            }
        } catch {
            alert('서버 연결 실패');
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
                                <th className={styles.th}>대표자명</th>
                                <th className={styles.th}>업태 / 종목</th>
                                <th className={styles.th}>화환 판매 본사 수수료</th>
                                <th className={styles.th}>등록일</th>
                                <th className={styles.th} style={{ width: '220px' }}>관리</th>
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
                                                    정산
                                                </button>
                                                <button className={styles.settleBtn} style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff' }} onClick={() => openAccountModal(c)}>
                                                    <IconUser size={14} style={{ marginRight: '2px' }} />
                                                    계정
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

            {/* 본사 계정(담당자) 관리 모달 */}
            {accountModalOpen && selectedCompanyForAccount && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard} style={{ maxWidth: '640px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                [{selectedCompanyForAccount.name}] 본사 담당자 계정 관리
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setAccountModalOpen(false)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* 1. 신규 본사 담당자 로그인 계정 생성/발급 */}
                            <form onSubmit={handleCreateAccount} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0f172a' }}>🔑 본사 어드민 담당자 계정 신규 발급</h3>
                                
                                {newAccError && (
                                    <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px' }}>{newAccError}</div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '4px' }}>담당자명</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            style={{ height: '36px', fontSize: '12px' }}
                                            value={newAccName}
                                            onChange={(e) => setNewAccName(e.target.value)}
                                            placeholder="예: 백승훈"
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1.2 }}>
                                        <label style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '4px' }}>휴대폰 번호 (로그인 ID)</label>
                                        <input
                                            type="tel"
                                            className={styles.input}
                                            style={{ height: '36px', fontSize: '12px' }}
                                            value={newAccPhone}
                                            onChange={(e) => setNewAccPhone(e.target.value)}
                                            placeholder="예: 01012345678"
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '4px' }}>초기 비밀번호</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            style={{ height: '36px', fontSize: '12px' }}
                                            value={newAccPassword}
                                            onChange={(e) => setNewAccPassword(e.target.value)}
                                            placeholder="비밀번호 설정"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className={styles.submitBtn} style={{ height: '36px', padding: '0 16px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                        계정 발급
                                    </button>
                                </div>
                            </form>

                            {/* 2. 등록된 본사 관리자 계정 목록 */}
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f172a' }}>📋 소속 담당자 로그인 계정 목록</h3>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table className={styles.table} style={{ fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>담당자명</th>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>로그인 휴대폰 ID</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>가입일</th>
                                                <th style={{ padding: '10px', textAlign: 'center', width: '160px' }}>관리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companyUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                        등록된 본사 담당자 계정이 없습니다. 위의 폼으로 계정을 생성해 주세요.
                                                    </td>
                                                </tr>
                                            ) : (
                                                companyUsers.map((u) => (
                                                    <tr key={u.id}>
                                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.owner_name}</td>
                                                        <td style={{ padding: '10px' }}>{u.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                <button 
                                                                    onClick={() => handleResetPassword(u.id, u.owner_name)}
                                                                    style={{ border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: '#ffffff', cursor: 'pointer', color: '#0f172a' }}
                                                                >
                                                                    비번 변경
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRemoveMapping(u.id, u.owner_name)}
                                                                    style={{ border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: '#ef4444', cursor: 'pointer', color: '#ffffff' }}
                                                                >
                                                                    해제
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
