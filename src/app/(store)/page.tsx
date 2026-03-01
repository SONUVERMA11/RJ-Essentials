import HeroCarousel from '@/components/store/HeroCarousel';
import CategoryRow from '@/components/store/CategoryRow';
import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { ChevronRight, Zap, TrendingUp, Clock, Star } from 'lucide-react';

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

async function getProducts() {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/products?limit=20&status=active`, {
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        return data.products?.length > 0 ? data.products : DEMO_PRODUCTS;
    } catch {
        return DEMO_PRODUCTS;
    }
}

function SectionHeader({ title, icon: Icon, link, color = '#2874F0' }: { title: string; icon: React.ElementType; link?: string; color?: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Icon size={22} style={{ color }} />
                <h2 className="text-lg md:text-xl font-bold text-gray-800">{title}</h2>
            </div>
            {link && (
                <Link
                    href={link}
                    className="flex items-center gap-1 text-[#2874F0] text-sm font-medium hover:underline"
                >
                    View All <ChevronRight size={16} />
                </Link>
            )}
        </div>
    );
}

export default async function HomePage() {
    const products = await getProducts();

    const featured = products.filter((p: { isFeatured?: boolean }) => p.isFeatured).slice(0, 8);
    const deals = products.filter((p: { isDealOfDay?: boolean }) => p.isDealOfDay).slice(0, 8);
    const newArrivals = products.filter((p: { isNewArrival?: boolean }) => p.isNewArrival).slice(0, 8);
    const bestSellers = [...products].sort((a: { soldCount?: number }, b: { soldCount?: number }) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8);

    // If filters don't produce results, slice from all products
    const displayFeatured = featured.length > 0 ? featured : products.slice(0, 4);
    const displayDeals = deals.length > 0 ? deals : products.slice(4, 8);
    const displayNew = newArrivals.length > 0 ? newArrivals : products.slice(8, 12);
    const displayBest = bestSellers.length > 0 ? bestSellers : products.slice(0, 4);

    return (
        <div>
            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Category Row */}
            <CategoryRow />

            {/* Deal of the Day */}
            <section className="max-w-7xl mx-auto px-4 mt-4">
                <div className="bg-white rounded-sm p-4 shadow-sm">
                    <SectionHeader title="Deal of the Day" icon={Zap} link="/search?q=deals" color="#FB641B" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
                        {displayDeals.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Mid Banner */}
            <section className="max-w-7xl mx-auto px-4 mt-4">
                <div className="bg-gradient-to-r from-[#2874F0] to-[#6C63FF] rounded-sm p-6 md:p-10 text-white text-center shadow-sm">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">💰 Cash on Delivery Available</h3>
                    <p className="text-blue-100 text-sm md:text-base">Pay when your order arrives at your doorstep. No prepayment needed!</p>
                </div>
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 mt-4">
                <div className="bg-white rounded-sm p-4 shadow-sm">
                    <SectionHeader title="Featured Products" icon={Star} link="/search?q=featured" color="#FFB300" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {displayFeatured.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Best Sellers */}
            <section className="max-w-7xl mx-auto px-4 mt-4">
                <div className="bg-white rounded-sm p-4 shadow-sm">
                    <SectionHeader title="Best Sellers" icon={TrendingUp} link="/search?q=best" color="#388E3C" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
                        {displayBest.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* New Arrivals */}
            <section className="max-w-7xl mx-auto px-4 mt-4 mb-6">
                <div className="bg-white rounded-sm p-4 shadow-sm">
                    <SectionHeader title="New Arrivals" icon={Clock} link="/search?q=new" color="#9C27B0" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
                        {displayNew.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
