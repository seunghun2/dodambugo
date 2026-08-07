'use client';

import React, { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PageProps {
  params: Promise<{ bugoId: string }>;
}

export default function RitualViewPage({ params }: PageProps) {
  const { bugoId } = use(params);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadShare() {
      try {
        const { data, error: fetchError } = await supabase
          .from('ritual_shares')
          .select('html_content')
          .eq('id', bugoId)
          .single();

        if (fetchError || !data) {
          setError(true);
          return;
        }

        setHtmlContent(data.html_content);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadShare();
  }, [bugoId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>서식을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !htmlContent) {
    return (
      <div style={{ display: 'flex', height: '100dvh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: 'sans-serif', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '20px', color: '#ef4444', fontWeight: 700 }}>문서를 찾을 수 없습니다</p>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>링크가 만료되었거나 잘못된 주소입니다.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .print-btn-bar { display: none !important; }
          body { margin: 0; padding: 0; }
          .doc-frame { border: none !important; }
        }
      `}</style>

      {/* 인쇄 버튼 바 - 화면에서만 보이고, 인쇄 시 숨김 */}
      <div className="print-btn-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        fontFamily: 'sans-serif',
      }}>
        <button
          onClick={handlePrint}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '18px 0',
            fontSize: '20px',
            fontWeight: 800,
            color: '#ffffff',
            backgroundColor: '#166534',
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: '0 4px 12px rgba(22,101,52,0.3)',
          }}
        >
          🖨️ 인쇄하기
        </button>
      </div>

      {/* 서식 HTML을 iframe으로 렌더링 (있는 그대로 출력) */}
      <iframe
        className="doc-frame"
        srcDoc={htmlContent}
        style={{
          width: '100%',
          height: '100dvh',
          border: 'none',
          display: 'block',
          paddingBottom: '80px',
        }}
        title="의례 서식 문서"
      />
    </>
  );
}
