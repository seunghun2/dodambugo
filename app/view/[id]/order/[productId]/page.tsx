'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import './order.css';

// 임시 상품 데이터 (나중에 DB에서 가져오기)
const flowerProducts = [
    { id: 1, name: '프리미엄형 화환', desc: '복도에 비치되는 고급근조 3단 특대 형태로 제작됩니다', originalPrice: 150000, price: 120000, image: '/images/flower-wreath.png' },
    { id: 2, name: '대통령 화환', desc: '복도에 비치되는 고급근조 3단 특대 형태로 제작됩니다', originalPrice: 180000, price: 150000, image: '/images/flower-wreath.png' },
    { id: 3, name: '스탠다드 화환', desc: '복도에 비치되는 표준형 3단 화환입니다', originalPrice: 120000, price: 100000, image: '/images/flower-wreath.png' },
    { id: 4, name: '베이직 화환', desc: '간결하면서도 정성이 담긴 기본형 화환입니다', originalPrice: 100000, price: 80000, image: '/images/flower-wreath.png' },
    { id: 5, name: '고급 근조 화환', desc: '최고급 생화로 제작되는 프리미엄 화환입니다', originalPrice: 200000, price: 170000, image: '/images/flower-wreath.png' },
];

interface BugoData {
    id: string;
    bugo_number?: string;
    deceased_name: string;
    funeral_home?: string;
    room_number?: string;
    address?: string;
    mourners?: Array<{ relationship: string; name: string; contact: string }>;
    mourner_name?: string;
}

