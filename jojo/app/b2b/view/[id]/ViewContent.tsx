'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    shouldShowFuneralHomeBox,
    shouldShowIlpo,
    shouldShowFuneral,
    shouldShowEncoffin,
    shouldShowBurialPlace,
    shouldShowMap,
    shouldShowFlowerSection,
    getCeremonyLabel,
} from '@/lib/funeral-display';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
// supabase는 필요할 때만 동적 로드
import NaverMap from '@/components/NaverMap';
import { gaEvents } from '@/components/GoogleAnalytics';
import { detectScreenshot, detectDevTools, trackPageView } from '@/lib/antiScrape';
import './view.css';

// 은행명 → 로고 파일 매핑
function getBankLogo(bankName: string): string | null {
    const bankLogoMap: Record<string, string> = {
        'KB국민': '/images/bankicon/국민은행.svg',
        '국민': '/images/bankicon/국민은행.svg',
        '국민은행': '/images/bankicon/국민은행.svg',
        'KB국민은행': '/images/bankicon/국민은행.svg',
        '신한': '/images/bankicon/신한은행.svg',
        '신한은행': '/images/bankicon/신한은행.svg',
        '우리': '/images/bankicon/우리은행.svg',
        '우리은행': '/images/bankicon/우리은행.svg',
        '하나': '/images/bankicon/하나은행.svg',
        '하나은행': '/images/bankicon/하나은행.svg',
        'NH농협': '/images/bankicon/NH농협은행.svg',
        '농협': '/images/bankicon/NH농협은행.svg',
        'NH농협은행': '/images/bankicon/NH농협은행.svg',
        '기업': '/images/bankicon/기업은행.svg',
        '기업은행': '/images/bankicon/기업은행.svg',
        'IBK기업': '/images/bankicon/기업은행.svg',
        'IBK기업은행': '/images/bankicon/기업은행.svg',
        '카카오뱅크': '/images/bankicon/카카오뱅크.svg',
        '카카오': '/images/bankicon/카카오뱅크.svg',
        '케이뱅크': '/images/bankicon/케이뱅크.svg',
        '토스뱅크': '/images/bankicon/토스뱅크.svg',
        '토스': '/images/bankicon/토스뱅크.svg',
        '토스머니': '/images/bankicon/토스뱅크.svg',
        'SC제일': '/images/bankicon/제일은행.svg',
        'SC제일은행': '/images/bankicon/제일은행.svg',
        '씨티': '/images/bankicon/씨티은행.svg',
        '씨티은행': '/images/bankicon/씨티은행.svg',
        '우체국': '/images/bankicon/우체국.svg',
        '새마을': '/images/bankicon/새마을.svg',
        '새마을금고': '/images/bankicon/새마을.svg',
        '신협': '/images/bankicon/신협은행.svg',
        '수협': '/images/bankicon/수협은행.svg',
        '수협은행': '/images/bankicon/수협은행.svg',
        '대구': '/images/bankicon/대구은행.svg',
        '대구은행': '/images/bankicon/대구은행.svg',
        'DGB대구': '/images/bankicon/대구은행.svg',
        '부산': '/images/bankicon/경남은행.svg',
        '부산은행': '/images/bankicon/경남은행.svg',
        'BNK부산': '/images/bankicon/경남은행.svg',
        '경남': '/images/bankicon/경남은행.svg',
        '경남은행': '/images/bankicon/경남은행.svg',
        'BNK경남': '/images/bankicon/경남은행.svg',
        '광주': '/images/bankicon/광주은행.svg',
        '광주은행': '/images/bankicon/광주은행.svg',
        '전북': '/images/bankicon/전북은행.svg',
        '전북은행': '/images/bankicon/전북은행.svg',
        '제주': '/images/bankicon/제주은행.svg',
        '제주은행': '/images/bankicon/제주은행.svg',
        '산업': '/images/bankicon/KDB산업은행.svg',
        '산업은행': '/images/bankicon/KDB산업은행.svg',
        'KDB산업': '/images/bankicon/KDB산업은행.svg',
        'SBI저축': '/images/bankicon/SBI 저축은행.svg',
        'SBI저축은행': '/images/bankicon/SBI 저축은행.svg',
    };

    // 정확한 매칭 먼저
    if (bankLogoMap[bankName]) {
        return bankLogoMap[bankName];
    }

    // 부분 매칭
    for (const [key, value] of Object.entries(bankLogoMap)) {
        if (bankName.includes(key) || key.includes(bankName)) {
            return value;
        }
    }

    return null;
}

interface BugoData {
    id: string;
    bugo_number: string;
    template_id?: string;
    applicant_name: string;
    phone_password: string;
    deceased_name: string;
    b2b_user_id?: string | null;
    gender?: string;
    age?: number;
    death_date?: string;
    death_time?: string;
    encoffin_date?: string;
    encoffin_time?: string;
    religion?: string;
    relationship?: string;
    mourner_name?: string;
    contact?: string;
    mourners?: Array<{ relationship: string; name: string; contact: string }>;
    funeral_type?: string;
    funeral_home?: string;
    room_number?: string;
    funeral_home_tel?: string;
    address?: string;
    address_detail?: string;
    funeral_date?: string;
    funeral_time?: string;
    burial_place?: string;
    burial_place2?: string;
    message?: string;
    account_info?: Array<{ bank: string; holder: string; number: string }> | null;
    photo_url?: string;
    ilpo_date?: string;
    ilpo_time?: string;
    hide_funeral?: boolean;
    hide_flower_order?: boolean;
    religious_title?: string | null;
    show_religious_title?: boolean;
    partner_logo_url?: string | null;
}

