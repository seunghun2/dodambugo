import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const commonDisallow = [
        '/admin/',
        '/api/',
        '/b2b/',
        '/view/',
        '/create/complete/',
        '/create/edit/',
        '/order/',
        '/review/',
    ]

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/guide/',
                    '/guide/mobile-bugo',
                    '/guide/funeral-home',
                    '/create',
                    '/faq',
                    '/search',
                    '/contact',
                ],
                disallow: commonDisallow,
            },
            // 구글 검색 크롤러 (크롤링 예산 보호 및 /_next 정적 자산 로드 허용)
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: commonDisallow,
            },
            // 네이버 크롤러 명시적 허용
            {
                userAgent: 'Yeti',
                allow: '/',
                disallow: commonDisallow,
            },
            // 구글 광고 검수봇 및 카카오톡·메신저 미리보기 스크래퍼는 /view/* 등 전체 허용
            {
                userAgent: [
                    'AdsBot-Google',
                    'AdsBot-Google-Mobile',
                    'Mediapartners-Google',
                    'kakaotalk-scrap',
                    'facebookexternalhit',
                    'Facebot',
                    'Twitterbot',
                ],
                allow: '/',
                disallow: ['/admin/', '/api/'],
            },
            // AI 크롤러 (ChatGPT, Perplexity, Claude 등) 허용
            {
                userAgent: [
                    'GPTBot',
                    'ChatGPT-User',
                    'PerplexityBot',
                    'Claude-Web',
                    'anthropic-ai',
                ],
                allow: '/',
                disallow: commonDisallow,
            },
        ],
        sitemap: 'https://maeumbugo.co.kr/sitemap.xml',
        host: 'https://maeumbugo.co.kr',
    }
}
