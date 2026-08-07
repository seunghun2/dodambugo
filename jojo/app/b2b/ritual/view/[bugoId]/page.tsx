'use client';

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { IconPrinter } from '@tabler/icons-react';

interface PageProps {
  params: Promise<{ bugoId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default function RitualViewPage({ params, searchParams }: PageProps) {
  const { bugoId } = use(params);
  const { tab } = use(searchParams);

  const activeTab = tab === 'chukmun' ? 'chukmun' : 'wipae';
  const isWipae = activeTab === 'wipae';
  const [bugo, setBugo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await supabase
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

  const deceasedName = bugo?.deceased_name || '홍길동';
  const docTitle = isWipae ? '위패' : '축문';

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <p style={{ fontSize: '16px', color: '#64748b', fontWeight: 600 }}>A4 서식 문서 불러오는 중...</p>
      </div>
    );
  }

  // 100% 동일한 A4 렌더링 텍스트 조합
  const chars = isWipae 
    ? ['顯', '妣', '孺', '人', ...deceasedName.split(''), '神', '位']
    : ['維', '歲', '次', '謹', '以', '故', ...deceasedName.split(''), '之', '靈'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '20px 10px', boxSizing: 'border-box' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #ffffff !important; padding: 0 !important; }
          .a4-container { box-shadow: none !important; margin: 0 !important; border: none !important; width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      {/* 상단 컨트롤 바 */}
      <div className="no-print" style={{ maxWidth: '794px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            故 {deceasedName} 님 {docTitle} 서식 (A4)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            [A4 인쇄 / PDF 저장] 버튼을 누르시면 절취선 포함 고화질로 출력됩니다.
          </p>
        </div>
        <button
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          <IconPrinter size={18} />
          A4 인쇄 / PDF 저장
        </button>
      </div>

      {/* A4 용지 컨테이너 (실제 서식 규격과 100% 일치) */}
      <div className="a4-container" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '60px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ position: 'relative', width: '2.3cm', minHeight: '14cm', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          {/* 절취선 바운딩 */}
          <div style={{ position: 'absolute', top: '-6mm', left: '-6mm', right: '-6mm', bottom: '-6mm', border: '2px dashed #94a3b8', borderRadius: '4px' }} />
          <div style={{ position: 'absolute', top: '-11mm', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: '#64748b', fontFamily: 'sans-serif', white-space: 'nowrap' }}>
            절취선을 따라 잘라 주세요 ({docTitle} 규격: 2.3 x 14cm)
          </div>

          {/* 한문/한글 고화질 서식 본체 */}
          <div style={{ fontFamily: "'Batang', 'Nanum Myeongjo', 'Gungsuh', serif", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, padding: '10px 0' }}>
            {chars.map((c, idx) => (
              <div key={idx} style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 서비스 출처 */}
        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, fontFamily: 'sans-serif' }}>
            부고온(BugoON) 모바일 의례문서 정식 서식
          </p>
        </div>
      </div>
    </div>
  );
}
