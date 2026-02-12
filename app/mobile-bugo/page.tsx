import { Metadata } from 'next';
import MobileBugoContent from './MobileBugoContent';

export const metadata: Metadata = {
    title: '모바일 부고장 무료 제작 - 3분 완성, 카카오톡 공유 | 마음부고',
    description: '모바일 부고장을 무료로 만드세요. 회원가입 없이 3분이면 완성. 4가지 품격 있는 템플릿, 카카오톡 간편 공유, 광고 없음. 무빈소·가족장에도 사용 가능한 모바일 부고장 서비스.',
    keywords: '모바일 부고장, 모바일부고장, 모바일부고, 부고장 만들기, 무료 부고장, 온라인 부고장, 카카오톡 부고장, 부고문자, 모바일 부고, 디지털 부고장',
    alternates: {
        canonical: 'https://maeumbugo.co.kr/mobile-bugo',
    },
    openGraph: {
        title: '모바일 부고장 무료 제작 - 3분 완성 | 마음부고',
        description: '무료 모바일 부고장을 3분 만에 만들고 카카오톡으로 공유하세요. 광고 없음, 회원가입 불필요.',
        type: 'website',
        url: 'https://maeumbugo.co.kr/mobile-bugo',
        siteName: '마음부고',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-maeumbugo.png',
                width: 1200,
                height: 630,
                alt: '마음부고 모바일 부고장 무료 제작',
            },
        ],
    },
};

export default function Page() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": "https://maeumbugo.co.kr/mobile-bugo",
                "url": "https://maeumbugo.co.kr/mobile-bugo",
                "name": "모바일 부고장 무료 제작",
                "description": "모바일 부고장을 무료로 만드세요. 3분 완성, 카카오톡 공유, 광고 없음.",
                "isPartOf": { "@id": "https://maeumbugo.co.kr/#website" },
                "about": {
                    "@type": "SoftwareApplication",
                    "name": "마음부고 모바일 부고장",
                    "applicationCategory": "LifestyleApplication",
                    "operatingSystem": "Web",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "KRW"
                    }
                },
                "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "마음부고",
                            "item": "https://maeumbugo.co.kr"
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "모바일 부고장",
                            "item": "https://maeumbugo.co.kr/mobile-bugo"
                        }
                    ]
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "모바일 부고장은 정말 무료인가요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "네, 마음부고의 모든 기능은 완전히 무료입니다. 모바일 부고장 제작, 공유, 수정까지 비용이 전혀 들지 않습니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "모바일 부고장은 어떻게 공유하나요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "완성된 모바일 부고장의 링크를 카카오톡, 문자, 밴드 등으로 공유할 수 있습니다. 공유 버튼을 누르면 바로 전달됩니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "장례식장이 없어도 모바일 부고장을 만들 수 있나요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "네, 무빈소 장례나 가족장의 경우에도 모바일 부고장을 제작할 수 있습니다. 장례식장 정보는 선택사항입니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "모바일 부고장 수정은 가능한가요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "네, 작성 시 입력한 비밀번호로 언제든지 수정할 수 있습니다. 장례 일정이 변경되어도 바로 업데이트됩니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "모바일 부고장은 얼마나 유지되나요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "생성된 모바일 부고장은 발인 후 30일까지 열람 가능합니다. 이후에는 개인정보 보호를 위해 비공개 처리됩니다."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "모바일 부고장 만들 때 회원가입이 필요한가요?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "아닙니다. 별도의 회원가입이나 앱 설치 없이 바로 모바일 부고장을 만들 수 있습니다."
                        }
                    }
                ]
            },
            {
                "@type": "HowTo",
                "name": "모바일 부고장 만드는 법",
                "description": "마음부고에서 3분 만에 무료로 모바일 부고장을 만드는 방법",
                "totalTime": "PT3M",
                "tool": {
                    "@type": "HowToTool",
                    "name": "마음부고 웹사이트"
                },
                "step": [
                    {
                        "@type": "HowToStep",
                        "name": "템플릿 선택",
                        "text": "4가지 품격 있는 디자인 템플릿 중 하나를 선택합니다.",
                        "url": "https://maeumbugo.co.kr/create"
                    },
                    {
                        "@type": "HowToStep",
                        "name": "정보 입력",
                        "text": "고인 정보, 상주 연락처, 장례 일정을 입력합니다."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "장례식장 검색",
                        "text": "전국 1,100여 개 장례식장에서 선택합니다."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "카카오톡 공유",
                        "text": "완성된 모바일 부고장을 카카오톡으로 공유합니다."
                    }
                ]
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MobileBugoContent />
        </>
    );
}
