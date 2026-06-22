'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FuneralHomeSection from './sections/FuneralHomeSection';
import DeceasedSection from './sections/DeceasedSection';
import DateTimeSection from './sections/DateTimeSection';
import MournerSection from './sections/MournerSection';
import PhotoSection from './sections/PhotoSection';
import OptionsSection from './sections/OptionsSection';
import FacilitySearchModal from '@/components/FacilitySearchModal';
import styles from './create.module.css';

// === 타입 ===
export interface Mourner {
  relationship: string;
  name: string;
  contact: string;
  bank?: string;
  accountHolder?: string;
  accountNumber?: string;
}

export interface BugoFormData {
  // 장례식장
  funeral_type: string;
  funeral_home: string;
  room_number: string;
  funeral_home_tel: string;
  address: string;
  address_detail: string;
  // 고인
  deceased_name: string;
  age: string;
  gender: string;
  hide_gender: boolean;
  religion: string;
  religion_custom: string;
  religious_title: string;
  show_religious_title: boolean;
  // 영정
  photo_url: string;
  show_photo: boolean;
  // 일시
  death_date: string;
  death_time: string;
  checkin_date: string;
  checkin_time: string;
  encoffin_date: string;
  encoffin_time: string;
  funeral_date: string;
  funeral_time: string;
  ilpo_date: string;
  ilpo_time: string;
  // 장지
  burial_place: string;
  burial_place2: string;
  // 옵션
  message: string;
  show_message: boolean;
  death_term: string;
  partner_logo_url: string;
  hide_flower_order: boolean;
  auto_reply: boolean;
}

const initialFormData: BugoFormData = {
  funeral_type: '일반장례',
  funeral_home: '',
  room_number: '',
  funeral_home_tel: '',
  address: '',
  address_detail: '',
  deceased_name: '',
  age: '',
  gender: '',
  hide_gender: false,
  religion: '없음',
  religion_custom: '',
  religious_title: '',
  show_religious_title: false,
  photo_url: '',
  show_photo: false,
  death_date: '',
  death_time: '',
  checkin_date: '',
  checkin_time: '',
  encoffin_date: '',
  encoffin_time: '',
  funeral_date: '',
  funeral_time: '',
  ilpo_date: '',
  ilpo_time: '',
  burial_place: '',
  burial_place2: '',
  message: '',
  show_message: false,
  death_term: '별세',
  partner_logo_url: '',
  hide_flower_order: false,
  auto_reply: true,
};

// 부고번호 생성 (4자리 유니크)
async function generateBugoNumber(): Promise<string> {
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
}

