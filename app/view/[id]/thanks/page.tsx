'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './thanks.css';

interface BugoData {
    id: string;
    deceased_name: string;
    photo_url?: string;
    mourner_name?: string;
    relationship?: string;
    religion?: string;
    funeral_date?: string;
}

export default function ThanksPage() {
    const params = useParams();
    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBugo = async () => {
            const id = params.id as string;

            const { data, error } = await supabase
                .from('bugo')
                .select('id, deceased_name, photo_url, mourner_name, relationship, religion, funeral_date')
                .or(`id.eq.${id},bugo_number.eq.${id}`)
                .single();

            if (!error && data) {
                setBugo(data);
            }
            setLoading(false);
        };

        fetchBugo();
    }, [params.id]);

    // 종교별 배경 클래스
    const getBackgroundClass = () => {
        if (!bugo?.religion) return 'bg-general';
        switch (bugo.religion) {
            case '기독교': return 'bg-christian';
            case '천주교': return 'bg-catholic';
            case '불교': return 'bg-buddhist';
            default: return 'bg-general';
        }
    };

    if (loading) {
        return (
            <div className="thanks-page">
                <div className="thanks-loading">로딩 중...</div>
            </div>
        );
    }

    if (!bugo) {
        return (
            <div className="thanks-page">
                <div className="thanks-error">부고 정보를 찾을 수 없습니다.</div>
            </div>
        );
    }

    return (
        <div className={`thanks-page ${getBackgroundClass()}`}>
            <div className="thanks-content">
                {/* 감사 인사 */}
                <div className="thanks-message">
                    <p className="thanks-title">감사합니다</p>
                    <p className="thanks-subtitle">
                        고인의 마지막 길에<br />
                        함께해 주셔서 감사합니다.
                    </p>
                </div>

                {/* 고인 정보 */}
                <div className="thanks-deceased">
                    {bugo.photo_url && (
                        <div className="thanks-photo">
                            <img src={bugo.photo_url} alt={bugo.deceased_name} />
                        </div>
                    )}
                    <p className="thanks-deceased-name">故 {bugo.deceased_name}</p>
                </div>

                {/* 상주 정보 */}
                <div className="thanks-mourner">
                    <p className="thanks-mourner-label">{bugo.relationship || '상주'}</p>
                    <p className="thanks-mourner-name">{bugo.mourner_name}</p>
                </div>

                {/* 하단 안내 문구 */}
                <div className="thanks-footer">
                    <p>보내주신 따뜻한 위로와 조의에<br />깊이 감사드립니다.</p>
                </div>

                {/* CTA 버튼 (향후 추가) */}
                {/* 
                <div className="thanks-cta">
                    <button className="btn-thanks-cta">
                        유품/기념품 서비스 알아보기
                    </button>
                </div>
                */}
            </div>
        </div>
    );
}
