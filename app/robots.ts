import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/mobile-bugo',
                    '/guide/',
                    '/view/',
                    '/create',
                    '/faq',
                    '/search',
                ],
                disallow: [
                    '/admin/',
                    '/api/',
                    '/_next/',
                    '/static/',
                ],
            },
            // 네이버 크롤러 명시적 허용
            {
                userAgent: 'Yeti',
                allow: '/',
                disallow: ['/admin/', '/api/'],
            },
            // AI 크롤러 (ChatGPT, Perplexity, Claude 등) 허용
            {
                userAgent: 'GPTBot',
                allow: '/',
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
            },
            {
                userAgent: 'PerplexityBot',
                allow: '/',
            },
            {
                userAgent: 'Claude-Web',
                allow: '/',
            },
            {
                userAgent: 'anthropic-ai',
                allow: '/',
            },
        ],
        sitemap: 'https://maeumbugo.co.kr/sitemap.xml',
        host: 'https://maeumbugo.co.kr',
    }
}
