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

        const rawHtml = data.html_content;

        // 화면 뷰어 및 인쇄 시 상단 여백(패딩) 보정 스타일
        const injectedStyles = `
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            /* 화면(Screen) 모드: 스마트폰 해상도에 맞춘 퍼센트(zoom) 시각적 축소 */
            @media screen {
              html, body {
                background-color: #f1f5f9 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100vw !important;
                min-height: 100vh !important;
                box-sizing: border-box !important;
                overflow-x: hidden !important;
              }
              body {
                padding-top: 30px !important;
                padding-bottom: 120px !important;
              }
              .content {
                padding-top: 40px !important;
              }
              @media (max-width: 768px) {
                body > div:not(#print-btn-bar),
                body > .content,
                body > .container {
                  zoom: 0.48;
                  -webkit-text-size-adjust: 100%;
                }
              }
              @media (max-width: 480px) {
                body > div:not(#print-btn-bar),
                body > .content,
                body > .container {
                  zoom: 0.42;
                  -webkit-text-size-adjust: 100%;
                }
              }
            }

            /* 인쇄 (@media print) 모드: A4 1페이지 100% 동일 출력 및 상단 패딩 보정 */
            @media print {
              @page { size: A4 portrait; margin: 25mm 20mm !important; }
              html, body {
                background-color: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
                zoom: 1 !important;
              }
              .content {
                padding-top: 35mm !important;
                box-sizing: border-box !important;
              }
              body > div, body > .content, body > .container {
                zoom: 1 !important;
              }
              #print-btn-bar { 
                display: none !important; 
              }
            }
          </style>
        `;

        const printBtnHtml = `
          <div id="print-btn-bar" style="
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
            background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
            border-top: 1px solid #e2e8f0;
            padding: 14px 20px; display: flex; justify-content: center;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.08); font-family: sans-serif;
          ">
            <button onclick="window.print()" style="
              width: 100%; max-width: 440px; padding: 16px 0;
              font-size: 18px; font-weight: 700; color: #ffffff;
              background-color: #166534; border: none; border-radius: 12px;
              cursor: pointer; letter-spacing: -0.02em;
              box-shadow: 0 4px 12px rgba(22, 101, 52, 0.25);
            ">인쇄하기</button>
          </div>
        `;

        const fullHtml = rawHtml
          .replace('</head>', injectedStyles + '</head>')
          .replace('</body>', printBtnHtml + '</body>');

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

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>서식을 불러오는 중입니다...</p>
    </div>
  );
}