// 상주 관계 + 고인 성별 → 고인-상주 관계 자동 매핑
function getDeceasedRelation(mournerRelation: string, deceasedGender: string): string {
    const gender = deceasedGender === '남' ? 'male' : 'female';

    const relationMap: Record<string, { male: string; female: string }> = {
        '배우자': { male: '남편', female: '아내' },
        '아들': { male: '부친', female: '모친' },
        '딸': { male: '부친', female: '모친' },
        '며느리': { male: '시부', female: '시모' },
        '사위': { male: '장인', female: '장모' },
        '손': { male: '조부', female: '조모' },
        '손자': { male: '조부', female: '조모' },
        '손녀': { male: '조부', female: '조모' },
        '외손': { male: '외조부', female: '외조모' },
        '외손자': { male: '외조부', female: '외조모' },
        '외손녀': { male: '외조부', female: '외조모' },
        '증손': { male: '증조부', female: '증조모' },
        '부친': { male: '아들', female: '딸' },
        '모친': { male: '아들', female: '딸' },
        '형': { male: '형', female: '누나' },
        '오빠': { male: '오빠', female: '언니' },
        '누나': { male: '남동생', female: '여동생' },
        '언니': { male: '남동생', female: '여동생' },
        '동생': { male: '형/오빠', female: '누나/언니' },
        '형수': { male: '시동생', female: '시누이' },
        '제수': { male: '형', female: '언니' },
        '매형': { male: '처남', female: '처제' },
        '자제': { male: '부친', female: '모친' },
    };

    return relationMap[mournerRelation]?.[gender] || mournerRelation;
}

// 지역별 가격 계산 헬퍼 (시/도 추가금 + 특수지역 추가금)
const calculateRegionalPrice = (
    basePrice: number,
    discountPrice: number | null,
    regionalPrices: Record<string, number> | undefined,
    specialSurcharges: Record<string, number> | undefined,
    region: string,
    address: string
): number => {
    const price = discountPrice || basePrice;
    // 시/도별 추가금
    const regionalSurcharge = (regionalPrices && region && regionalPrices[region]) || 0;
    // 특수지역(산간/도서) 추가금 - 주소에 키워드가 포함되면 적용
    let specialSurcharge = 0;
    if (specialSurcharges && address) {
        for (const [keyword, surcharge] of Object.entries(specialSurcharges)) {
            if (address.includes(keyword)) {
                specialSurcharge = Math.max(specialSurcharge, surcharge); // 가장 높은 금액 적용
            }
        }
    }
    return price + regionalSurcharge + specialSurcharge;
};

export interface ViewContentProps {
    initialBugo: BugoData;
    initialFlowerOrders?: Array<{ sender_name: string; ribbon_text1: string; ribbon_text2: string }>;
    initialFlowerProducts?: Array<{ id: string; sort_order: number; name: string; description: string; price: number; discount_price: number | null; images: string[]; regional_prices?: Record<string, number>; special_surcharges?: Record<string, number> }>;
}

