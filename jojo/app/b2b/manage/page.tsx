'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './manage.module.css';

interface User {
  id: string;
}

interface BugoItem {
  bugo_number: string;
  deceased_name: string;
  funeral_home?: string;
  room_number?: string;
  funeral_date?: string;
  address?: string;
  created_at: string;
  mourners?: string;
  religion?: string;
  religion_custom?: string;
  age?: number;
  gender?: string;
  death_date?: string;
  death_time?: string;
  encoffin_date?: string;
  encoffin_time?: string;
  funeral_time?: string;
  burial_place?: string;
  burial_place2?: string;
  message?: string;
  relationship?: string;
  mourner_name?: string;
  contact?: string;
  account_info?: string;
  status?: string;
}

export default function B2BManagePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bugoList, setBugoList] = useState<BugoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [selectedBugo, setSelectedBugo] = useState<BugoItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 검색 & 필터 & 정렬 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'making' | 'done'>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'old'>('recent');

  // 필터 바텀시트 모달 상태
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // 데이터 로드 공통 함수
  const fetchBugoList = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bugo')
        .select('*')
        .eq('b2b_user_id', userId);

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('token')) {
          localStorage.removeItem('b2b_token');
          localStorage.removeItem('b2b_user');
          router.push('/b2b/login');
          return;
        }
        throw error;
      }
      setBugoList(data || []);
    } catch (err) {
      console.error('부고 목록 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('b2b_token');
    const userData = localStorage.getItem('b2b_user');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchBugoList(parsedUser.id);
  }, [router, fetchBugoList]);

  // 부고 삭제 처리
  const handleDeleteBugo = async (bugoNumber: string) => {
    if (!confirm('부고장을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('bugo')
        .delete()
        .eq('bugo_number', bugoNumber);

      if (error) throw error;
      alert('삭제되었습니다.');
      setBugoList(prev => prev.filter(b => b.bugo_number !== bugoNumber));
      setShowModal(false);
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  // 부고 복제 처리
  const handleDuplicateBugo = async (item: BugoItem) => {
    if (!confirm('동일한 내용으로 부고장을 복제하시겠습니까?')) return;
    try {
      const generateBugoNumber = async (): Promise<string> => {
        for (let i = 0; i < 20; i++) {
          const num = Math.floor(1000 + Math.random() * 9000).toString();
          const { data } = await supabase
            .from('bugo')
            .select('bugo_number')
            .eq('bugo_number', num)
            .single();
          if (!data) return num;
        }
        return Math.floor(10000 + Math.random() * 90000).toString();
      };

      const newBugoNum = await generateBugoNumber();
      const newOwnerToken = 'xxxxxxxxxxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
      );

      const duplicateData = {
        ...item,
        bugo_number: newBugoNum,
        owner_token: newOwnerToken,
        created_at: new Date().toISOString(),
        deceased_name: `${item.deceased_name} (복제)`,
      };

      // primary key id는 Supabase가 자동 생성하도록 삭제
      delete (duplicateData as any).id;

      const { error } = await supabase.from('bugo').insert([duplicateData]);
      if (error) throw error;

      alert(`부고장이 성공적으로 복제되었습니다. (신규 부고번호: #${newBugoNum})`);
      setShowModal(false);
      
      if (user?.id) {
        setLoading(true);
        fetchBugoList(user.id);
      }
    } catch (err) {
      console.error('복제 실패:', err);
      alert('복제에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  // 상주 리스트 텍스트 파싱용 포맷터
  const getMournersText = useCallback((mournersJson?: string) => {
    if (!mournersJson) return '상주 정보 없음';
    try {
      const parsed = typeof mournersJson === 'string' ? JSON.parse(mournersJson) : mournersJson;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const primary = parsed[0]?.name || '';
        const count = parsed.length;
        if (count > 1) {
          return `상주 ${primary} 외 ${count - 1}명`;
        }
        return `상주 ${primary}`;
      }
    } catch {
      // ignore
    }
    return '상주 정보 없음';
  }, []);

  // 오늘 날짜 문자열 구하기 (KST 기준)
  const todayStr = useMemo(() => {
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return kstDate.toISOString().split('T')[0];
  }, []);

  // 날짜 포맷 (YYYY. MM. DD)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}. ${month}. ${day}`;
    } catch {
      return dateStr;
    }
  };

  // 검색, 필터, 정렬 가공된 목록 추출
  const filteredList = useMemo(() => {
    let list = [...bugoList];

    // 1. 검색어 필터링
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      list = list.filter(b => {
        const deceasedMatch = b.deceased_name?.toLowerCase().includes(query);
        let mournerMatch = false;

        if (b.mourners) {
          try {
            const parsed = typeof b.mourners === 'string' ? JSON.parse(b.mourners) : b.mourners;
            if (Array.isArray(parsed)) {
              mournerMatch = parsed.some((m: any) => m.name?.toLowerCase().includes(query));
            }
          } catch {
            // ignore
          }
        }
        return deceasedMatch || mournerMatch;
      });
    }

    // 2. 상태 필터링
    if (statusFilter !== 'all') {
      list = list.filter(b => {
        const isDone = b.funeral_date && b.funeral_date < todayStr;
        return statusFilter === 'done' ? isDone : !isDone;
      });
    }

    // 3. 정렬 처리
    list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'recent' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [bugoList, searchTerm, statusFilter, sortOrder, todayStr]);

  if (loading) {
    return (
      <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>부고 정보를 불러오고 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 검색창을 포함한 초록색 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="상주 / 고인을 검색하세요."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.searchIcons}>
            {searchTerm && (
              <button className={styles.clearBtn} onClick={() => setSearchTerm('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </header>

      {/* 리스트 건수 및 필터 정렬 버튼 */}
      <div className={styles.listSummary}>
        <span className={styles.countText}>
          <em>{filteredList.length}</em> 건의 목록 조회
        </span>
        <div className={styles.filterControls}>
          <button
            className={styles.filterButton}
            onClick={() => setShowStatusModal(true)}
          >
            {statusFilter === 'all' ? '전체' : statusFilter === 'making' ? '제작중' : '발인완료'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E94A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            className={styles.filterButton}
            onClick={() => setShowSortModal(true)}
          >
            {sortOrder === 'recent' ? '최근일순' : '과거순'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E94A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* 부고장 리스트 */}
      <div className={styles.listContainer}>
        {filteredList.length === 0 ? (
          <div className={styles.emptyState}>
            조회된 부고장 목록이 없습니다.
          </div>
        ) : (
          filteredList.map((b) => {
            const isDone = b.funeral_date && b.funeral_date < todayStr;
            const mournersText = getMournersText(b.mourners);
            const locationText = `${b.funeral_home || ''} ${b.room_number || ''}`.trim() || '빈소 정보 없음';

            return (
              <div
                key={b.bugo_number}
                className={styles.itemCard}
                onClick={() => {
                  setSelectedBugo(b);
                  setShowModal(true);
                }}
              >
                <div className={styles.itemMain}>
                  <h2 className={styles.deceasedName}>故{b.deceased_name}</h2>
                  <span className={styles.createdDate}>{formatDate(b.created_at)}</span>
                </div>
                <div className={styles.itemSub}>
                  <p className={styles.subText}>
                    {mournersText}, {locationText}
                  </p>
                  <span className={`${styles.badge} ${isDone ? styles.badgeDone : styles.badgeMaking}`}>
                    {isDone ? '발인 완료' : '제작중'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 상세 내용 확인 모달 (바텀시트) */}
      {showModal && selectedBugo && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>모바일 부고장 내용을 확인해주세요.</h2>
            
            <div className={styles.modalTable}>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>부고장테마</span>
                <span className={styles.modalValue}>기본 부고장 테마</span>
              </div>
              
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>장례식장정보</span>
                <span className={styles.modalValue}>
                  {selectedBugo.funeral_home ? (
                    <>
                      {selectedBugo.address && <>{selectedBugo.address}<br /></>}
                      {selectedBugo.funeral_home} {selectedBugo.room_number || ''}
                    </>
                  ) : (
                    <span className={styles.noInfo}><span className={styles.noInfoIcon}>!</span>해당 정보가 없습니다</span>
                  )}
                </span>
              </div>

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>고인 정보</span>
                <span className={styles.modalValue}>
                  故 {selectedBugo.deceased_name}
                  {selectedBugo.religion && selectedBugo.religion !== '없음' ? ` / ${selectedBugo.religion === '기타' ? selectedBugo.religion_custom : selectedBugo.religion}` : ''}
                  {selectedBugo.age ? ` / ${selectedBugo.age}세` : ''}
                  {selectedBugo.gender ? ` / ${selectedBugo.gender === '남' ? '남성' : '여성'}` : ''}
                </span>
              </div>

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>별세일</span>
                <span className={styles.modalValue}>
                  {selectedBugo.death_date ? (
                    `${selectedBugo.death_date}${selectedBugo.death_time ? ` / ${selectedBugo.death_time}` : ''}`
                  ) : (
                    <span className={styles.noInfo}><span className={styles.noInfoIcon}>!</span>해당 정보가 없습니다</span>
                  )}
                </span>
              </div>

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>입관일</span>
                <span className={styles.modalValue}>
                  {selectedBugo.encoffin_date ? (
                    `${selectedBugo.encoffin_date}${selectedBugo.encoffin_time ? ` / ${selectedBugo.encoffin_time}` : ''}`
                  ) : (
                    <span className={styles.noInfo}><span className={styles.noInfoIcon}>!</span>해당 정보가 없습니다</span>
                  )}
                </span>
              </div>

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>발인일</span>
                <span className={styles.modalValue}>
                  {selectedBugo.funeral_date ? (
                    `${selectedBugo.funeral_date}${selectedBugo.funeral_time ? ` / ${selectedBugo.funeral_time}` : ''}`
                  ) : (
                    <span className={styles.noInfo}><span className={styles.noInfoIcon}>!</span>해당 정보가 없습니다</span>
                  )}
                </span>
              </div>

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>1차장지</span>
                <span className={styles.modalValue}>
                  {selectedBugo.burial_place ? (
                    `${selectedBugo.burial_place}${selectedBugo.burial_place2 ? ` / ${selectedBugo.burial_place2}` : ''}`
                  ) : (
                    <span className={styles.noInfo}><span className={styles.noInfoIcon}>!</span>해당 정보가 없습니다</span>
                  )}
                </span>
              </div>

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>대표상주</span>
                <span className={styles.modalValue}>
                  {selectedBugo.mourner_name ? (
                    <>
                      {selectedBugo.mourner_name} / {selectedBugo.relationship || '상주'} / {selectedBugo.contact || ''}
                      {(() => {
                        try {
                          const accInfo = selectedBugo.account_info ? JSON.parse(selectedBugo.account_info) : null;
                          if (Array.isArray(accInfo) && accInfo.length > 0) {
                            return <><br />{accInfo[0].bank} / {accInfo[0].number}</>;
                          }
                        } catch {}
                        return null;
                      })()}
                    </>
                  ) : (
                    <span className={styles.noInfo}><span className={styles.noInfoIcon}>!</span>해당 정보가 없습니다</span>
                  )}
                </span>
              </div>

              {(() => {
                try {
                  const parsedMourners = selectedBugo.mourners ? JSON.parse(selectedBugo.mourners) : [];
                  if (Array.isArray(parsedMourners) && parsedMourners.length > 1) {
                    return parsedMourners.slice(1).map((m: any, i: number) => (
                      <div className={styles.modalRow} key={i}>
                        <span className={styles.modalLabel}>상주</span>
                        <span className={styles.modalValue}>
                          {m.name} / {m.relationship} / {m.contact || ''}
                          {m.bank && m.accountNumber && (
                            <><br />{m.bank} / {m.accountNumber}</>
                          )}
                        </span>
                      </div>
                    ));
                  }
                } catch {}
                return null;
              })()}

              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>알림 메세지</span>
                <span className={styles.modalValue}>
                  {selectedBugo.message || '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.'}
                </span>
              </div>
            </div>

            {/* 복제 및 삭제 */}
            <div className={styles.modalActionRow}>
              <button className={styles.btnDuplicate} onClick={() => handleDuplicateBugo(selectedBugo)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                부고 복제
              </button>
              <button className={styles.btnDeleteLink} onClick={() => handleDeleteBugo(selectedBugo.bugo_number)}>
                부고 삭제하기
              </button>
            </div>

            {/* 모달 하단 버튼 */}
            <div className={styles.modalButtonGroup}>
              <div className={styles.modalRowButtons}>
                <button className={styles.btnModalModify} onClick={() => router.push(`/b2b/create?edit=${selectedBugo.bugo_number}`)}>
                  부고수정
                </button>
                <button className={styles.btnModalGo} onClick={() => router.push(`/b2b/create/complete/${selectedBugo.bugo_number}`)}>
                  바로가기
                </button>
              </div>
              <button className={styles.btnModalCancel} onClick={() => setShowModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상태 필터 바텀시트 */}
      {showStatusModal && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.bottomSheetContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHeader}>
              <h3 className={styles.bottomSheetTitle}>상태 필터 선택</h3>
            </div>
            <div className={styles.bottomSheetList}>
              <button
                className={`${styles.bottomSheetItem} ${statusFilter === 'all' ? styles.activeItem : ''}`}
                onClick={() => {
                  setStatusFilter('all');
                  setShowStatusModal(false);
                }}
              >
                전체
              </button>
              <button
                className={`${styles.bottomSheetItem} ${statusFilter === 'making' ? styles.activeItem : ''}`}
                onClick={() => {
                  setStatusFilter('making');
                  setShowStatusModal(false);
                }}
              >
                제작중
              </button>
              <button
                className={`${styles.bottomSheetItem} ${statusFilter === 'done' ? styles.activeItem : ''}`}
                onClick={() => {
                  setStatusFilter('done');
                  setShowStatusModal(false);
                }}
              >
                발인완료
              </button>
            </div>
            <button className={styles.bottomSheetCancel} onClick={() => setShowStatusModal(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 정렬 필터 바텀시트 */}
      {showSortModal && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowSortModal(false)}>
          <div className={styles.bottomSheetContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHeader}>
              <h3 className={styles.bottomSheetTitle}>정렬 순서 선택</h3>
            </div>
            <div className={styles.bottomSheetList}>
              <button
                className={`${styles.bottomSheetItem} ${sortOrder === 'recent' ? styles.activeItem : ''}`}
                onClick={() => {
                  setSortOrder('recent');
                  setShowSortModal(false);
                }}
              >
                최근일순
              </button>
              <button
                className={`${styles.bottomSheetItem} ${sortOrder === 'old' ? styles.activeItem : ''}`}
                onClick={() => {
                  setSortOrder('old');
                  setShowSortModal(false);
                }}
              >
                과거순
              </button>
            </div>
            <button className={styles.bottomSheetCancel} onClick={() => setShowSortModal(false)}>
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