export default function OrderPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;
    const productId = parseInt(params.productId as string);

    const [bugo, setBugo] = useState<BugoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCustomMessage, setIsCustomMessage] = useState(false); // 직접입력 여부
    const [recipientModalOpen, setRecipientModalOpen] = useState(false); // 상주변경 모달
    const [tempRecipientName, setTempRecipientName] = useState(''); // 임시 상주명

    // 문구 옵션
    const messageOptions = [
        '삼가 故人의 冥福을 빕니다',
        '삼가 고인의 명복을 빕니다',
        '謹弔',
        '極樂往生發願',
        '극락왕생발원',
        '하나님의 위로가 함께 하시길 빕니다',
        '주님의 위로와 소망이 함께 하기를 기원합니다',
    ];

    // 주문 폼
    const [orderForm, setOrderForm] = useState({
        senderName: '',
        senderPhone: '',
        ribbonText1: '삼가 故人의 冥福을 빕니다', // 기본 문구
        ribbonText2: '', // 보내는 분
        customMessage: '', // 직접입력 문구
        recipientName: '', // 받으시는 분 (상주)
    });

    const product = flowerProducts.find(p => p.id === productId);

    // 부고 정보 조회
    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const isUUID = bugoId.includes('-') && bugoId.length > 10;
                let data = null;

                if (isUUID) {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name, funeral_home, room_number, address, mourners, mourner_name').eq('id', bugoId).limit(1);
                    data = result.data?.[0] || null;
                } else {
                    const result = await supabase.from('bugo').select('id, bugo_number, deceased_name, funeral_home, room_number, address, mourners, mourner_name').eq('bugo_number', bugoId).order('created_at', { ascending: false }).limit(1);
                    data = result.data?.[0] || null;
                }

                setBugo(data);

                // 상주 이름 자동 설정 (저장된 데이터가 없을 때만)
                const storedData = sessionStorage.getItem(`order_${bugoId}_${productId}`);
                if (data && !storedData) {
                    const mournerName = data.mourners && data.mourners.length > 0
                        ? data.mourners[0].name
                        : data.mourner_name || '';
                    setOrderForm(prev => ({ ...prev, recipientName: mournerName }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (bugoId) fetchBugo();
    }, [bugoId, productId]);

    // sessionStorage에서 이전 입력값 복원
    useEffect(() => {
        const storedData = sessionStorage.getItem(`order_${bugoId}_${productId}`);
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                setOrderForm(prev => ({
                    ...prev,
                    ribbonText1: parsed.ribbonText1 || prev.ribbonText1,
                    ribbonText2: parsed.ribbonText2 || prev.ribbonText2,
                    recipientName: parsed.recipientName || prev.recipientName,
                }));
                // 직접입력 상태 복원
                const isCustom = !['삼가 故人의 冥福을 빕니다', '삼가 고인의 명복을 빕니다', '謹弔', '極樂往生發願', '극락왕생발원', '하나님의 위로가 함께 하시길 빕니다', '주님의 위로와 소망이 함께 하기를 기원합니다'].includes(parsed.ribbonText1);
                setIsCustomMessage(isCustom);
            } catch (e) {
                console.error(e);
            }
        }
    }, [bugoId, productId]);

    const handleNext = () => {
        // 유효성 검사
        if (!orderForm.ribbonText2.trim()) {
            alert('보내는 분 성함을 입력해주세요.');
            return;
        }
        if (!product) {
            alert('상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        if (!bugo) {
            alert('부고 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        // sessionStorage에 주문 정보 저장
        sessionStorage.setItem(`order_${bugoId}_${productId}`, JSON.stringify({
            ribbonText1: orderForm.ribbonText1,
            ribbonText2: orderForm.ribbonText2,
            recipientName: orderForm.recipientName,
            productName: product.name,
            productPrice: product.price,
            funeralHome: bugo.funeral_home || '',
            room: bugo.room_number || '',
            address: bugo.address || '',
        }));
        // payment 페이지로 이동
        router.push(`/view/${bugoId}/payment/${productId}`);
    };

    if (loading) {
        return (
            <div className="order-loading">
                <div className="loading-spinner" />
                <p>주문 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="order-error">
                <h2>상품을 찾을 수 없습니다</h2>
                <button onClick={() => router.back()}>돌아가기</button>
            </div>
        );
    }

    return (
        <div className="order-page">
            {/* 헤더 */}
            <header className="order-header">
                <button className="back-btn" onClick={() => router.push(`/view/${bugoId}?flower=open`)}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1>주문하기</h1>
                <div style={{ width: 40 }} />
            </header>

            <div className="order-content">
                {/* 선택한 상품 */}
                {/* Step 1: 선택한 상품 */}
                <section className="order-section">
                    <h2 className="section-title">선택한 상품</h2>
                    <div className="selected-product">
                        <div className="product-image">
                            <img src={product.image} alt={product.name} />
                        </div>
                        <div className="product-info">
                            <h3>{product.name}</h3>
                            <p className="price">{product.price.toLocaleString()}원</p>
                        </div>
                    </div>
                </section>

                {/* Step 1: 화환에 들어갈 리본문구 */}
                <section className="order-section">
                    <h2 className="section-title">화환에 들어갈 리본문구</h2>

                    {/* 보내는 분 (위) */}
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="예시) 주식회사 대표 홍길동"
                            value={orderForm.ribbonText2}
                            onChange={(e) => setOrderForm({ ...orderForm, ribbonText2: e.target.value })}
                            autoFocus
                        />
                    </div>

                    {/* 문구 드롭다운 (아래) */}
                    <div className="form-group">
                        <select
                            className="message-select"
                            value={isCustomMessage ? 'custom' : orderForm.ribbonText1}
                            onChange={(e) => {
                                if (e.target.value === 'custom') {
                                    setIsCustomMessage(true);
                                    setOrderForm({ ...orderForm, ribbonText1: '', customMessage: '' });
                                } else {
                                    setIsCustomMessage(false);
                                    setOrderForm({ ...orderForm, ribbonText1: e.target.value, customMessage: '' });
                                }
                            }}
                        >
                            {messageOptions.map((msg, idx) => (
                                <option key={idx} value={msg}>{msg}</option>
                            ))}
                            <option value="custom">직접입력</option>
                        </select>
                    </div>

                    {/* 직접입력 시 추가 인풋 */}
                    {isCustomMessage && (
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="문구를 직접 입력해주세요"
                                value={orderForm.customMessage}
                                onChange={(e) => setOrderForm({ ...orderForm, customMessage: e.target.value, ribbonText1: e.target.value })}
                            />
                        </div>
                    )}
                </section>

                {/* Step 1: 받으시는 분 */}
                <section className="order-section">
                    <h2 className="section-title">받으시는 분</h2>
                    <div className="recipient-info">
                        <div className="recipient-row">
                            <span className="recipient-label">상주</span>
                            <span className="recipient-value">
                                {orderForm.recipientName || '상주'}
                                <button
                                    className="btn-change-recipient"
                                    type="button"
                                    onClick={() => {
                                        setTempRecipientName(orderForm.recipientName);
                                        setRecipientModalOpen(true);
                                    }}
                                >
                                    상주변경
                                </button>
                            </span>
                        </div>
                        <div className="recipient-row">
                            <span className="recipient-label">빈소</span>
                            <span className="recipient-value">{bugo?.funeral_home || '장례식장'} {bugo?.room_number || ''}</span>
                        </div>
                        <div className="recipient-row">
                            <span className="recipient-label">주소</span>
                            <span className="recipient-value">{bugo?.address || '-'}</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* 하단 버튼 */}
            <div className="order-footer">
                <button className="btn-payment" onClick={handleNext}>
                    다음
                </button>
            </div>

            {/* 상주변경 바텀시트 모달 */}
            {
                recipientModalOpen && (
                    <div className="recipient-modal-overlay" onClick={() => setRecipientModalOpen(false)}>
                        <div className="recipient-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="recipient-modal-header">
                                <h3>상주 변경</h3>
                                <button className="btn-modal-close" onClick={() => setRecipientModalOpen(false)}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="recipient-modal-content">
                                <div className="form-group">
                                    <label>상주명</label>
                                    <input
                                        type="text"
                                        placeholder="상주명을 입력해주세요"
                                        value={tempRecipientName}
                                        onChange={(e) => setTempRecipientName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="recipient-modal-footer">
                                <button
                                    className="btn-confirm"
                                    onClick={() => {
                                        setOrderForm({ ...orderForm, recipientName: tempRecipientName });
                                        setRecipientModalOpen(false);
                                    }}
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
