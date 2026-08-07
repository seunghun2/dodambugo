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

        // 방안 1: 화면에서는 A4 서식 원본 전체를 모바일 기기 화면 폭에 맞춰 비율대로 스마트 축소 (Scale)
        // 인쇄(@media print) 시에는 축소를 해제하여 100% 원본 A4 규격 그대로 출력
        const viewStyle = `
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            /* 화면 (Screen) 모드: 슬레이트 배경 및 스마트폰 화면 비율 축소 */
            @media screen {
              html, body {
                background-color: #f1f5f9 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100vw !important;
                min-height: 100vh !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
              }

              /* A4 서식 원본 컨테이너 감싸기 */
              .a4-scale-wrapper {
                margin-top: 16px !important;
                margin-bottom: 90px !important;
                transform-origin: top center !important;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
                background-color: #ffffff !important;
                border-radius: 4px !important;
              }
            }

            /* 인쇄 (@media print) 모드: 100% 원본 A4 출력 */
            @media print {
              html, body {
                background-color: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                display: block !important;
              }
              .a4-scale-wrapper {
                transform: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
              }
              #print-btn-bar { 
                display: none !important; 
              }
            }
          </style>
          <script>
            // 모바일 화면 폭에 맞춰 A4 서식을 비율대로 자동 축소하는 스크립트
            function autoScaleA4() {
              const wrapper = document.querySelector('.a4-scale-wrapper');
              if (!wrapper) return;
              const screenWidth = window.innerWidth;
              // A4 화면 렌더링 기준 너비 (800px)
              const baseWidth = 800;
              if (screenWidth < baseWidth) {
                const targetWidth = screenWidth - 32; // 좌우 여백 16px씩
                const scale = targetWidth / baseWidth;
                wrapper.style.transform = 'scale(' + scale + ')';
                // scale로 줄어들면서 생긴 아래 여백 보정
                const targetHeight = wrapper.offsetHeight * scale;
                wrapper.parentElement.style.height = (targetHeight + 110) + 'px';
              } else {
                wrapper.style.transform = 'none';
                wrapper.parentElement.style.height = 'auto';
              }
            }
            window.addEventListener('resize', autoScaleA4);
            window.addEventListener('load', autoScaleA4);
            setTimeout(autoScaleA4, 100);
          </script>
        `;

        const printBtnHtml = `
          <div id="print-btn-bar" style="
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
            background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
            border-top: 1px solid #e2e8f0;
            padding: 14px 20px; display: flex; justify-content: center;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.06); font-family: sans-serif;
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

        // 원본 HTML 내용에 스케일 래퍼(.a4-scale-wrapper) 적용
        let processedHtml = data.html_content;
        
        // body 태그 내의 콘텐츠를 .a4-scale-wrapper 로 감싸기
        const bodyContentMatch = processedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyContentMatch && bodyContentMatch[1]) {
          const bodyInner = bodyContentMatch[1];
          const wrappedBody = `<body><div style="width: 100%; display: flex; justify-content: center;"><div class="a4-scale-wrapper" style="width: 800px; min-height: 1000px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; box-sizing: border-box; padding: 40px 20px;">${bodyInner}</div></div></body>`;
          processedHtml = processedHtml.replace(/<body[^>]*>[\s\S]*<\/body>/i, wrappedBody);
        }

        const fullHtml = processedHtml
          .replace('</head>', viewStyle + '</head>')
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
