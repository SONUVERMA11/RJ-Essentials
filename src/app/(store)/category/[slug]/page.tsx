import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ sort?: string; minPrice?: string; maxPrice?: string; page?: string }>;
}

async function getProducts(category: string, searchParams: { sort?: string; minPrice?: string; maxPrice?: string; page?: string }) {
    try {
        await dbConnect();

        const page = parseInt(searchParams.page || '1');
        const limit = 20;
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { status: 'active' };

        if (category !== 'all') {
            const categoryName = category.replace(/-/g, ' ');
            filter.category = new RegExp(`^${categoryName}$`, 'i');
        }

        if (searchParams.minPrice || searchParams.maxPrice) {
            filter.sellingPrice = {};
            if (searchParams.minPrice) filter.sellingPrice.$gte = parseInt(searchParams.minPrice);
            if (searchParams.maxPrice) filter.sellingPrice.$lte = parseInt(searchParams.maxPrice);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sortObj: any = { createdAt: -1 };
        switch (searchParams.sort) {
            case 'price-low': sortObj = { sellingPrice: 1 }; break;
            case 'price-high': sortObj = { sellingPrice: -1 }; break;
            case 'popularity': sortObj = { soldCount: -1 }; break;
            case 'rating': sortObj = { 'ratings.average': -1 }; break;
            default: sortObj = { createdAt: -1 };
        }

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Product.countDocuments(filter),
        ]);

        return {
            products: JSON.parse(JSON.stringify(products)),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    } catch (error) {
        console.error('Category page error:', error);
        return { products: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
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
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Link href="/" className="hover:text-[#2874F0]">Home</Link>
                <ChevronRight size={14} />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{categoryName}</span>
            </div>

            <div className="flex gap-4">
                {/* Sidebar Filters - Desktop */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm sticky top-20 border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <SlidersHorizontal size={16} /> Filters
                        </h3>

                        {/* Sort */}
                        <div className="mb-5">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wide">Sort By</p>
                            <div className="space-y-0.5">
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
                                        className={`block text-sm py-2 px-3 rounded-lg transition-colors ${sp.sort === opt.value
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-[#2874F0] font-semibold border-l-3 border-[#2874F0]'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {opt.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 dark:border-gray-700 my-3"></div>

                        {/* Price Range */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wide">Price Range</p>
                            <div className="space-y-0.5">
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
                                        className="block text-sm py-2 px-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{categoryName}</h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{data.pagination?.total || data.products.length} results</span>
                    </div>

                    {/* Mobile Sort */}
                    <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm mb-3 overflow-x-auto border border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2">
                            {['newest', 'popularity', 'price-low', 'price-high'].map((s) => (
                                <Link
                                    key={s}
                                    href={`/category/${slug}?sort=${s}`}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${sp.sort === s
                                        ? 'border-[#2874F0] text-[#2874F0] bg-blue-50 dark:bg-blue-900/30'
                                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    {s.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {data.products.map((product: { _id: string; name: string; slug: string; images: { url: string }[]; mrp: number; sellingPrice: number; ratings: { average: number; count: number }; stock: number }) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>

                    {data.products.length === 0 && (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-5xl mb-3">🔍</p>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No products found</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try browsing a different category</p>
                            <Link href="/" className="inline-block bg-[#2874F0] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors">Browse All Products</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
