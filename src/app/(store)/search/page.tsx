import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { Metadata } from 'next';

interface Props {
    searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const sp = await searchParams;
    return {
        title: sp.q ? `Search: ${sp.q} — RJ ESSENTIALS` : 'Search — RJ ESSENTIALS',
    };
}

async function searchProducts(q: string, sort?: string) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const params = new URLSearchParams({ search: q, status: 'active', limit: '40' });
        if (sort) params.set('sort', sort);
        const res = await fetch(`${baseUrl}/api/products?${params}`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.products || [];
    } catch {
        return [];
    }
}

export default async function SearchPage({ searchParams }: Props) {
    const sp = await searchParams;
    const query = sp.q || '';
    const products = query ? await searchProducts(query, sp.sort) : [];

    const sortOptions = [
        { value: 'newest', label: 'Newest' },
        { value: 'popularity', label: 'Popular' },
        { value: 'price-low', label: 'Price: Low' },
        { value: 'price-high', label: 'Price: High' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <Link href="/" className="hover:text-[#2874F0] transition-colors">Home</Link>
                <ChevronRight size={12} />
                <span className="text-foreground font-medium">Search</span>
                {query && (
                    <>
                        <ChevronRight size={12} />
                        <span className="text-foreground font-medium truncate max-w-[200px]">&quot;{query}&quot;</span>
                    </>
                )}
            </div>

            {/* Header */}
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
                <h1 className="text-base md:text-lg font-bold text-foreground">
                    {query ? (
                        <>Search results for &quot;<span className="text-[#2874F0]">{query}</span>&quot; — <span className="text-muted-foreground font-normal">{products.length} results</span></>
                    ) : (
                        'Search Products'
                    )}
                </h1>
            </div>

            {/* Sort pills when we have results */}
            {products.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                    {sortOptions.map((opt) => (
                        <Link
                            key={opt.value}
                            href={`/search?q=${encodeURIComponent(query)}&sort=${opt.value}`}
                            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${sp.sort === opt.value
                                ? 'border-[#2874F0] text-[#2874F0] bg-[#2874F0]/10'
                                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                                }`}
                        >
                            {opt.label}
                        </Link>
                    ))}
                </div>
            )}

            {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {products.map((product: { _id: string; name: string; slug: string; images: { url: string }[]; mrp: number; sellingPrice: number; ratings: { average: number; count: number }; stock: number }) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            ) : query ? (
                <div className="text-center py-20 bg-card rounded-xl border border-border">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search size={28} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No results found</h3>
                    <p className="text-sm text-muted-foreground mb-6">Try different keywords or browse categories</p>
                    <Link href="/" className="inline-block bg-[#2874F0] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Go to Homepage
                    </Link>
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-border">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search size={28} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Search for products</h3>
                    <p className="text-sm text-muted-foreground mb-6">Use the search bar above to find products, brands, and more</p>
                    <Link href="/category/all" className="inline-block bg-[#2874F0] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Browse All Products
                    </Link>
                </div>
            )}
        </div>
    );
}