export default function ViewContent({ initialBugo, initialFlowerOrders = [], initialFlowerProducts = [] }: ViewContentProps) {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    // owner=true 파라미터 처리: localStorage에 저장하고 URL에서 제거
    const [isOwner, setIsOwner] = useState(false);
    const [mounted, setMounted] = useState(false); // hydration 완료 여부
    const [bugo] = useState<BugoData>(initialBugo); // 서버에서 받은 데이터 사용
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [showFloatingFlower, setShowFloatingFlower] = useState(false);
    const [flowerModalOpen, setFlowerModalOpen] = useState(false);
    const [selectedFlower, setSelectedFlower] = useState<number | null>(initialFlowerProducts[0]?.sort_order || null); // 선택된 상품 순번
    const [flowerOrders] = useState(initialFlowerOrders);
    const [flowerProducts] = useState(initialFlowerProducts);
    const [condolenceActive, setCondolenceActive] = useState(true);

    // Hydration 완료 후 mounted 상태 true + 의심 행동 감지
    useEffect(() => {
        setMounted(true);

        // 경쟁사 감지
        const cleanupScreenshot = detectScreenshot();
        const cleanupDevTools = detectDevTools();
        trackPageView(bugo.bugo_number);

        // 조의금 서비스 활성화 여부 확인
        import('@/lib/supabase').then(({ supabase }) => {
            supabase.from('condolence_config').select('is_active').limit(1).single()
                .then(({ data }) => {
                    if (data) setCondolenceActive(data.is_active);
                });
        });

        return () => {
            cleanupScreenshot();
            cleanupDevTools();
        };
    }, [bugo.bugo_number]);

    // 지역 정보 계산
    const funeralAddress = bugo.address || bugo.funeral_home || '';
    const REGION_KEYWORDS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    const bugoRegion = REGION_KEYWORDS.find(r => funeralAddress.includes(r)) || '';
    const bugoAddress = funeralAddress;

    // owner=true 또는 token 파라미터 처리 (URL 정리)
    useEffect(() => {
        const ownerParam = searchParams.get('owner');
        const tokenParam = searchParams.get('token');
        const flowerParam = searchParams.get('flower');
        const bugoId = params.id as string;
        const storageKey = `bugo_owner_${bugoId}`;

        // 토큰 기반 인증 (우선 처리)
        if (tokenParam) {
            // API로 토큰 검증 & 무효화
            fetch(`/api/bugo/verify-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bugoId, token: tokenParam })
            })
                .then(res => res.json())
                .then(result => {
                    if (result.valid) {
                        // 유효한 토큰 → localStorage에 저장
                        localStorage.setItem(storageKey, 'true');
                        setIsOwner(true);
                    }
                    // 토큰 유효 여부 상관없이 URL 정리
                    window.history.replaceState({}, '', window.location.pathname);
                })
                .catch(() => {
                    // 에러 시에도 URL 정리
                    window.history.replaceState({}, '', window.location.pathname);
                });
        } else if (ownerParam === 'true') {
            // 기존 owner=true 방식 (하위 호환)
            localStorage.setItem(storageKey, 'true');
            setIsOwner(true);
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        } else {
            // localStorage에서 확인
            const savedOwner = localStorage.getItem(storageKey);
            setIsOwner(savedOwner === 'true');
        }

        // flower=open 파라미터 처리 (화환 모달 열기)
        if (flowerParam === 'open') {
            setFlowerModalOpen(true);
            // URL에서 flower 파라미터 제거
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }

        // share=true 파라미터 처리 (공유 모달 바로 열기)
        const shareParam = searchParams.get('share');
        if (shareParam === 'true') {
            setShareModalOpen(true);
            // URL에서 share 파라미터 제거
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
    }, [searchParams, params.id]);


    // GA 조회 이벤트 & 조회수 증가 (한 번만)
    useEffect(() => {
        gaEvents.viewBugo(bugo.bugo_number || bugo.id);

        // 조회수 증가 (백그라운드)
        import('@/lib/supabase').then(({ supabase }) => {
            supabase
                .from('bugo')
                .update({ view_count: ((bugo as any).view_count || 0) + 1 })
                .eq('id', bugo.id)
                .then();
        });
    }, [bugo.id]);


    // 스크롤 시 플로팅 화환 버튼 표시
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (scrollY > 100) {
                setShowFloatingFlower(true);
            } else {
                setShowFloatingFlower(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 🚀 Prefetch: 모달 열릴 때 주문/상세 페이지 미리 로드
    useEffect(() => {
        if (mounted && flowerModalOpen && selectedFlower) {
            router.prefetch(`/b2b/view/${params.id}/order/${selectedFlower}`);
            router.prefetch(`/b2b/view/${params.id}/flower/${selectedFlower}`);
        }
    }, [mounted, flowerModalOpen, selectedFlower, router, params.id]);

    // 🚀 Prefetch: 상품 변경 시 해당 페이지 미리 로드
    useEffect(() => {
        if (mounted && selectedFlower) {
            router.prefetch(`/b2b/view/${params.id}/order/${selectedFlower}`);
            router.prefetch(`/b2b/view/${params.id}/flower/${selectedFlower}`);
        }
    }, [mounted, selectedFlower, router, params.id]);

    // 🚀 초기 Prefetch: 모든 상품 페이지 미리 로드 (페이지 로드 시)
    useEffect(() => {
        if (mounted && flowerProducts.length > 0) {
            flowerProducts.forEach(product => {
                router.prefetch(`/b2b/view/${params.id}/order/${product.sort_order}`);
                router.prefetch(`/b2b/view/${params.id}/flower/${product.sort_order}`);
            });
        }
    }, [mounted, flowerProducts, router, params.id]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekDay = weekDays[date.getDay()];
        return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekDay})`;
    };

    const formatDateShort = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const copyAddress = async () => {
        if (bugo?.address) {
            await navigator.clipboard.writeText(bugo.address + (bugo.address_detail ? ' ' + bugo.address_detail : ''));
            gaEvents.copyAddress();
            setToastMessage('주소가 복사되었습니다');
            setTimeout(() => setToastMessage(null), 2000);
        }
    };

    // 공유용 URL: B2B는 bugoon.maeumbugo.co.kr 도메인 사용 + /b2b/view/ → /view/ 변환
    const getCleanShareUrl = (utmMedium?: string) => {
        // /b2b/view/7799 → /view/7799 로 변환 (조문객은 /view/ 경로로 접근)
        const pathname = window.location.pathname.replace(/^\/b2b\/view\//, '/view/');
        const baseUrl = window.location.hostname.includes('bugoon.maeumbugo.co.kr')
            ? `https://bugoon.maeumbugo.co.kr${pathname}`
            : window.location.hostname.includes('maeumbugo.co.kr')
                ? `https://bugoon.maeumbugo.co.kr${pathname}`
                : `${window.location.origin}${pathname}`;
        if (utmMedium) {
            return `${baseUrl}?utm_source=share&utm_medium=${utmMedium}&utm_campaign=bugo`;
        }
        return baseUrl;
    };
    // 공유 횟수 서버 추적
    const trackShare = (method: string) => {
        fetch('/api/bugo/track-share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bugoNumber: bugo.bugo_number, method })
        }).catch(() => { }); // 실패해도 무시
    };

    const copyToClipboard = async (text: string, message?: string, isAccount?: boolean) => {
        await navigator.clipboard.writeText(text);
        if (isAccount) gaEvents.copyAccount();
        setToastMessage(message || '복사되었습니다');
        setTimeout(() => setToastMessage(null), 2000);
    };

    const openNaverMap = () => {
        gaEvents.clickMap();
        if (bugo?.funeral_home) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(bugo.funeral_home)}`, '_blank');
        } else if (bugo?.address) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(bugo.address)}`, '_blank');
        }
    };

    const openKakaoNavi = () => {
        gaEvents.clickMap();
        if (bugo?.funeral_home) {
            // 장례식장명으로 검색하면 마커가 정확히 찍힘
            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(bugo.funeral_home)}`, '_blank');
        } else if (bugo?.address) {
            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(bugo.address)}`, '_blank');
        }
    };

    const shareViaKakao = () => {
        const shareUrl = getCleanShareUrl('kakao');

        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const Kakao = (window as any).Kakao;

            const B2B_KAKAO_KEY = '40f451664b3863f70a9537714dddd821';
            if (Kakao.isInitialized()) {
                try { Kakao.cleanup(); } catch (e) {}
            }
            Kakao.init(B2B_KAKAO_KEY);

            // 날짜/시간 포맷
            const formatKakaoDate = () => {
                if (!bugo?.death_date) return '';
                const date = new Date(bugo.death_date);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                if (bugo.death_time) {
                    const [hour, minute] = bugo.death_time.split(':');
                    const ampm = parseInt(hour) < 12 ? '오전' : '오후';
                    const h = parseInt(hour) % 12 || 12;
                    return `${month}월 ${day}일 ${ampm} ${h}시 ${minute}분경`;
                }
                return `${month}월 ${day}일`;
            };

            const ageText = bugo?.age ? `(향년 ${bugo.age}세)` : '';

            console.log('[카카오 공유] shareUrl:', shareUrl);

            gaEvents.shareBugo('kakao');
            trackShare('kakao');
            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: `故${bugo?.deceased_name}님${ageText}께서 ${formatKakaoDate()} 별세하셨음을 삼가 알려 드립니다`,
                    description: bugo?.funeral_home
                        ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''}`
                        : '',
                    imageUrl: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png',
                    link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
                },
                buttons: [{ title: '부고 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }]
            });
        } else {
            copyToClipboard(shareUrl);
        }
    };

    const shareViaSMS = () => {
        const url = getCleanShareUrl('sms');

        // 날짜/시간 포맷
        const formatDateTime = (dateStr?: string, timeStr?: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const ampm = timeStr ? (parseInt(timeStr.split(':')[0]) < 12 ? '오전' : '오후') : '';
            const hour = timeStr ? (parseInt(timeStr.split(':')[0]) % 12 || 12) : '';
            const minute = timeStr ? timeStr.split(':')[1] : '';
            return timeStr
                ? `${year}년 ${month}월 ${day}일 ${ampm} ${hour}시 ${minute}분`
                : `${year}년 ${month}월 ${day}일`;
        };

        const deathDateTime = formatDateTime(bugo?.death_date, bugo?.death_time);
        const funeralDateTime = formatDateTime(bugo?.funeral_date, bugo?.funeral_time);
        const mournerName = bugo?.mourner_name || '';

        const text = `[訃告]
