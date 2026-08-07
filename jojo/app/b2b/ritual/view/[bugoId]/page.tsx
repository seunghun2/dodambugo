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
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading');

  useEffect(() => {
    async function loadAndRender() {
      try {
        const { data, error } = await supabase
          .from('ritual_shares')
          .select('html_content')
          .eq('id', bugoId)
          .single();

        if (error || !data) {
          setStatus('error');
          return;
        }

        // A4 인쇄 버튼과 100% 동일한 방식: 페이지 전체를 서식 HTML로 교체
        // 인쇄 버튼만 상단에 삽입 (인쇄 시 자동 숨김)
        const printBtnHtml = `
          <div id="print-btn-bar" style="
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
            background: #fff; border-top: 1px solid #e2e8f0;
            padding: 16px 20px; display: flex; justify-content: center;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.08); font-family: sans-serif;
          ">
            <button onclick="window.print()" style="
              width: 100%; max-width: 400px; padding: 18px 0;
              font-size: 20px; font-weight: 800; color: #fff;
              background: #166534; border: none; border-radius: 14px;
              cursor: pointer; box-shadow: 0 4px 12px rgba(22,101,52,0.3);
            ">인쇄하기</button>
          </div>
        `;

        // 인쇄 시 버튼 숨김 CSS 추가
        const printCss = `
          <style>
            @media print { #print-btn-bar { display: none !important; } }
            body { padding-bottom: 80px; }
          </style>
        `;

        // 서식 HTML에 인쇄 버튼과 CSS 삽입
        const fullHtml = data.html_content
          .replace('</head>', printCss + '</head>')
          .replace('</body>', printBtnHtml + '</body>');

        // 현재 페이지를 서식 HTML로 완전 교체 (A4 인쇄와 동일한 렌더링)
        document.open();
        document.write(fullHtml);
        document.close();
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }
    loadAndRender();
  }, [bugoId]);

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: 'sans-serif', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '20px', color: '#ef4444', fontWeight: 700 }}>문서를 찾을 수 없습니다</p>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>링크가 만료되었거나 잘못된 주소입니다.</p>
      </div>
    );
  }

  // 로딩 중 표시 (HTML 로드 완료 시 document.write로 전체 교체됨)
  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>서식을 불러오는 중입니다...</p>
    </div>
  );
}
