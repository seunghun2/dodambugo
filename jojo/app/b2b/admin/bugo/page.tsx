'use client';

import { useState, useEffect } from 'react';
import { 
    IconSearch, 
    IconDownload 
} from '@tabler/icons-react';
import styles from './bugo.module.css';

interface B2BBugo {
    id: string;
    bugo_number: number;
    deceased_name: string;
    mourner_name: string;
    funeral_home: string;
    room: string;
    created_at: string;
    company_name: string;
    owner_name: string;
    phone: string;
}

export default function BugoPage() {
    const [bugoList, setBugoList] = useState<B2BBugo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBugoList = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/b2b/admin/bugo?${params.toString()}`);
            if (!res.ok) {
                throw new Error('부고 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setBugoList(data.bugoList);
            } else {
                setError(data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBugoList();
    }, [searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    // CSV/Excel 다운로드 기능 (UTF-8 BOM 헤더 포함)
    const handleDownloadExcel = () => {
        if (bugoList.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['생성일시', '부고번호', '고인 성함', '상주 성함', '장례식장', '빈소', '개설 파트너사', '대표자명', '파트너 연락처'];
        const rows = bugoList.map(b => [
            formatDate(b.created_at),
            String(b.bugo_number),
            b.deceased_name,
            b.mourner_name,
            b.funeral_home,
            b.room,
            b.company_name,
            b.owner_name,
            formatPhone(b.phone)
        ]);

        const csvContent = 
            '\ufeff' + // UTF-8 BOM 추가
            [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `b2b_bugo_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatPhone = (p: string) => {
        const clean = p.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
        }
        return p;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 부고 조회</h1>
                <p className={styles.subtitle}>B2B 파트너(지도사)들이 생성 및 관리 중인 모바일 부고장 목록입니다.</p>
            </div>

            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="고인명, 상주명, 파트너사, 장례식장 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className={styles.searchBtn}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconSearch stroke={1.5} size={16} />
                            <span>검색</span>
                        </div>
                    </button>
                </form>

                <button onClick={handleDownloadExcel} className={styles.excelBtn}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconDownload stroke={1.5} size={16} />
                        <span>엑셀 다운로드</span>
                    </div>
                </button>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            부고 내역을 불러오는 중...
                        </div>
                    ) : bugoList.length === 0 ? (
                        <div className={styles.emptyState}>조회할 부고 내역이 없습니다.</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>생성일시</th>
                                    <th>부고번호</th>
                                    <th>개설 파트너사</th>
                                    <th>대표자명</th>
                                    <th>고인 성함</th>
                                    <th>상주 성함</th>
                                    <th>장례식장</th>
                                    <th>빈소</th>
                                    <th>파트너 연락처</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugoList.map((bugo) => (
                                    <tr key={bugo.id}>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                                            {formatDate(bugo.created_at)}
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#d4a84b' }}>
                                            {bugo.bugo_number}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{bugo.company_name}</td>
                                        <td>{bugo.owner_name}</td>
                                        <td style={{ fontWeight: '600' }}>{bugo.deceased_name}</td>
                                        <td>{bugo.mourner_name}</td>
                                        <td>{bugo.funeral_home}</td>
                                        <td>{bugo.room}</td>
                                        <td>{formatPhone(bugo.phone)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
