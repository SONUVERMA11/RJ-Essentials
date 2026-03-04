import type { MetadataRoute } from 'next';

// Dynamic sitemap generation from database
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://rjessentials.app';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${baseUrl}/return-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${baseUrl}/track-order`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ];

    // Category pages
    const categories = [
        'electronics', 'fashion', 'home-kitchen', 'beauty',
        'toys-baby', 'sports', 'books', 'grocery',
        'auto-accessories', 'appliances', 'furniture',
        'art-craft', 'gaming', 'tools',
    ];

    const categoryPages: MetadataRoute.Sitemap = categories.map((slug) => ({
        url: `${baseUrl}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    // Fetch product slugs dynamically
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${baseUrl}/api/products?limit=100&status=active`, {
            cache: 'no-store',
        });
        if (res.ok) {
            const data = await res.json();
            productPages = (data.products || []).map((p: { slug: string; updatedAt?: string }) => ({
                url: `${baseUrl}/product/${p.slug}`,
                lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
        }
    } catch {
        // Sitemap generation should not fail if API is down
    }

    return [...staticPages, ...categoryPages, ...productPages];
}
