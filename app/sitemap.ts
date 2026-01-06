import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://maeumbugo.co.kr'

    // 정적 페이지들
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/create`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    // 동적 부고 페이지들 (DB에서 가져오기)
    let bugoPagges: MetadataRoute.Sitemap = []

    try {
        const { data: bugos, error } = await supabase
            .from('bugo')
            .select('bugo_number, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(1000) // 최대 1000개

        if (!error && bugos) {
            bugoPagges = bugos.map((bugo) => ({
                url: `${baseUrl}/view/${bugo.bugo_number}`,
                lastModified: new Date(bugo.updated_at || bugo.created_at),
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            }))
        }
    } catch (e) {
        console.error('Failed to fetch bugos for sitemap:', e)
    }

    return [...staticPages, ...bugoPagges]
}