// 상주 토큰 생성
function generateOwnerToken(): string {
  return 'xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export default function B2BCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BugoFormData>(initialFormData);
  const [mourners, setMourners] = useState<Mourner[]>([
    { relationship: '', name: '', contact: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFacilitySearch, setShowFacilitySearch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // B2B 수정 모드 관련 상태 추가
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBugoNumber, setEditBugoNumber] = useState<string | null>(null);

  // 로그인 확인 및 수정 데이터 조회
  useEffect(() => {
    const token = localStorage.getItem('b2b_token');
    const userStr = localStorage.getItem('b2b_user');
    if (!token) {
      router.push('/b2b/login');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const editNum = params.get('edit');
    if (editNum) {
      setEditBugoNumber(editNum);
      setIsEditMode(true);
      loadBugoData(editNum);
    } else if (userStr) {
      // [신규 작성 모드] 로그인 파트너의 장례식장 정보 및 자주찾는 식장 정보 자동 완성
      try {
        const user = JSON.parse(userStr);
        const hasFuneralInCompany = user.company_name && (user.company_name.includes('장례식장') || user.company_name.includes('장례'));

        if (hasFuneralInCompany) {
          // 1. 소속 회사/장례식장명을 기본값으로 설정
          setFormData(prev => ({
            ...prev,
            funeral_home: user.company_name,
          }));

          // 2. 자주찾는 식장 목록(b2b_favorite_facilities)에서 주소/연락처 검색 및 매칭
          const stored = localStorage.getItem('b2b_favorite_facilities');
          if (stored) {
            const favorites = JSON.parse(stored);
            const matched = favorites.find((f: any) => f.name === user.company_name);
            if (matched) {
              setFormData(prev => ({
                ...prev,
                funeral_home: matched.name,
                address: matched.address || '',
                funeral_home_tel: matched.tel || '',
              }));
            } else if (favorites.length > 0) {
              // 매칭되는 항목이 없더라도 자주찾는 목록의 첫 번째 식장으로 채워줌
              setFormData(prev => ({
                ...prev,
                funeral_home: favorites[0].name,
                address: favorites[0].address || '',
                funeral_home_tel: favorites[0].tel || '',
              }));
            }
          }
        }
      } catch (e) {
        console.error('B2B 파트너 장례식장 자동 완성 로드 오류:', e);
      }
    }
  }, [router]);

  const loadBugoData = async (bugoNum: string) => {
    try {
      const b2bUserStr = typeof window !== 'undefined' ? localStorage.getItem('b2b_user') : null;
      const b2bUser = b2bUserStr ? JSON.parse(b2bUserStr) : null;
      if (!b2bUser || !b2bUser.id) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        router.push('/b2b/login');
        return;
      }

      const { data, error } = await supabase
        .from('bugo')
        .select('*')
        .eq('bugo_number', bugoNum)
        .single();
      
      if (error) throw error;
      if (data) {
        if (data.b2b_user_id !== b2bUser.id) {
          alert('해당 부고장에 대한 관리 권한이 없습니다.');
          router.push('/b2b/manage');
          return;
        }
        setFormData({
          funeral_type: data.funeral_type || '일반장례',
          funeral_home: data.funeral_home || '',
          room_number: data.room_number || '',
          funeral_home_tel: data.funeral_home_tel || '',
          address: data.address || '',
          address_detail: data.address_detail || '',
          deceased_name: data.deceased_name || '',
          age: data.age ? data.age.toString() : '',
          gender: data.gender || '',
          hide_gender: data.hide_gender || false,
          religion: data.religion || '없음',
          religion_custom: data.religion_custom || '',
          religious_title: data.religious_title || '',
          show_religious_title: data.show_religious_title || false,
          photo_url: data.photo_url || '',
          show_photo: !!data.photo_url,
          death_date: data.death_date || '',
          death_time: data.death_time || '',
          checkin_date: data.checkin_date || '',
          checkin_time: data.checkin_time || '',
          encoffin_date: data.encoffin_date || '',
          encoffin_time: data.encoffin_time || '',
          funeral_date: data.funeral_date || '',
          funeral_time: data.funeral_time || '',
          ilpo_date: data.ilpo_date || '',
          ilpo_time: data.ilpo_time || '',
          burial_place: data.burial_place || '',
          burial_place2: data.burial_place2 || '',
          message: data.message || '',
          show_message: !!data.message,
          death_term: data.death_term || '별세',
          partner_logo_url: data.partner_logo_url || '',
          hide_flower_order: data.hide_flower_order || false,
          auto_reply: data.auto_reply !== false,
        });

        let parsedMourners: Mourner[] = [];
        if (data.mourners) {
          try {
            parsedMourners = typeof data.mourners === 'string' ? JSON.parse(data.mourners) : data.mourners;
          } catch (e) {
            console.error('상주 파싱 에러', e);
          }
        }
        if (!Array.isArray(parsedMourners) || parsedMourners.length === 0) {
          parsedMourners = [{ relationship: '', name: '', contact: '' }];
        }

        if (data.account_info) {
          try {
            const parsedAcc = typeof data.account_info === 'string' ? JSON.parse(data.account_info) : data.account_info;
            if (Array.isArray(parsedAcc) && parsedAcc.length > 0) {
              parsedMourners[0].bank = parsedAcc[0].bank || '';
              parsedMourners[0].accountNumber = parsedAcc[0].number || '';
              parsedMourners[0].accountHolder = parsedAcc[0].holder || '';
            }
          } catch (e) {
            console.error('대표상주 계좌 파싱 에러', e);
          }
        }

        setMourners(parsedMourners);
      }
    } catch (err) {
      console.error('부고 불러오기 실패:', err);
      alert('부고 정보를 불러오는데 실패했습니다.');
    }
  };

  // 폼 필드 업데이트
  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'funeral_type' && value === '무빈소장례') {
        next.hide_flower_order = true;
      }
      return next;
    });
    // 에러 클리어
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // 일시 필드 지우기
  const handleClearFields = useCallback((fields: string[]) => {
    setFormData(prev => {
      const next = { ...prev };
      fields.forEach(f => {
        (next as Record<string, string | boolean>)[f] = '';
      });
      return next;
    });
  }, []);

  // 유효성 검사
  const validate = (): Record<string, string> | null => {
    const newErrors: Record<string, string> = {};

    if (!formData.deceased_name.trim()) newErrors.deceased_name = '고인명을 입력해주세요';
    if (!formData.age.trim()) newErrors.age = '연세를 입력해주세요';
    if (!formData.gender && !formData.hide_gender) newErrors.gender = '성별을 선택해주세요';

    if (formData.funeral_type !== '무빈소장례') {
      if (!formData.funeral_home.trim()) newErrors.funeral_home = '장례식장명을 입력해주세요';
      if (!formData.room_number.trim()) newErrors.room_number = '호실을 입력해주세요';
    }

    if (!formData.funeral_date) newErrors.funeral_date = '발인 날짜를 선택해주세요';
    if (!formData.funeral_time) newErrors.funeral_time = '발인 시간을 입력해주세요';

    // 대표상주 확인
    if (!mourners[0]?.name?.trim()) newErrors.mourner_name = '대표상주 성함을 입력해주세요';
    if (!mourners[0]?.relationship) newErrors.mourner_relationship = '대표상주 관계를 선택해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? null : newErrors;
  };

  // 저장하기 (임시저장)
  const handleSave = async () => {
    const user = JSON.parse(localStorage.getItem('b2b_user') || '{}');
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: { ...formData, mourners },
          templateId: 'basic',
          b2bUserId: user.id,
        }),
      });
      alert('저장되었습니다.');
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  // 1단계: 유효성 검사 후 미리보기 모달 표시
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (validationErrors) {
      // 첫 번째 에러 메시지 얼럿 노출
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstErrorMessage = validationErrors[firstErrorKey];
      if (firstErrorMessage) alert(firstErrorMessage);

      // 첫 번째 에러로 스크롤
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setShowPreview(true);
  };

  // 2단계: 실제 제출 처리
  const handleConfirmSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowPreview(false);

    try {
      const user = JSON.parse(localStorage.getItem('b2b_user') || '{}');
      const bugoNumber = isEditMode && editBugoNumber ? editBugoNumber : await generateBugoNumber();

      const bugoData: any = {
        deceased_name: formData.deceased_name,
        gender: formData.hide_gender ? '' : formData.gender,
        hide_gender: formData.hide_gender,
        relationship: mourners[0]?.relationship || '',
        mourner_name: mourners[0]?.name || '',
        contact: mourners[0]?.contact || '',
        age: formData.age ? parseInt(formData.age) : null,
        religion: formData.religion === '없음' ? null : formData.religion,
        religious_title: formData.religious_title || null,
        show_religious_title: formData.show_religious_title,
        funeral_type: formData.funeral_type,
        funeral_home: formData.funeral_home || null,
        room_number: formData.room_number || null,
        funeral_home_tel: formData.funeral_home_tel || null,
        address: formData.address || null,
        address_detail: formData.address_detail || null,
        death_date: formData.death_date || null,
        death_time: formData.death_time || null,
        checkin_date: formData.checkin_date || null,
        checkin_time: formData.checkin_time || null,
        encoffin_date: formData.encoffin_date || null,
        encoffin_time: formData.encoffin_time || null,
        funeral_date: formData.funeral_date,
        funeral_time: formData.funeral_time || null,
        ilpo_date: formData.ilpo_date || null,
        ilpo_time: formData.ilpo_time || null,
        burial_place: formData.burial_place || null,
        burial_place2: formData.burial_place2 || null,
        message: formData.show_message ? formData.message : null,
        death_term: formData.death_term || '별세',
        partner_logo_url: formData.partner_logo_url || null,
        hide_flower_order: formData.hide_flower_order,
        auto_reply: formData.auto_reply,
        mourners: JSON.stringify(mourners.filter(m => m.name)),
        account_info: mourners[0]?.bank
          ? JSON.stringify([{
              holder: mourners[0].accountHolder,
              bank: mourners[0].bank,
              number: mourners[0].accountNumber,
            }])
          : null,
        photo_url: formData.show_photo ? formData.photo_url : null,
      };

      let queryResult;
      if (isEditMode && editBugoNumber) {
        queryResult = await supabase
          .from('bugo')
          .update(bugoData)
          .eq('bugo_number', editBugoNumber);
      } else {
        const ownerToken = generateOwnerToken();
        bugoData.bugo_number = bugoNumber;
        bugoData.template_id = 'basic';
        bugoData.applicant_name = mourners[0]?.name || '';
        bugoData.applicant_phone = mourners[0]?.contact || '';
        bugoData.phone_password = mourners[0]?.contact || '';
        bugoData.status = 'active';
        bugoData.owner_token = ownerToken;
        bugoData.b2b_user_id = user.id || null;

        queryResult = await supabase.from('bugo').insert([bugoData]);
      }

      if (queryResult.error) throw queryResult.error;

      // 슬랙 + 알림톡 발송
      await fetch('/api/bugo-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bugo_number: bugoNumber,
          deceased_name: formData.deceased_name,
          funeral_home: formData.funeral_home,
          room_number: formData.room_number,
          address: formData.address,
          funeral_date: formData.funeral_date,
          funeral_time: formData.funeral_time,
          mourner_name: mourners[0]?.name,
          funeral_type: formData.funeral_type,
          created_new: !isEditMode,
          phone_changed: false,
        }),
      });

      // 자주찾는 식장 저장 (b2b_favorite_facilities 키로 통일)
      if (formData.funeral_home && user.id) {
        const saved = JSON.parse(localStorage.getItem('b2b_favorite_facilities') || '[]');
        const exists = saved.find((f: { name: string }) => f.name === formData.funeral_home);
        if (!exists && saved.length < 10) {
          saved.push({
            name: formData.funeral_home,
            address: formData.address,
            tel: formData.funeral_home_tel,
          });
          localStorage.setItem('b2b_favorite_facilities', JSON.stringify(saved));
        }
      }

      router.push(`/b2b/create/complete/${bugoNumber}`);
    } catch (err) {
      console.error('부고 생성 실패:', err);
      alert('부고 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>{isEditMode ? '부고장 수정' : '부고장 제작'}</h1>
        <button className={styles.saveBtn} onClick={handleSubmit}>
          저장하기
        </button>
      </header>

      <div className={styles.content}>
        {/* 장례식장 정보 */}
        <FuneralHomeSection
          formData={formData}
          onChange={handleChange}
          onOpenFacilitySearch={() => setShowFacilitySearch(true)}
          errors={errors}
        />

        {/* 고인 정보 */}
        <DeceasedSection
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />

        {/* 영정사진 */}
        <PhotoSection
          showPhoto={formData.show_photo}
          photoUrl={formData.photo_url}
          onToggle={(show) => handleChange('show_photo', show)}
          onPhotoChange={(url) => handleChange('photo_url', url)}
        />

        {/* 일시 정보 */}
        <DateTimeSection
          formData={formData}
          onChange={handleChange}
          onClear={handleClearFields}
          errors={errors}
        />

        {/* 상주 정보 */}
        <MournerSection
          mourners={mourners}
          onMournersChange={setMourners}
          errors={errors}
        />

        {/* 옵션 */}
        <OptionsSection
          formData={formData}
          onChange={handleChange}
        />
      </div>

      {/* 장례식장 검색 모달 */}
      <FacilitySearchModal
        isOpen={showFacilitySearch}
        onClose={() => setShowFacilitySearch(false)}
        onSelect={(facility) => {
          handleChange('funeral_home', facility.name);
          handleChange('address', facility.address);
          handleChange('funeral_home_tel', facility.phone || '');
          setShowFacilitySearch(false);
        }}
      />

      {/* 미리보기 확인 팝업 모달 */}
      {showPreview && (
        <div className={styles.previewOverlay} onClick={() => setShowPreview(false)}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <h2 className={styles.previewTitle}>모바일 부고장 내용을 확인해주세요</h2>
              <p className={styles.previewSubtitle}>부고장에 표시될 내용을 꼼꼼하게 확인해보세요.</p>
            </div>
            
            <div className={styles.previewBody}>
              {/* 장례식장 정보 */}
              {formData.funeral_type !== '무빈소장례' && formData.funeral_home && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>장례식장</span>
                  <span className={styles.previewValue}>
                    {formData.address && <>{formData.address}<br /></>}
                    {formData.funeral_home} {formData.room_number}
                  </span>
                </div>
              )}

              {/* 고인 정보 */}
              <div className={styles.previewInfoRow}>
                <span className={styles.previewLabel}>고인정보</span>
                <span className={styles.previewValue}>
                  {formData.deceased_name}
                  {formData.religion && formData.religion !== '없음' ? ` / ${formData.religion === '기타' ? formData.religion_custom : formData.religion}` : ''}
                  {formData.age ? ` / ${formData.age}세` : ''}
                  {formData.hide_gender ? '' : formData.gender ? ` / ${formData.gender === '남' ? '남성' : '여성'}` : ''}
                </span>
              </div>

              {/* 별세일 */}
              {formData.death_date && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>별세일</span>
                  <span className={styles.previewValue}>
                    {formData.death_date}{formData.death_time ? ` / ${formData.death_time}` : ''}
                  </span>
                </div>
              )}

              {/* 입관일 */}
              {formData.encoffin_date && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>입관일</span>
                  <span className={styles.previewValue}>
                    {formData.encoffin_date}{formData.encoffin_time ? ` / ${formData.encoffin_time}` : ''}
                  </span>
                </div>
              )}

              {/* 발인일 */}
              {formData.funeral_date && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>발인일</span>
                  <span className={styles.previewValue}>
                    {formData.funeral_date}{formData.funeral_time ? ` / ${formData.funeral_time}` : ''}
                  </span>
                </div>
              )}

              {/* 일포일시 */}
              {formData.ilpo_date && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>일포일시</span>
                  <span className={styles.previewValue}>
                    {formData.ilpo_date}{formData.ilpo_time ? ` / ${formData.ilpo_time}` : ''}
                  </span>
                </div>
              )}

              {/* 장지 */}
              {(formData.burial_place || formData.burial_place2) && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>장지</span>
                  <span className={styles.previewValue}>
                    {formData.burial_place}
                    {formData.burial_place2 && ` / ${formData.burial_place2}`}
                  </span>
                </div>
              )}

              {/* 상주 정보 */}
              <div className={styles.previewInfoRow}>
                <span className={styles.previewLabel}>상주</span>
                <div className={styles.previewValue}>
                  {mourners.filter(m => m.name).map((m, i) => (
                    <div key={i} className={styles.previewMournerItem}>
                      [{m.relationship || '상주'}] {m.name} {m.contact ? `(${m.contact})` : ''}
                      {m.bank && m.accountNumber && (
                        <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginTop: '2px' }}>
                          {m.bank} {m.accountNumber} {m.accountHolder ? `(예금주: ${m.accountHolder})` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 안내사항 */}
              {formData.show_message && formData.message && (
                <div className={styles.previewInfoRow}>
                  <span className={styles.previewLabel}>안내사항</span>
                  <span className={styles.previewValue}>{formData.message}</span>
                </div>
              )}
            </div>

            <div className={styles.previewFooter}>
              <button className={styles.btnCancel} onClick={() => setShowPreview(false)}>
                수정하기
              </button>
              <button className={styles.btnConfirm} onClick={handleConfirmSubmit} disabled={submitting}>
                {submitting ? '생성 중...' : '최종 생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
