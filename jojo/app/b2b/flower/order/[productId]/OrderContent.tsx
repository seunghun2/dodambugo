'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FacilitySearchModal from '@/components/FacilitySearchModal';
import { IconSearch } from '@tabler/icons-react';
import styles from './order.module.css';

interface FlowerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  b2b_price?: number | null;
  discount_price: number | null;
  images: string[];
  sort_order: number;
  regional_prices?: Record<string, number> | null;
  special_surcharges?: Record<string, number> | null;
  exclude_regions?: string[] | null;
}

interface B2BUser {
  id: string;
  phone: string;
  company_name: string;
  owner_name: string;
}

interface BugoSelectItem {
  id: string;
  bugo_number: string;
  deceased_name: string;
  funeral_home: string;
  room_number: string;
  address: string;
  mourner_name: string;
  contact: string;
}

interface OrderContentProps {
  initialProduct: FlowerProduct;
  productId: string;
}

export default function OrderContent({ initialProduct, productId }: OrderContentProps) {
  const router = useRouter();
  const product = initialProduct;

  const [user, setUser] = useState<B2BUser | null>(null);
  const [bugoList, setBugoList] = useState<BugoSelectItem[]>([]);
  const [loadingBugo, setLoadingBugo] = useState(true);
  const [selectedBugoId, setSelectedBugoId] = useState<string>('manual');
  const [showFacilitySearch, setShowFacilitySearch] = useState(false);

  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 휴대폰 번호 하이픈 자동 포맷팅 (최대 11자리)
  const formatPhoneInput = (val: string): string => {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  // 리본 경조사어 옵션
  const messageOptions = [
    '삼가 故人의 冥福을 빕니다',
    '삼가 고인의 명복을 빕니다',
    '謹弔',
    '極樂往生發願',
    '극락왕생발원',
    '하나님의 위로가 함께 하시길 빕니다',
    '주님의 위로와 소망이 함께 하기를 기원합니다',
  ];

  // 폼 입력 상태
  const [form, setForm] = useState({
    deceasedName: '',
    funeralHome: '',
    roomNumber: '',
    address: '',
    mournerName: '',
    mournerContact: '',
    ribbonText1: '삼가 故人의 冥福을 빕니다',
    ribbonText2: '',
    customMessage: '',
  });

  // 초기화 및 사용자 정보 로드
  useEffect(() => {
    const userData = localStorage.getItem('b2b_user');
    const token = localStorage.getItem('b2b_token');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // B2B 유저의 부고 목록 불러오기
    const fetchBugoList = async () => {
      try {
        const { data, error } = await supabase
          .from('bugo')
          .select('id, bugo_number, deceased_name, funeral_home, room_number, address, mourner_name, contact')
          .eq('b2b_user_id', parsedUser.id)
          .is('deleted_at', null)
          .neq('template_id', 'flower_only')
          .neq('status', 'temporary')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBugoList(data || []);
      } catch (err) {
        console.error('부고 목록 불러오기 실패:', err);
      } finally {
        setLoadingBugo(false);
      }
    };

    fetchBugoList();
  }, [router]);

  // 부고 선택 변경 핸들러
  const handleBugoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBugoId(val);

    if (val === 'manual') {
      setForm(prev => ({
        ...prev,
        deceasedName: '',
        funeralHome: '',
        roomNumber: '',
        address: '',
        mournerName: '',
        mournerContact: '',
      }));
    } else {
      const selected = bugoList.find(b => b.id === val);
      if (selected) {
        setForm(prev => ({
          ...prev,
          deceasedName: selected.deceased_name || '',
          funeralHome: selected.funeral_home || '',
          roomNumber: selected.room_number || '',
          address: selected.address || '',
          mournerName: selected.mourner_name || '',
          mournerContact: selected.contact ? formatPhoneInput(selected.contact) : '',
        }));
      }
    }
  };

  // 주문 제출 핸들러
  const handleNext = async () => {
    if (!form.address.trim()) {
      alert('배송지 주소를 입력(또는 주소 검색)해주세요.');
      return;
    }
    if (!form.funeralHome.trim()) {
      alert('장례식장명을 입력해주세요.');
      return;
    }
    if (!form.mournerName.trim()) {
      alert('상주 성함을 입력해주세요.');
      return;
    }
    if (!form.mournerContact.trim()) {
      alert('상주 연락처를 입력해주세요.');
      return;
    }
    if (!form.ribbonText2.trim()) {
      alert('보내는 분 리본 문구(보내는 분 성함/회사명)를 입력해주세요.');
      return;
    }
    if (isExcludedRegion) {
      alert('해당 장례식장은 화원 직배송이 불가능한 권역(도서산간 등)으로 주문 접수가 어렵습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      let targetBugoId = '';
      let targetBugoNumber = '';
      let bugoDataPayload: any = null;

      if (selectedBugoId === 'manual') {
        // 직접 입력의 경우, Supabase에 가상/임시 부고장 1건 인서트 진행
        // 중복 없는 부고 번호(4자리) 생성
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

        const bugoNo = await generateBugoNumber();
        const ownerToken = 'xxxxxxxxxxxx'.replace(/x/g, () =>
          Math.floor(Math.random() * 16).toString(16)
        );

        // 3일 뒤 날짜 구하기
        const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const newBugo = {
          bugo_number: bugoNo,
          deceased_name: form.mournerName ? `${form.mournerName} 상가` : '상가',
          gender: '남',
          funeral_date: futureDate,
          relationship: '상주',
          mourner_name: form.mournerName,
          contact: form.mournerContact || '010-0000-0000',
          funeral_home: form.funeralHome,
          room_number: form.roomNumber,
          address: form.address || '',
          b2b_user_id: user?.id || null,
          owner_token: ownerToken,
          template_id: 'flower_only',
          status: 'temporary',
        };

        const { data: insertedBugo, error: insertError } = await supabase
          .from('bugo')
          .insert([newBugo])
          .select('id, bugo_number')
          .single();

        if (insertError) throw insertError;

        targetBugoId = insertedBugo.id;
        targetBugoNumber = insertedBugo.bugo_number;
        bugoDataPayload = { ...newBugo, id: targetBugoId };
      } else {
        const selected = bugoList.find(b => b.id === selectedBugoId);
        if (!selected) {
          alert('선택한 부고 정보를 찾을 수 없습니다.');
          setIsSubmitting(false);
          return;
        }
        targetBugoId = selected.id;
        targetBugoNumber = selected.bugo_number;
        bugoDataPayload = selected;
      }

      // 최종 리본 문구 결정
      const finalRibbon1 = isCustomMessage ? form.customMessage : form.ribbonText1;

      // 지역별 가격 계산
      const targetAddress = form.address || form.funeralHome || '';
      const REGION_KEYWORDS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
      const targetRegion = REGION_KEYWORDS.find(r => targetAddress.includes(r)) || '';
      const basePrice = product.discount_price || product.b2b_price || product.price;
      const regSurcharge = (product.regional_prices && targetRegion && product.regional_prices[targetRegion]) || 0;
      let specSurcharge = 0;
      if (product.special_surcharges && targetAddress) {
        for (const [keyword, surcharge] of Object.entries(product.special_surcharges)) {
          if (targetAddress.includes(keyword)) {
            specSurcharge = Math.max(specSurcharge, surcharge);
          }
        }
      }
      const finalB2bProductPrice = basePrice + regSurcharge + specSurcharge;

      // sessionStorage 저장
      const orderPayload = {
        ribbonText1: finalRibbon1,
        ribbonText2: form.ribbonText2,
        recipientName: form.mournerName,
        productName: product.name,
        productPrice: finalB2bProductPrice,
        funeralHome: form.funeralHome,
        room: form.roomNumber,
        address: form.address,
        // B2B 커미션 수당 지급 대상 B2B 유저 ID를 partner_data에 주입
        partner_data: {
          b2b_user_id: user?.id || null,
        },
      };

      sessionStorage.setItem(`order_${targetBugoId}_${product.sort_order}`, JSON.stringify(orderPayload));
      sessionStorage.setItem(`product_cache_${product.sort_order}`, JSON.stringify(product));
      sessionStorage.setItem(`bugo_cache_${targetBugoId}`, JSON.stringify(bugoDataPayload));

      // B2C 결제 페이지로 이동하여 결제 모듈 호출
      router.push(`/view/${targetBugoId}/payment/${product.sort_order}`);
    } catch (err) {
      console.error('주문 정보 임시 생성 및 저장 실패:', err);
      alert('주문 진행 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBugoSelected = selectedBugoId !== 'manual';

  // 📍 실시간 지역 및 도서산간 할증 및 배송제외 계산
  const fullCheckText = `${form.address} ${form.funeralHome}`.trim();
  const REGION_KEYWORDS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  const targetRegion = REGION_KEYWORDS.find(r => fullCheckText.includes(r)) || '';
  
  const basePrice = product.discount_price || product.b2b_price || product.price;
  const regSurcharge = (product.regional_prices && targetRegion && product.regional_prices[targetRegion]) || 0;
  
  let specSurcharge = 0;
  let matchedSpecialArea = '';
  if (product.special_surcharges && fullCheckText) {
    for (const [keyword, surcharge] of Object.entries(product.special_surcharges)) {
      if (fullCheckText.includes(keyword)) {
        if (surcharge > specSurcharge) {
          specSurcharge = surcharge;
          matchedSpecialArea = keyword;
        }
      }
    }
  }

  const totalSurcharge = regSurcharge + specSurcharge;
  const currentTotalPrice = basePrice + totalSurcharge;
  
  // 배송 제외 지역/장례식장 판별
  const isExcludedRegion = !!(
    fullCheckText && (
      (product.exclude_regions && product.exclude_regions.some((r: string) => r && fullCheckText.includes(r))) ||
      (product.exclude_facilities && product.exclude_facilities.some((f: string) => f && fullCheckText.includes(f)))
    )
  );

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>주문하기</span>
        <div className={styles.headerRightPlaceholder} />
      </header>

      <div className={styles.content}>
        {/* 선택한 상품 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>선택한 상품</h2>
          <div className={styles.selectedProduct}>
            <div className={styles.productImage}>
              <img
                src={product.images?.[0] || '/images/flower-wreath.png'}
                alt={product.name}
              />
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <div className={styles.priceRow}>
                <p className={styles.price}>
                  {currentTotalPrice.toLocaleString()}원
                </p>
                {totalSurcharge > 0 && (
                  <span className={styles.surchargeTag}>
                    +지역배송비 {totalSurcharge.toLocaleString()}원
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 배송지(부고장) 선택 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>배송 부고장 선택</h2>
          <div className={styles.formGroup}>
            <select
              className={styles.select}
              value={selectedBugoId}
              onChange={handleBugoChange}
              disabled={loadingBugo}
            >
              <option value="manual">직접 입력 (신규/외부 장례식장 배송)</option>
              {bugoList.map(b => (
                <option key={b.id} value={b.id}>
                  故 {b.deceased_name}님 / {b.funeral_home} {b.room_number || ''}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 배송 정보 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>배송지(장례식장) 정보</h2>
          
          {/* 장례식장 주소 겸 검색 바 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              장례식장 / 주소<span className={styles.required}>*</span>
            </label>
            <div
              className={styles.searchBar}
              onClick={() => !isBugoSelected && setShowFacilitySearch(true)}
              style={isBugoSelected ? { cursor: 'default', opacity: 0.6 } : undefined}
            >
              <span
                className={styles.searchPlaceholder}
                style={{ color: form.address ? '#1A1F27' : '#9E9E9E' }}
              >
                {form.address || '장례식장을 검색해주세요'}
              </span>
              <IconSearch size={18} stroke={1.8} color="#4E5968" />
            </div>
          </div>

          {/* 할증 적용 안내 배너 */}
          {totalSurcharge > 0 && (
            <div className={styles.surchargeNotice}>
              <div className={styles.surchargeNoticeTitle}>
                지역 배송비 (+{totalSurcharge.toLocaleString()}원) 안내
              </div>
              선택하신 장례식장(<strong>{matchedSpecialArea || targetRegion || '해당 지역'}</strong>)은 원거리/도서산간 배송 권역으로 추가 배송비가 적용되었습니다.
            </div>
          )}

          {/* 배송 불가 지역 안내 */}
          {isExcludedRegion && (
            <div className={styles.excludeNotice}>
              <strong>배송 제한 지역 안내</strong>: 해당 장례식장은 화훼사 직배송이 불가능한 권역(도서산간 등)으로 주문 접수가 어렵습니다.
            </div>
          )}

          {/* 장례식장명 + 호실 2열 배치 */}
          <div className={styles.row}>
            <div className={styles.fieldFlex1}>
              <label className={styles.label}>
                장례식장명<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="장례식장명"
                value={form.funeralHome}
                onChange={e => setForm({ ...form, funeralHome: e.target.value })}
                disabled={isBugoSelected}
              />
            </div>
            <div className={styles.fieldFlex1}>
              <label className={styles.label}>호실</label>
              <input
                type="text"
                className={styles.input}
                placeholder="호실(예시:102호)"
                value={form.roomNumber}
                onChange={e => setForm({ ...form, roomNumber: e.target.value })}
                disabled={isBugoSelected}
              />
            </div>
          </div>

          {/* 받으시는 상주명 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              받으시는 상주명<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="예시) 홍길동"
              value={form.mournerName}
              onChange={e => setForm({ ...form, mournerName: e.target.value })}
              disabled={isBugoSelected}
            />
          </div>

          {/* 상주 연락처 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              상주 연락처<span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={13}
              className={styles.input}
              placeholder="예시) 010-1234-5678"
              value={form.mournerContact}
              onChange={e => setForm({ ...form, mournerContact: formatPhoneInput(e.target.value) })}
              disabled={isBugoSelected}
            />
          </div>
        </section>

        {/* 리본 문구 정보 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>화환 리본 문구 입력</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              보내는 리본 문구 (오른쪽 리본)<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="예시) 주식회사 길동 대표 홍길동"
              value={form.ribbonText2}
              onChange={e => setForm({ ...form, ribbonText2: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              경조사어 선택 (왼쪽 리본)<span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              value={isCustomMessage ? 'custom' : form.ribbonText1}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setIsCustomMessage(true);
                  setForm({ ...form, ribbonText1: '', customMessage: '' });
                } else {
                  setIsCustomMessage(false);
                  setForm({ ...form, ribbonText1: e.target.value, customMessage: '' });
                }
              }}
            >
              {messageOptions.map((msg, idx) => (
                <option key={idx} value={msg}>{msg}</option>
              ))}
              <option value="custom">직접 입력</option>
            </select>
          </div>

          {isCustomMessage && (
            <div className={styles.formGroup}>
              <label className={styles.label}>경조사어 직접 입력</label>
              <input
                type="text"
                className={styles.input}
                placeholder="리본 문구를 직접 입력해주세요"
                value={form.customMessage}
                onChange={e => setForm({ ...form, customMessage: e.target.value })}
              />
            </div>
          )}
        </section>
      </div>

      {/* 하단 CTA */}
      <footer className={styles.footer}>
        <button
          className={styles.btnSubmit}
          onClick={handleNext}
          disabled={isSubmitting || isExcludedRegion}
        >
          {isExcludedRegion
            ? '배송 불가 지역 (주문 불가)'
            : isSubmitting
            ? '결제 준비 중...'
            : `${currentTotalPrice.toLocaleString()}원 결제하기`}
        </button>
      </footer>

      {/* 부고장 제작과 동일한 장례식장 / 주소 검색 모달 */}
      <FacilitySearchModal
        isOpen={showFacilitySearch}
        onClose={() => setShowFacilitySearch(false)}
        onSelect={(facility) => {
          setForm(prev => ({
            ...prev,
            funeralHome: facility.name,
            address: facility.address,
          }));
          setShowFacilitySearch(false);
        }}
      />
    </div>
  );
}
