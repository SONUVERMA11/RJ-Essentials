import ProductDetailClient from '@/components/store/ProductDetail';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

const DEMO_PRODUCT = {
    _id: 'demo-1',
    name: 'Premium Wireless Bluetooth Earbuds with Noise Cancellation',
    slug: 'demo-product',
    category: 'Electronics',
    brand: 'RJ Audio',
    description: '<p>Experience crystal-clear sound with our premium wireless earbuds. Features active noise cancellation, 30-hour battery life, and IPX5 water resistance.</p><p>Perfect for workouts, commuting, and everyday use.</p>',
    highlights: ['Active Noise Cancellation', '30-hour battery life', 'IPX5 water resistant', 'Bluetooth 5.3', 'Touch controls', 'Quick charge — 10min = 2hrs'],
    specifications: [
        { key: 'Driver Size', value: '13mm' }, { key: 'Bluetooth', value: '5.3' },
        { key: 'Battery', value: '30 hours total' }, { key: 'Charging', value: 'USB-C' },
        { key: 'Water Resistance', value: 'IPX5' }, { key: 'Weight', value: '5g per earbud' },
    ],
    images: [{ url: '' }],
    mrp: 2999,
    sellingPrice: 1299,
    stock: 50,
    variants: [{ type: 'Color', options: ['Black', 'White', 'Blue'] }],
    ratings: { average: 4.3, count: 234 },
    returnDays: 7,
    soldCount: 156,
    tags: ['earbuds', 'wireless', 'bluetooth'],
    metaTitle: '',
    metaDescription: '',
};

async function getProduct(slug: string) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/products/${slug}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Not found');
        return await res.json();
    } catch {
        return DEMO_PRODUCT;
    }
}

async function getRelatedProducts(category: string, currentId: string) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/products?category=${category}&limit=6&status=active`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.products || []).filter((p: { _id: string }) => p._id !== currentId);
    } catch {
        return [];
    }
}

async function getReviews(productId: string) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/reviews?productId=${productId}&approved=true`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.reviews || [];
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);
    return {
        title: product.metaTitle || `${product.name} | RJ ESSENTIALS`,
        description: product.metaDescription || `Buy ${product.name} at ₹${product.sellingPrice}. Cash on Delivery available. Free shipping.`,
        openGraph: {
            title: product.name,
            description: `₹${product.sellingPrice} — ${product.name}`,
            images: product.images?.[0]?.url ? [product.images[0].url] : [],
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    const product = await getProduct(slug);
    const [relatedProducts, reviews] = await Promise.all([
        getRelatedProducts(product.category, product._id),
        getReviews(product._id),
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.name,
                        image: product.images?.map((i: { url: string }) => i.url),
                        description: product.description?.replace(/<[^>]*>/g, ''),
                        brand: { '@type': 'Brand', name: product.brand || 'RJ ESSENTIALS' },
                        offers: {
                            '@type': 'Offer', price: product.sellingPrice, priceCurrency: 'INR',
                            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                        },
                        aggregateRating: product.ratings.count > 0 ? {
                            '@type': 'AggregateRating', ratingValue: product.ratings.average, reviewCount: product.ratings.count,
                        } : undefined,
                    }),
                }}
            />
            <ProductDetailClient product={product} relatedProducts={relatedProducts} reviews={reviews} />
        </>
    );
}
