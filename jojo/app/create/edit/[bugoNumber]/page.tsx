'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const { data, error } = await supabase
                    .from('bugo')
                    .select('template')
                    .eq('bugo_number', params.bugoNumber)
                    .single();

                if (error) throw error;

                // 템플릿 페이지로 리다이렉트 (edit 쿼리 파라미터와 함께)
                const template = data?.template || 'basic';
                router.replace(`/create/${template}?edit=${params.bugoNumber}`);
            } catch (err) {
                console.error(err);
                router.replace('/create');
            }
        };

        if (params.bugoNumber) {
            fetchAndRedirect();
        }
    }, [params.bugoNumber, router]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #eee',
                borderTop: '3px solid #333',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p>부고장을 불러오는 중...</p>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
