'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type ReligionType = 'general' | 'christian' | 'catholic' | 'buddhist';

interface ThanksMessages {
    general?: string;
    christian?: string;
    catholic?: string;
    buddhist?: string;
}

interface BugoData {
    id: string;
    deceased_name: string;
    mourner_name?: string;
    religion?: string;
    funeral_date?: string;
    thanks_message?: string | ThanksMessages;
}

interface CardContentProps {
    bugo: BugoData;
    bugoId: string;
}

// 종교별 심볼 이미지 (thanks 페이지와 동일)
const symbolImages: Record<ReligionType, string> = {
    general: '/images/thanks/thanks-general.jpg',
    christian: '/images/thanks/thanks-christian.jpg',
    catholic: '/images/thanks/thanks-catholic.jpg',
    buddhist: '/images/thanks/thanks-buddhist.jpg',
};

// 종교별 문구 (thanks 페이지와 동일)
const messages: Record<ReligionType, { title: string; body: string[] }> = {
    general: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님의 마지막 길에<br/>함께해 주셔서 감사드립니다.',
            '보내주신 따뜻한 마음과 위로가<br/>슬픔 속에서 큰 힘이 되었습니다.',
            '직접 찾아뵙고 인사드려야 하나,<br/>이렇게 글로 먼저 감사의 말씀을 전합니다.',
            '건강하시고 좋은 일만 가득하시기를 기원합니다.',
        ],
    },
    christian: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님의 마지막 길에<br/>함께해 주시고 위로해 주셔서 진심으로 감사드립니다.',
            '보내주신 따뜻한 기도와 위로의 말씀이<br/>주님의 은혜처럼 저희 가족에게 큰 힘이 되었습니다.',
            '이제 주님 품에서 편히 쉬고 계시며,<br/>저희도 믿음 안에서 다시 만날 날을 소망합니다.',
            '주님의 사랑 안에서<br/>늘 축복 가득하시기를 기도드립니다.',
        ],
    },
    catholic: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님을 위해<br/>기도해 주시고 위로해 주셔서 깊이 감사드립니다.',
            '보내주신 따뜻한 위로와 기도가<br/>슬픔을 견디는 데 큰 힘이 되었습니다.',
            '이제 영원한 안식을 누리고 계시며,<br/>저희도 언젠가 다시 만날 날을 기다립니다.',
            '하느님의 은총이<br/>늘 함께하시기를 기도드립니다.',
        ],
    },
    buddhist: {
        title: '삼가 감사 인사 드립니다',
        body: [
            '귀한 시간 내시어 故{deceased}님의 왕생길에<br/>함께해 주시고 명복을 빌어주셔서 깊이 감사드립니다.',
            '보내주신 따뜻한 위로와 독경이<br/>슬픔 속에서 큰 위안이 되었습니다.',
            '이제 극락세계에서 편히 쉬고 계시며,<br/>저희도 인연의 끈으로 다시 만날 날을 기다립니다.',
            '부처님의 가피로<br/>늘 평안하시기를 기원합니다.',
        ],
    },
};

// 종교 매핑
const getReligionType = (religion?: string): ReligionType => {
    if (religion === '기독교') return 'christian';
    if (religion === '천주교') return 'catholic';
    if (religion === '불교') return 'buddhist';
    return 'general';
};

// thanks_message 파싱
const parseCustomMessages = (thanksMessage: string | ThanksMessages | undefined): ThanksMessages => {
    if (!thanksMessage) return {};
    if (typeof thanksMessage === 'object') return thanksMessage;
    try {
        return JSON.parse(thanksMessage);
    } catch {
        return { general: thanksMessage };
    }
};

export default function CardContent({ bugo, bugoId }: CardContentProps) {
    const searchParams = useSearchParams();

    // URL에서 religion 파라미터 가져오기, 없으면 DB의 thanks_religion, 그것도 없으면 religion 사용
    const religionParam = searchParams.get('religion') as ReligionType | null;
    const savedReligion = (bugo as any).thanks_religion as ReligionType | null;
    const religionType = religionParam || savedReligion || getReligionType(bugo.religion);

    const customMessages = parseCustomMessages(bugo.thanks_message);
    const currentCustomMessage = customMessages[religionType];
    const currentMessage = messages[religionType];

    // 날짜 포맷
    const formatDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일`;
    };

    // 문구 치환
    const replaceDeceased = (text: string) => {
        return text.replace('{deceased}', bugo.deceased_name || '고인');
    };

    return (
        <div className="thanks-page">
            {/* 배경 이미지 (thanks 페이지와 동일) */}
            <div className="thanks-bg">
                <Image
                    src={symbolImages[religionType]}
                    alt=""
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                    priority
                />
            </div>

            {/* 컨텐츠 */}
            <div className="thanks-content">
                {/* 메시지 카드 */}
                <div className="thanks-card">
                    <h1 className="thanks-title">{currentMessage.title}</h1>

                    <div className="thanks-body">
                        {currentCustomMessage ? (
                            currentCustomMessage.split('\n\n').map((paragraph, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br/>') || '&nbsp;' }} />
                            ))
                        ) : (
                            currentMessage.body.map((text, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: replaceDeceased(text) }} />
                            ))
                        )}
                    </div>

                    <div className="thanks-footer">
                        <p className="thanks-date">{formatDate()}</p>
                        <p className="thanks-mourner">{bugo.mourner_name || '상주'} 배상</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
