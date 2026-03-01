import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';
import { Search } from 'lucide-react';
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

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-white rounded-sm p-4 shadow-sm mb-4">
                <h1 className="text-base font-bold text-gray-800">
                    {query ? (
                        <>Search results for &quot;<span className="text-[#2874F0]">{query}</span>&quot; — {products.length} results</>
                    ) : (
                        'Search Products'
                    )}
                </h1>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {products.map((product: { _id: string; name: string; slug: string; images: { url: string }[]; mrp: number; sellingPrice: number; ratings: { average: number; count: number }; stock: number }) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            ) : query ? (
                <div className="text-center py-16 bg-white rounded-sm shadow-sm">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">Try different keywords or browse categories</p>
                    <Link href="/" className="text-[#2874F0] font-medium hover:underline">Go to Homepage</Link>
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-sm shadow-sm">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Enter a search term to find products</p>
                </div>
            )}
        </div>
    );
}
