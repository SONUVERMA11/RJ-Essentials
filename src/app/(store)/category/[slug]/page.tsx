import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal, Package } from 'lucide-react';
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

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'popularity', label: 'Popularity' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Customer Rating' },
    ];

    const priceRanges = [
        { min: '0', max: '499', label: 'Under ₹500' },
        { min: '500', max: '999', label: '₹500 — ₹999' },
        { min: '1000', max: '1999', label: '₹1,000 — ₹1,999' },
        { min: '2000', max: '4999', label: '₹2,000 — ₹4,999' },
        { min: '5000', max: '', label: '₹5,000+' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-[#2874F0] transition-colors">Home</Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">{categoryName}</span>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Filters - Desktop */}
                <aside className="hidden lg:block w-60 flex-shrink-0">
                    <div className="sticky top-24 space-y-6">
                        {/* Filters Header */}
                        <div className="flex items-center gap-2 text-foreground">
                            <SlidersHorizontal size={18} />
                            <h3 className="font-bold text-sm">Filters</h3>
                        </div>

                        {/* Sort */}
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-wider">Sort By</p>
                            <div className="space-y-0.5">
                                {sortOptions.map((opt) => (
                                    <Link
                                        key={opt.value}
                                        href={`/category/${slug}?sort=${opt.value}`}
                                        className={`block text-sm py-2 px-3 rounded-lg transition-colors ${sp.sort === opt.value
                                            ? 'bg-[#2874F0]/10 text-[#2874F0] font-semibold border-l-2 border-[#2874F0]'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        {opt.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* Price Range */}
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-wider">Price Range</p>
                            <div className="space-y-0.5">
                                {priceRanges.map((range) => (
                                    <Link
                                        key={range.label}
                                        href={`/category/${slug}?minPrice=${range.min}${range.max ? `&maxPrice=${range.max}` : ''}${sp.sort ? `&sort=${sp.sort}` : ''}`}
                                        className="block text-sm py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                    >
                                        {range.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Products Area */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground">{categoryName}</h1>
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
                            {data.pagination?.total || data.products.length} results
                        </span>
                    </div>

                    {/* Mobile Sort */}
                    <div className="lg:hidden mb-4 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 pb-1">
                            {sortOptions.slice(0, 4).map((opt) => (
                                <Link
                                    key={opt.value}
                                    href={`/category/${slug}?sort=${opt.value}`}
                                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${sp.sort === opt.value
                                        ? 'border-[#2874F0] text-[#2874F0] bg-[#2874F0]/10'
                                        : 'border-border text-muted-foreground hover:border-foreground/30'
                                        }`}
                                >
                                    {opt.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {data.products.map((product: { _id: string; name: string; slug: string; images: { url: string }[]; mrp: number; sellingPrice: number; ratings: { average: number; count: number }; stock: number }) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {data.products.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <Package size={28} className="text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold text-foreground mb-1">No products found</p>
                            <p className="text-sm text-muted-foreground mb-6">Try browsing a different category or adjusting filters</p>
                            <Link href="/" className="inline-block bg-[#2874F0] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                                Browse All Products
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {data.pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/category/${slug}?page=${p}${sp.sort ? `&sort=${sp.sort}` : ''}${sp.minPrice ? `&minPrice=${sp.minPrice}` : ''}${sp.maxPrice ? `&maxPrice=${sp.maxPrice}` : ''}`}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${data.pagination.page === p
                                        ? 'bg-[#2874F0] text-white'
                                        : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
