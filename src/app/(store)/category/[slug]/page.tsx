import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ sort?: string; minPrice?: string; maxPrice?: string; page?: string }>;
}

const DEMO_PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
    _id: `cat-demo-${i}`,
    name: `Product ${i + 1} — Quality Item`,
    slug: `product-${i + 1}`,
    images: [{ url: '' }],
    mrp: 999 + i * 200,
    sellingPrice: 499 + i * 100,
    ratings: { average: 3.8 + (i % 5) * 0.2, count: 50 + i * 30 },
    stock: 20,
}));

async function getProducts(category: string, searchParams: { sort?: string; minPrice?: string; maxPrice?: string; page?: string }) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const params = new URLSearchParams({
            category: category === 'all' ? '' : category.replace(/-/g, ' '),
            status: 'active',
            limit: '20',
            page: searchParams.page || '1',
            ...(searchParams.sort && { sort: searchParams.sort }),
            ...(searchParams.minPrice && { minPrice: searchParams.minPrice }),
            ...(searchParams.maxPrice && { maxPrice: searchParams.maxPrice }),
        });
        const res = await fetch(`${baseUrl}/api/products?${params}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        return data.products?.length > 0 ? data : { products: DEMO_PRODUCTS, pagination: { page: 1, pages: 1, total: 8 } };
    } catch {
        return { products: DEMO_PRODUCTS, pagination: { page: 1, pages: 1, total: 8 } };
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return {
        title: `${categoryName} — RJ ESSENTIALS`,
        description: `Shop ${categoryName} at RJ ESSENTIALS. Best prices, Cash on Delivery available.`,
    };
}

export default async function CategoryPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const sp = await searchParams;
    const categoryName = slug === 'all' ? 'All Products' : slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const data = await getProducts(slug, sp);

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-[#2874F0]">Home</Link>
                <ChevronRight size={14} />
                <span className="text-gray-800 font-medium">{categoryName}</span>
            </div>

            <div className="flex gap-4">
                {/* Sidebar Filters - Desktop */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="bg-white rounded-sm p-4 shadow-sm sticky top-20">
                        <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                            <SlidersHorizontal size={16} /> Filters
                        </h3>

                        {/* Sort */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sort By</p>
                            <div className="space-y-1.5">
                                {[
                                    { value: 'newest', label: 'Newest First' },
                                    { value: 'popularity', label: 'Popularity' },
                                    { value: 'price-low', label: 'Price: Low to High' },
                                    { value: 'price-high', label: 'Price: High to Low' },
                                    { value: 'rating', label: 'Customer Rating' },
                                ].map((opt) => (
                                    <Link
                                        key={opt.value}
                                        href={`/category/${slug}?sort=${opt.value}`}
                                        className={`block text-sm py-1 px-2 rounded ${sp.sort === opt.value ? 'bg-blue-50 text-[#2874F0] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {opt.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Price Range</p>
                            <div className="space-y-1.5">
                                {[
                                    { min: '0', max: '499', label: 'Under ₹500' },
                                    { min: '500', max: '999', label: '₹500 — ₹999' },
                                    { min: '1000', max: '1999', label: '₹1,000 — ₹1,999' },
                                    { min: '2000', max: '4999', label: '₹2,000 — ₹4,999' },
                                    { min: '5000', max: '', label: '₹5,000+' },
                                ].map((range) => (
                                    <Link
                                        key={range.label}
                                        href={`/category/${slug}?minPrice=${range.min}${range.max ? `&maxPrice=${range.max}` : ''}${sp.sort ? `&sort=${sp.sort}` : ''}`}
                                        className="block text-sm py-1 px-2 rounded text-gray-600 hover:bg-gray-50"
                                    >
                                        {range.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    <div className="bg-white rounded-sm p-4 shadow-sm mb-4 flex items-center justify-between">
                        <h1 className="text-base font-bold text-gray-800">{categoryName}</h1>
                        <span className="text-sm text-gray-500">{data.pagination?.total || data.products.length} results</span>
                    </div>

                    {/* Mobile Sort */}
                    <div className="lg:hidden bg-white rounded-sm p-3 shadow-sm mb-3 overflow-x-auto">
                        <div className="flex gap-2">
                            {['newest', 'popularity', 'price-low', 'price-high'].map((s) => (
                                <Link
                                    key={s}
                                    href={`/category/${slug}?sort=${s}`}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${sp.sort === s ? 'border-[#2874F0] text-[#2874F0] bg-blue-50' : 'border-gray-200 text-gray-600'}`}
                                >
                                    {s.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {data.products.map((product: typeof DEMO_PRODUCTS[0]) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>

                    {data.products.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-sm shadow-sm">
                            <p className="text-4xl mb-2">🔍</p>
                            <p className="text-gray-500">No products found in this category</p>
                            <Link href="/" className="text-[#2874F0] font-medium mt-2 inline-block hover:underline">Browse All Products</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