故 ${bugo?.deceased_name} 님께서${mournerName ? ` (상주 ${mournerName})` : ''}
${deathDateTime}에
별세하셨기에 아래와 같이 부고를 전해드립니다.

[부고장 확인하기]
${url}

발인일: ${funeralDateTime || '추후 공지'}
빈소: ${bugo?.funeral_home || ''}${bugo?.room_number ? ' ' + bugo.room_number : ''}

갑작스러운 비보에 직접 연락드리지 못하고
모바일 부고장으로 알려드리는 점
너그러이 헤아려 주시기 바랍니다.`;

        gaEvents.shareBugo('sms');
        trackShare('sms');
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    };

    const shareViaBand = () => {
        const shareUrl = getCleanShareUrl('band');
        const title = `[訃告] 故 ${bugo?.deceased_name || ''} 부고장`;
        const content = `故 ${bugo?.deceased_name || ''} 님의 부고장입니다.`;

        gaEvents.shareBugo('band');
        trackShare('band');
        // 밴드 공유 URL 형식
        const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(title + '\n' + content)}&route=${encodeURIComponent(shareUrl)}`;
        window.open(bandUrl, '_blank', 'width=500,height=700');
    };

    // 로딩/에러 처리는 서버 컴포넌트에서 담당 (여기선 항상 bugo가 존재함)

    // 열람 기한 연장 예외 (고객 요청: 부고번호 → 만료일)
    const expiryExceptions: Record<string, string> = {
        '4286': '2026-07-05',  // 금동회/금무수 - 고객 요청으로 7/5까지 연장
    };

    // 1달 이상 지난 부고는 비공개 처리
    const isExpired = () => {
        if (!bugo.funeral_date) return false;
        // 연장 예외 체크
        const extendedUntil = expiryExceptions[String(bugo.bugo_number)];
        if (extendedUntil && new Date() <= new Date(extendedUntil)) return false;
        const funeralDate = new Date(bugo.funeral_date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        return funeralDate < oneMonthAgo;
    };

    // 발인 후 3일 경과 여부 (추모 오버레이용)
    const isFuneralEnded = () => {
        if (!bugo.funeral_date) return false;
        const funeralDate = new Date(bugo.funeral_date);
        const threeDaysAfter = new Date(funeralDate);
        threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
        return new Date() > threeDaysAfter;
    };

    // 발인 후 경과 일수 (부의금 CTA 노출 기간 제어용)
    const getDaysSinceFuneral = () => {
        if (!bugo.funeral_date) return 0;
        const funeralDate = new Date(bugo.funeral_date);
        const now = new Date();
        return Math.floor((now.getTime() - funeralDate.getTime()) / (1000 * 60 * 60 * 24));
    };
    // 부의금 CTA: 발인 후 3~7일만 노출 (8일부터 숨김)
    const showCondolenceCTA = getDaysSinceFuneral() <= 7;

    // 발인 일시 경과 여부 (화환 버튼 숨김용 - 발인 시간 지나면 바로)
    const isFuneralPassed = () => {
        if (!bugo.funeral_date) return false;
        const funeralDate = new Date(bugo.funeral_date);
        // 발인 시간이 있으면 추가
        if (bugo.funeral_time) {
            const [hours, minutes] = bugo.funeral_time.split(':').map(Number);
            funeralDate.setHours(hours || 0, minutes || 0, 0, 0);
        }
        return new Date() > funeralDate;
    };

    if (isExpired()) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <div className="error-icon">🕊️</div>
                    <h2>열람 기간이 종료되었습니다</h2>
                    <p>개인정보 보호를 위해 발인 후 30일이 지난 부고장은 비공개 처리됩니다.</p>
                    <Link href="/" className="btn-home">홈으로</Link>
                </div>
            </div>
        );
    }

    // 특정 부고는 오버레이 예외 처리 (고객 요청)
    const overlayExceptions = ['1818', '4286'];
    const showMemorialOverlay = mounted && isFuneralEnded() && !overlayExceptions.includes(String(bugo.bugo_number));

    // 오버레이 노출 이벤트 추적
    useEffect(() => {
        if (showMemorialOverlay) {
            gaEvents.viewMemorialOverlay(String(bugo.bugo_number), getDaysSinceFuneral());
        }
    }, [showMemorialOverlay]);

    // 상주 목록 (대표상주 + 추가 상주들, 중복 방지)
    const mournersList: Array<{ relationship: string; name: string; contact: string }> = [];
    if (bugo.mourner_name) {
        mournersList.push({ relationship: bugo.relationship || '상주', name: bugo.mourner_name, contact: bugo.contact || '' });
    }
    if (bugo.mourners && Array.isArray(bugo.mourners)) {
        // 대표상주와 이름+관계가 같으면 중복이므로 제외
        bugo.mourners.forEach(m => {
            if (m.name && !(m.name === bugo.mourner_name && m.relationship === bugo.relationship)) {
                mournersList.push(m);
            }
        });
    }

    // 템플릿 이미지 결정
    const getTemplateImage = () => {
        const templateId = bugo.template_id || 'basic';
        if (templateId === 'basic' && bugo.photo_url) {
            return '/images/template-basic-pik1.png';
        }
        return `/images/template-${templateId}.png`;
    };

    return (
        <div className="b2b-view-wrapper">
            <main className="view-page">
                {/* B2B 제휴 브랜드 최상단 로고 탑 바 */}
                {bugo.partner_logo_url && bugo.partner_logo_url !== 'mute' && (
                    <div className="b2b-top-header-bar">
                        {mounted ? (
                            <img src={bugo.partner_logo_url} alt="제휴 브랜드 로고" className="b2b-top-header-logo" />
                        ) : (
                            <div className="b2b-top-header-logo-placeholder" style={{ height: '68px', width: '200px' }} />
                        )}
                    </div>
                )}

                {/* 발인 완료 추모 오버레이 */}
                {showMemorialOverlay && (
                    <div className="memorial-overlay">
                        <div className="memorial-content">
                        <Image src="/images/mourning-ribbon.png" alt="추모" className="memorial-ribbon" width={80} height={100} />
                        <p className="memorial-message">발인이 끝난 고인입니다.</p>
                        <p className="memorial-sub">삼가 고인의 명복을 빕니다.</p>
                    </div>
                    <div className="memorial-cta-section">
                        <div className="memorial-cta-divider"></div>
                        <h3 className="memorial-cta-title">아직 전하지 못한 마음이 있으신가요?</h3>
                        <div className="memorial-cta-list">
                            {/* 부의금 보내기 - 발인 후 3~7일만 노출 */}
                            {showCondolenceCTA && (
                            <button className="memorial-cta-item memorial-cta-condolence" onClick={() => { gaEvents.clickOverlayCondolence(String(bugo.bugo_number)); setAccountModalOpen(true); }}>
                                <div className="memorial-cta-icon memorial-cta-icon-condolence">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                                        <line x1="2" y1="10" x2="22" y2="10"/>
                                    </svg>
                                </div>
                                <div className="memorial-cta-text">
                                    <div className="memorial-cta-item-title">뒤늦은 위로의 마음 전하기</div>
                                    <div className="memorial-cta-item-desc">부의금을 카드로 간편하게 보낼 수 있어요</div>
                                </div>
                                <div className="memorial-cta-arrow">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                            </button>
                            )}
                            {/* 답례품 보내기 - DB 연동 후 활성화 예정
                            <a href="/gift" className="memorial-cta-item memorial-cta-gift">
                                <div className="memorial-cta-icon memorial-cta-icon-gift">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 12 20 22 4 22 4 12"/>
                                        <rect x="2" y="7" width="20" height="5"/>
                                        <line x1="12" y1="22" x2="12" y2="7"/>
                                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                                    </svg>
                                </div>
                                <div className="memorial-cta-text">
                                    <div className="memorial-cta-item-title">감사의 마음을 답례품으로</div>
                                    <div className="memorial-cta-item-desc">조문해주신 분들께 답례품을 보내보세요</div>
                                </div>
                                <div className="memorial-cta-arrow">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                            </a>
                            */}
                            {/* 장묘시설 찾기 */}
                            <a href="https://daedaesonson.com" target="_blank" rel="noopener noreferrer" className="memorial-cta-item" onClick={() => gaEvents.clickOverlayFacility(String(bugo.bugo_number))}>
                                <div className="memorial-cta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                                <div className="memorial-cta-text">
                                    <div className="memorial-cta-item-title">장지 비교하기</div>
                                    <div className="memorial-cta-item-desc">전국 수목장·봉안당 가격 비교</div>
                                </div>
                                <div className="memorial-cta-arrow">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                            </a>
                        </div>
                        <p className="memorial-cta-powered">부고온</p>
                    </div>
                </div>
            )}

            {/* 토스트 */}
            {toastMessage && <div className="toast" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', background: '#000000' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" style={{ marginRight: '8px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>{toastMessage}</div>}

            {/* ========================================
                헤더 섹션 - 템플릿 이미지 + 동적 텍스트 (사진 유무에 따른 분기)
            ======================================== */}
            <div className={`header-section template-${bugo.template_id || 'basic'} ${bugo.photo_url ? 'has-photo' : ''}`}>
                <Image src={getTemplateImage()} alt="" className="header-bg" width={600} height={800} priority />
                {/* 동적 텍스트만 오버레이 - 이미지에 謹弔/부고 등 정적 텍스트 포함됨 */}
                <div className="header-text-overlay">
                    {bugo.photo_url ? (
                        /* 고인 사진이 있을 때 */
                        <div className="header-photo-container">
                            <div className="header-photo-title-img-wrapper">
                                <img 
                                    src="/images/template-basic-pik2.png" 
                                    alt="부고" 
                                    className="header-photo-title-img" 
                                />
                            </div>
                            <div className="header-deceased-photo-wrapper">
                                <img 
                                    src={bugo.photo_url} 
                                    alt="고인 영정 사진" 
                                    className="header-deceased-photo" 
                                />
                            </div>
                            <div className="header-deceased-title">
                                故 {bugo.deceased_name}님
                                {bugo.age && <span className="header-deceased-age"> ({bugo.age}세)</span>}
                            </div>
                            {bugo.religious_title && bugo.show_religious_title && (
                                <div className="header-religious-title">
                                    {bugo.religious_title}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 고인 사진이 없을 때 (기존 텍스트 레이아웃) */
                        <div className={`header-deceased-info ${!bugo.religious_title ? 'no-religious-title' : ''}`}>
                            <div className="header-deceased-title">
                                故 {bugo.deceased_name}님
                                {bugo.age && <span className="header-deceased-age"> ({bugo.age}세)</span>}
                            </div>
                            {bugo.religious_title && bugo.show_religious_title && (
                                <div className="header-religious-title">
                                    {bugo.religious_title}
                                </div>
                            )}
                        </div>
                    )}
                    <p className="header-dynamic-text">
                        {bugo.death_date ? formatDateShort(bugo.death_date) : ''} 故 {bugo.deceased_name}님께서<br />
                        별세하셨기에 삼가 알려드립니다.<br />
                        마음으로 따뜻한 위로 부탁드리며<br />
                        고인의 명복을 빌어주시길 바랍니다.
                    </p>
                </div>
            </div>

            {/* 구분선 */}
            <div className="section-divider"></div>

            {/* 장례식장 박스 - 일반 장례일 때만, 헤더 바로 아래 */}
            {shouldShowFuneralHomeBox({ funeralType: bugo.funeral_type, funeralHome: bugo.funeral_home }) && (
                <>
                    <div className="funeral-box funeral-box-inline funeral-box-top">
                        <span className="funeral-name">{bugo.funeral_home}</span>
                        {bugo.room_number && (
                            <>
                                <span className="funeral-divider">|</span>
                                <span className="funeral-room">{bugo.room_number}</span>
                            </>
                        )}
                    </div>
                    {/* 구분선 */}
                    <div className="section-divider"></div>
                </>
            )}

            {/* ========================================
                발인 및 장지
            ======================================== */}
            <section className="section">
                <div className="funeral-info-table">
                    {/* 고인 */}
                    <div className="funeral-info-row funeral-highlight">
                        <span className="funeral-info-label">고인</span>
                        <span className="funeral-info-value">故{bugo.deceased_name} {bugo.age ? `(향년 ${bugo.age}세)` : ''}</span>
                    </div>
                    <div className="funeral-info-divider"></div>
                    {/* 일포일시 - 있으면 진하게 표시 (발인보다 먼저) */}
                    {shouldShowIlpo({ funeralType: bugo.funeral_type, ilpoDate: bugo.ilpo_date }) && (
                        <div className="funeral-info-row funeral-highlight">
                            <span className="funeral-info-label">일포</span>
                            <span className="funeral-info-value">{formatDate(bugo.ilpo_date!)} {bugo.ilpo_time || ''}</span>
                        </div>
                    )}
                    {/* 발인 - 일포가 있으면 연하게, hide_funeral이 true면 숨김 */}
                    {shouldShowFuneral({ funeralType: bugo.funeral_type, funeralDate: bugo.funeral_date, hideFuneral: bugo.hide_funeral }) && (
                        <>
                            {shouldShowIlpo({ funeralType: bugo.funeral_type, ilpoDate: bugo.ilpo_date }) && <div className="funeral-info-divider"></div>}
                            <div className={`funeral-info-row ${bugo.ilpo_date ? '' : 'funeral-highlight'}`}>
                                <span className="funeral-info-label">발인</span>
                                <span className="funeral-info-value">{formatDate(bugo.funeral_date!)} {bugo.funeral_time || ''}</span>
                            </div>
                        </>
                    )}
                    {shouldShowEncoffin(bugo.encoffin_date, 'b2b') && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">입관</span>
                                <span className="funeral-info-value">{formatDate(bugo.encoffin_date!)} {bugo.encoffin_time || ''}</span>
                            </div>
                        </>
                    )}
                    {bugo.death_date && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">별세</span>
                                <span className="funeral-info-value">{formatDate(bugo.death_date)} {bugo.death_time || ''}</span>
                            </div>
                        </>
                    )}
                    {/* 가족장/무빈소장례일 때 빈소 라벨 표시 — lib/funeral-display.ts 참조 */}
                    {getCeremonyLabel(bugo.funeral_type) && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">빈소</span>
                                <span className="funeral-info-value">{getCeremonyLabel(bugo.funeral_type)}</span>
                            </div>
                        </>
                    )}
                    {/* 장지 - 1개면 단순 표시, 2개면 1차/2차 표시 */}
                    {shouldShowBurialPlace({ funeralType: bugo.funeral_type, burialPlace: bugo.burial_place }) && !bugo.burial_place2 && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row">
                                <span className="funeral-info-label">장지</span>
                                <span className="funeral-info-value">{bugo.burial_place}</span>
                            </div>
                        </>
                    )}
                    {shouldShowBurialPlace({ funeralType: bugo.funeral_type, burialPlace: bugo.burial_place }) && bugo.burial_place2 && (
                        <>
                            <div className="funeral-info-divider"></div>
                            <div className="funeral-info-row burial-multi">
                                <span className="funeral-info-label">장지</span>
                                <div className="funeral-info-value">
                                    <div>1차 장지 : {bugo.burial_place}</div>
                                    <div>2차 장지 : {bugo.burial_place2}</div>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="funeral-info-divider"></div>
                    <div className="funeral-info-row">
                        <span className="funeral-info-label">안내사항</span>
                        <span className="funeral-info-value">
                            {bugo.message && bugo.message.trim() ? bugo.message : "뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다."}
                        </span>
                    </div>
                </div>
            </section>

            {/* 구분선 */}
            <div className="section-divider"></div>

            {/* ========================================
                상주
            ======================================== */}
            <section className="section mourners-section">
                <h2 className="section-title">상주</h2>
                <div className="mourners-table">
                    {(() => {
                        // 관계별로 그룹핑
                        const grouped: Record<string, Array<{ name: string; contact: string }>> = {};
                        mournersList.forEach(m => {
                            if (!grouped[m.relationship]) grouped[m.relationship] = [];
                            grouped[m.relationship].push({ name: m.name, contact: m.contact });
                        });
                        return Object.entries(grouped).map(([rel, names], i) => (
                            <div className="mourner-row" key={i}>
                                <span className="mourner-rel">{rel}</span>
                                <span className="mourner-names">
                                    {names.map((n, j) => (
                                        <span key={j}>
                                            {j > 0 && ', '}
                                            {n.contact ? (
                                                <a href={`tel:${n.contact}`} className="mourner-tel-inline" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
                                                    {n.name}
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#999999" stroke="none" style={{ marginLeft: '2px' }}>
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                n.name
                                            )}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        ));
                    })()}
                </div>
                {/* 부고 공유하기 / 부의금 보내기 버튼 - 모든 장례형식에서 표시 */}
                {(() => {
                    const hasAccount = (bugo.account_info && Array.isArray(bugo.account_info) && bugo.account_info.length > 0) ||
                        (bugo.mourners && Array.isArray(bugo.mourners) && bugo.mourners.some((m: any) => m.bank && m.accountNumber));

                    if (hasAccount) {
                        return (
                            <div className="action-bar action-bar-split">
                                <button className="action-bar-btn" onClick={() => { gaEvents.openAccountModal(); setAccountModalOpen(true); }} style={{ fontFamily: "'Pretendard', sans-serif" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </svg>
                                    <span>부의금보내기</span>
                                </button>
                                <div className="action-bar-divider"></div>
                                <button className="action-bar-btn" onClick={() => setShareModalOpen(true)} style={{ fontFamily: "'Pretendard', sans-serif" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                    <span>지인에게 공유하기</span>
                                </button>
                            </div>
                        );
                    } else {
                        return (
                            <div className="action-bar">
                                <button className="action-bar-btn" onClick={() => setShareModalOpen(true)} style={{ fontFamily: "'Pretendard', sans-serif" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                    <span>지인에게 공유하기</span>
                                </button>
                            </div>
                        );
                    }
                })()}
            </section>

            {/* ========================================
                빈소 오시는 길 - 일반 장례일 때만 표시
            ======================================== */}
            {shouldShowMap(bugo.funeral_type) && (
                <section className="section">
                    <h2 className="section-title">빈소 오시는 길</h2>

                    <div className="address-row">
                        <p className="address-text">{bugo.address} {bugo.address_detail || ''}</p>
                        <button className="btn-copy-address" onClick={copyAddress} style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            주소 복사
                        </button>
                    </div>

                    {/* 지도 */}
                    <div className="map-container">
                        <NaverMap
                            address={bugo.address || ''}
                            placeName={bugo.funeral_home}
                            height="200px"
                        />
                    </div>

                    {/* 내비 버튼 */}
                    <div className="navi-buttons">
                        <button className="navi-btn" onClick={openNaverMap} style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600 }}>
                            <Image src="/images/ic_naver_map.png" alt="네이버지도" className="navi-icon" width={24} height={24} />
                            <span>네이버지도</span>
                        </button>
                        <button className="navi-btn" onClick={openKakaoNavi} style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600 }}>
                            <Image src="/images/ic_kakao_navi.png" alt="카카오내비" className="navi-icon" width={24} height={24} />
                            <span>카카오내비</span>
                        </button>
                    </div>

                    {/* 장례식장 전화하기 버튼 */}
                    {bugo.funeral_home_tel && (
                        <a href={`tel:${bugo.funeral_home_tel}`} className="call-funeral-btn" onClick={() => gaEvents.clickCall()} style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <div className="call-btn-text">
                                <span className="call-btn-title" style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600 }}>장례식장에 전화하기</span>
                                <span className="call-btn-number" style={{ fontFamily: "'Pretendard', sans-serif" }}>{bugo.funeral_home_tel}</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </a>
                    )}
                </section>
            )}

            {/* 계좌 정보는 모달로 표시 */}


            {/* ========================================
                꽃으로 마음을 보내신 분 - 일반 장례일 때만 표시
            ======================================== */}
            {mounted && shouldShowFlowerSection({ funeralType: bugo.funeral_type, hideFlowerOrder: bugo.hide_flower_order }) && (
                <section className="section flower-section">
                    <h2 className="section-title">꽃으로 마음을 보내신 분</h2>

                    <div className="flower-list">
                        {flowerOrders.length > 0 ? (
                            flowerOrders.map((order, idx) => (
                                <div key={idx} className="flower-sender-item">
                                    <div className="flower-sender-name">{order.ribbon_text2 || order.sender_name}</div>
                                    <div className="flower-sender-message">{order.ribbon_text1}</div>
                                </div>
                            ))
                        ) : (
                            <div className="flower-empty">
                                <p>고인을 향한 따뜻한 마음</p>
                                <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>화환으로 조의를 전하세요.</p>
                            </div>
                        )}
                    </div>
                </section>
            )}


            {/* ========================================
                공유 모달
            ======================================== */}
            {shareModalOpen && (
                <div className="share-modal">
                    <div className="share-overlay" onClick={() => setShareModalOpen(false)}></div>
                    <div className="share-content">
                        <div className="share-header">
                            <h3>공유하기</h3>
                            <button className="share-close" onClick={() => setShareModalOpen(false)}>✕</button>
                        </div>
                        <button className="share-option" onClick={shareViaKakao}>
                            <Image src="/images/icon-kakao.png" alt="카카오톡" width={32} height={32} />
                            <span>카카오톡으로 보내기</span>
                        </button>
                        <button className="share-option" onClick={shareViaSMS}>
                            <Image src="/images/icon-message.png" alt="메세지" width={32} height={32} />
                            <span>메세지로 보내기</span>
                        </button>
                        <button className="share-option" onClick={shareViaBand}>
                            <Image src="/images/icon-band.png" alt="밴드" width={32} height={32} />
                            <span>밴드로 보내기</span>
                        </button>
                        <button className="share-option" onClick={() => { copyToClipboard(getCleanShareUrl(), '모바일부고장이 복사되었습니다'); trackShare('link'); }}>
                            <Image src="/images/icon-link.png" alt="링크" width={32} height={32} />
                            <span>링크 복사하기</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================
                부의금 계좌 바텀시트 모달
            ======================================== */}
            {accountModalOpen && (
                <div className="account-modal-overlay" onClick={() => setAccountModalOpen(false)}>
                    <div className="account-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-header">
                            <h3>부의금 계좌</h3>
                            <button className="sheet-close" onClick={() => setAccountModalOpen(false)}>✕</button>
                        </div>
                        <div className="account-list">
                            {(() => {
                                const allAccounts: Array<{ bank: string; holder: string; number: string; relationship?: string; name?: string }> = [];

                                // 대표상주 계좌 (account_info)
                                if (bugo.account_info && Array.isArray(bugo.account_info)) {
                                    bugo.account_info.forEach(acc => {
                                        if (acc.bank && acc.number) {
                                            allAccounts.push({
                                                bank: acc.bank,
                                                holder: acc.holder || bugo.mourner_name || '',
                                                number: acc.number,
                                                relationship: bugo.relationship || '상주',
                                                name: bugo.mourner_name || ''
                                            });
                                        }
                                    });
                                }

                                // 추가 상주들 계좌 (mourners[0] 제외 - 대표상주와 중복 방지)
                                if (bugo.mourners && Array.isArray(bugo.mourners)) {
                                    bugo.mourners.slice(1).forEach((m: any) => {
                                        if (m.bank && m.accountNumber) {
                                            allAccounts.push({
                                                bank: m.bank,
                                                holder: m.accountHolder || m.name || '',
                                                number: m.accountNumber,
                                                relationship: m.relationship || '',
                                                name: m.name || ''
                                            });
                                        }
                                    });
                                }

                                // URL 쿼리 파라미터 'm' (인덱스 또는 상주명) 에 따른 계좌 필터링 처리
                                const mParam = searchParams.get('m');
                                let filteredAccounts = allAccounts;

                                if (mParam) {
                                    const mournersArr = Array.isArray(bugo.mourners) ? bugo.mourners : [];
                                    const isNumeric = /^\d+$/.test(mParam);
                                    let currentMourner = null;

                                    if (isNumeric) {
                                        const idx = parseInt(mParam, 10);
                                        currentMourner = mournersArr[idx];
                                    } else {
                                        // 하이브리드 폴백: 기존 텍스트(이름) 대응
                                        currentMourner = mournersArr.find((m: any) => m.name === mParam);
                                    }

                                    if (currentMourner) {
                                        const displayOpt = (currentMourner as any).accountDisplay || 'mine';
                                        if (displayOpt === 'none') {
                                            filteredAccounts = [];
                                        } else if (displayOpt === 'mine') {
                                            filteredAccounts = allAccounts.filter(
                                                acc => acc.name === currentMourner.name || acc.holder === currentMourner.name
                                            );
                                        }
                                    }
                                }

                                return filteredAccounts.map((acc, i) => {
                                    const bankLogo = getBankLogo(acc.bank);
                                    return (
                                        <div className="account-card" key={i}>
                                            <div className="account-card-header">
                                                <span className="account-rel">{acc.relationship}</span>
                                                <span className="account-name">{acc.name || acc.holder}</span>
                                            </div>
                                            <div className="account-card-body">
                                                {bankLogo && (
                                                    <img src={bankLogo} alt={acc.bank} className="bank-logo" />
                                                )}
                                                <div className="account-detail">
                                                    <span className="account-bank-holder">{acc.bank}({acc.holder})</span>
                                                    <span className="account-number">{acc.number}</span>
                                                </div>
                                                <button className="btn-copy-account" onClick={() => copyToClipboard(acc.number, '계좌번호가 복사되었습니다', true)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                    계좌복사
                                                </button>
                                            </div>
                                            {/* 부의금 카드결제 버튼 */}
                                            {mounted && condolenceActive && (
                                                <button
                                                    style={{
                                                        width: 'calc(100% - 40px)',
                                                        margin: '6px 20px 20px',
                                                        padding: '10px',
                                                        background: '#FFFFFF',
                                                        border: '1px solid #333333',
                                                        borderRadius: '8px',
                                                        textAlign: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontFamily: "'Pretendard', -apple-system, sans-serif",
                                                        color: '#333',
                                                        fontWeight: 500
                                                    }}
                                                    onClick={() => {
                                                        window.location.href = `/b2b/view/${params.id}/condolence?m=${i}`;
                                                    }}
                                                >
                                                    카드결제
                                                </button>
                                            )}
                                        </div>
                                    )
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {
                mounted && shouldShowFlowerSection({ funeralType: bugo.funeral_type, hideFlowerOrder: bugo.hide_flower_order }) && !isFuneralPassed() && !shareModalOpen && !accountModalOpen && (
                    <div
                        className={`floating-flower-cta ${(showFloatingFlower || flowerModalOpen) ? 'show' : 'hide'} ${flowerModalOpen ? 'modal-open' : ''}`}
                    >
                        <button
                            className={`btn-flower-search-floating ${flowerModalOpen ? 'show' : ''}`}
                            onClick={() => {
                                if (selectedFlower) {
                                    const product = flowerProducts.find(p => p.sort_order === selectedFlower);
                                    if (product) {
                                        sessionStorage.setItem(`product_cache_${selectedFlower}`, JSON.stringify(product));
                                        sessionStorage.setItem(`bugo_cache_${params.id}`, JSON.stringify(bugo));
                                    }
                                    router.push(`/b2b/view/${params.id}/flower/${selectedFlower}`);
                                }
                            }}
                        >
                            <span className="material-symbols-outlined">search</span>
                        </button>
                        <button
                            className="btn-floating-flower"
                            onClick={() => {
                                if (flowerModalOpen && selectedFlower !== null) {
                                    const product = flowerProducts.find(p => p.sort_order === selectedFlower);
                                    if (product) {
                                        sessionStorage.setItem(`product_cache_${selectedFlower}`, JSON.stringify(product));
                                        sessionStorage.setItem(`bugo_cache_${params.id}`, JSON.stringify(bugo));
                                    }
                                    gaEvents.startFlowerOrder(String(selectedFlower));
                                    router.push(`/b2b/view/${params.id}/order/${selectedFlower}`);
                                } else {
                                    gaEvents.clickFlowerButton();
                                    gaEvents.openFlowerModal();
                                    setFlowerModalOpen(true);
                                }
                            }}
                        >
                            {flowerModalOpen ? '주문하기' : '화환 보내기'}
                        </button>
                    </div>
                )
            }

            {/* 화환 주문 바텀시트 모달 */}
            {
                flowerModalOpen && (
                    <div className="flower-modal-overlay" onClick={() => setFlowerModalOpen(false)}>
                        <div className="flower-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="flower-modal-header">
                                <button className="flower-modal-close" style={{ color: '#888888' }} onClick={() => setFlowerModalOpen(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                                <h2 className="flower-modal-title">故{bugo?.deceased_name}님</h2>
                                <p className="flower-modal-subtitle">
                                    {bugo?.mourners?.[0]?.relationship} {bugo?.mourners?.[0]?.name}님의 {getDeceasedRelation(bugo?.mourners?.[0]?.relationship || '', bugo?.gender || '')} 故{bugo?.deceased_name}님께서<br />
                                    {bugo?.death_date?.split('T')[0]?.replace(/-/g, '.')} 별세하셨기에 삼가 알려드립니다
                                </p>
                            </div>

                            <div className="flower-product-list">
                                {flowerProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flower-product-item"
                                        onClick={() => {
                                            const newVal = selectedFlower === product.sort_order ? null : product.sort_order;
                                            setSelectedFlower(newVal);
                                            if (newVal !== null) gaEvents.selectFlower(String(product.sort_order));
                                        }}
                                    >
                                        <div className={`flower-radio ${selectedFlower === product.sort_order ? 'checked' : ''}`} />
                                        <div className="flower-product-image">
                                            <img src={product.images?.[0] || '/images/flower-wreath.png'} alt={product.name} />
                                        </div>
                                        <div className="flower-product-info">
                                            <h3 className="flower-product-name">{product.name}</h3>
                                            <p className="flower-product-desc">{product.description}</p>
                                            <div className="flower-product-price">
                                                <span className="sale-price">
                                                    {calculateRegionalPrice(product.price, product.discount_price, product.regional_prices, product.special_surcharges, bugoRegion, bugoAddress).toLocaleString()}원
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ========================================
                Footer - PG 승인용 사업자 정보
            ======================================== */}
            {/* Footer 숨김 처리 - 2026-02-04
            <footer className="view-footer">
                <p className="view-footer-company">부고온</p>
                <p>서울특별시 강남구 압구정로 306</p>
                <p>대표: 김미연 | 대표번호: 010-4837-5076</p>
                <p>사업자등록번호: 408-22-68851 | 통신판매업신고: 2026-서울강남-00502</p>
                <p className="view-footer-copyright">© 2026 maeumbugo. All rights reserved.</p>
            </footer>
            */}
        </main>
    </div>
    );
}
