'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { IconPrinter, IconDownload } from '@tabler/icons-react';

interface PageProps {
  params: Promise<{ bugoId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default function RitualViewPage({ params, searchParams }: PageProps) {
  const { bugoId } = use(params);
  const { tab } = use(searchParams);

  const activeTab = tab === 'chukmun' ? 'chukmun' : 'wipae';
  const [bugo, setBugo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('bugo')
          .select('*')
          .eq('id', bugoId)
          .single();

        if (data) {
          setBugo(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bugoId]);

  const deceasedName = bugo?.deceased_name || '고인';
  const docTitle = activeTab === 'wipae' ? '위패' : '축문';

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <p style={{ fontSize: '16px', color: '#64748b', fontWeight: 600 }}>A4 문서 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '20px 10px', boxSizing: 'border-box' }}>
      {/* 인쇄 시 비노출되는 전용 제어 바 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #ffffff !important; padding: 0 !important; }
          .a4-container { box-shadow: none !important; margin: 0 !important; border: none !important; width: 100% !important; }
        }
      `}</style>

      {/* 상단 컨트롤 바 */}
      <div className="no-print" style={{ maxWidth: '794px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            故 {deceasedName} 님 {docTitle} 문서
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            아래 [A4 인쇄 / PDF 저장] 버튼을 누르시면 바로 출력하실 수 있습니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            <IconPrinter size={18} />
            A4 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      {/* A4 용지 컨테이너 */}
      <div className="a4-container" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* A4 위패/축문 양식 중앙 렌더링 카드 */}
        <div style={{ border: '2px double #1e293b', padding: '40px 30px', textAlign: 'center', backgroundColor: '#ffffff', minWidth: '240px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '20px' }}>
            [ A4 규격 {docTitle} 문서 ]
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', letterSpacing: '4px', margin: '0 0 20px 0' }}>
            故 {deceasedName} 學生
          </h1>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: '2' }}>
            {activeTab === 'wipae' ? '神 位 (신위)' : '維 歲 次 謹 以 (유세차 근이)'}
          </p>
        </div>

        {/* 하단 브랜드 안내 */}
        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            부고온(BugoON) 모바일 의례문서 서비스
          </p>
        </div>
      </div>
    </div>
  );
}
