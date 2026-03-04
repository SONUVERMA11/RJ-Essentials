import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://rjessentials.app';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api', '/checkout', '/order-success', '/account'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
