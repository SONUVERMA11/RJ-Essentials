import HeroCarousel from '@/components/store/HeroCarousel';
import CategoryRow from '@/components/store/CategoryRow';
import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { ChevronRight, Zap, TrendingUp, Star, Sparkles } from 'lucide-react';

// Demo products for when database is not connected
const DEMO_PRODUCTS = Array.from({ length: 12 }, (_, i) => ({
    _id: `demo-${i}`,
    name: [
        'Wireless Bluetooth Earbuds',
        'Men\'s Casual Cotton T-Shirt',
        'Smart Watch Fitness Tracker',
        'Women\'s Running Shoes',
        'LED Desk Lamp USB Rechargeable',
        'Premium Leather Wallet',
        'Yoga Mat Non-Slip Exercise',
        'Stainless Steel Water Bottle',
        'Phone Stand Adjustable Holder',
        'Cotton Face Towel Set',
        'USB-C Fast Charging Cable',
        'Mini Portable Speaker',
    ][i],
    slug: `product-${i + 1}`,
    images: [{ url: '' }],
    mrp: [1999, 899, 3999, 2499, 1299, 1499, 999, 749, 599, 399, 499, 1799][i],
    sellingPrice: [999, 399, 1999, 1249, 649, 599, 499, 349, 299, 199, 199, 899][i],
    ratings: { average: [4.2, 4.0, 4.5, 3.8, 4.1, 4.3, 4.0, 3.9, 4.4, 3.7, 4.2, 4.6][i], count: [234, 567, 129, 345, 89, 201, 156, 432, 78, 612, 389, 95][i] },
    stock: 50,
    isFeatured: i < 4,
    isDealOfDay: i >= 4 && i < 8,
    isNewArrival: i >= 8,
    category: ['Electronics', 'Fashion', 'Electronics', 'Fashion', 'Home & Kitchen', 'Fashion', 'Sports', 'Home & Kitchen', 'Electronics', 'Home & Kitchen', 'Electronics', 'Electronics'][i],
}));

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    link?: string;
    accentColor: string;
}

function SectionHeader({ title, subtitle, link, accentColor }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">{title}</h2>
                {subtitle && <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>}
            </div>
            {link && (
                <Link
                    href={link}
                    className="flex items-center gap-0.5 text-xs md:text-sm font-semibold transition-colors hover:opacity-80 text-white/90"
                >
                    View All <ChevronRight size={14} strokeWidth={2.5} />
                </Link>
            )}
        </div>
    );
}

async function getProducts() {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/products?limit=100&status=active`, {
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        return data.products?.length > 0 ? data.products : DEMO_PRODUCTS;
    } catch {
        return DEMO_PRODUCTS;
    }
}

export default async function HomePage() {
    const products = await getProducts();

    const featured = products.filter((p: { isFeatured?: boolean }) => p.isFeatured).slice(0, 8);
    const deals = products.filter((p: { isDealOfDay?: boolean }) => p.isDealOfDay).slice(0, 8);
    const newArrivals = products.filter((p: { isNewArrival?: boolean }) => p.isNewArrival).slice(0, 8);
    const bestSellers = products.filter((p: { isBestSeller?: boolean }) => p.isBestSeller).slice(0, 8);

    const displayFeatured = featured.length > 0 ? featured : products.slice(0, 4);
    const displayDeals = deals.length > 0 ? deals : products.slice(4, 8);
    const displayNew = newArrivals.length > 0 ? newArrivals : products.slice(8, 12);
    const displayBest = bestSellers.length > 0 ? bestSellers : products.slice(0, 4);

    return (
        <div className="space-y-4 md:space-y-5 pb-8">
            {/* Hero Banner Slider */}
            <HeroCarousel />

            {/* Category Grid */}
            <CategoryRow />

            {/* ═══ Deal of the Day ═══ */}
            <section className="max-w-[1280px] mx-auto px-4">
                <div className="section-card section-card-deals">
                    <SectionHeader
                        title="Deal of the Day"
                        subtitle="Limited-time offers you don't want to miss"
                        link="/category/all?sort=popularity"
                        accentColor="#2563EB"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {displayDeals.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Featured Products ═══ */}
            <section className="max-w-[1280px] mx-auto px-4">
                <div className="section-card section-card-featured">
                    <SectionHeader
                        title="Featured Products"
                        subtitle="Curated picks our customers love"
                        link="/category/all"
                        accentColor="#D97706"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {displayFeatured.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Best Sellers ═══ */}
            <section className="max-w-[1280px] mx-auto px-4">
                <div className="section-card section-card-bestsellers">
                    <SectionHeader
                        title="Best Sellers"
                        subtitle="Top rated by thousands of customers"
                        link="/category/all?sort=popularity"
                        accentColor="#16A34A"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {displayBest.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ New Arrivals ═══ */}
            <section className="max-w-[1280px] mx-auto px-4">
                <div className="section-card section-card-new">
                    <SectionHeader
                        title="New Arrivals"
                        subtitle="Fresh drops just added to the collection"
                        link="/category/all?sort=newest"
                        accentColor="#9333EA"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {displayNew.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
