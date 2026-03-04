'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
    _id: string; name: string; slug: string; category: string; brand: string;
    images: { url: string }[]; mrp: number; sellingPrice: number; stock: number;
    status: string; isFeatured: boolean; createdAt: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100', status: statusFilter });
            if (search) params.set('search', search);
            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch { toast.error('Failed to load products'); }
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, [statusFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            toast.success('Product deleted');
            fetchProducts();
        } catch { toast.error('Failed to delete'); }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
        try {
            await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            toast.success(`Product ${newStatus}`);
            fetchProducts();
        } catch { toast.error('Failed'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">Products</h1>
                <Link href="/admin/products/new" className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                    <Plus size={16} /> Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg p-4 shadow-sm mb-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm focus:border-[#2874F0] outline-none"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 text-sm bg-card">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                </select>
                <button onClick={fetchProducts} className="bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted">Apply</button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products found</td></tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p._id} className="border-b border-gray-50 hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {p.images?.[0]?.url ? (
                                                    <img src={p.images[0].url} alt="" className="w-10 h-10 object-contain bg-muted/50 rounded" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-sm">📦</div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate max-w-[200px]">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{formatPrice(p.sellingPrice)}</p>
                                            <p className="text-xs text-muted-foreground line-through">{formatPrice(p.mrp)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={p.stock <= 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>{p.stock}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    p.status === 'draft' ? 'bg-muted text-muted-foreground' :
                                                        'bg-red-100 text-red-700'
                                                }`}>{p.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link href={`/admin/products/${p._id}`} className="p-1.5 text-muted-foreground hover:text-[#2874F0] hover:bg-blue-50 rounded" title="Edit">
                                                    <Edit size={15} />
                                                </Link>
                                                <button onClick={() => toggleStatus(p._id, p.status)} className="p-1.5 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded" title="Toggle Visibility">
                                                    {p.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                                <button onClick={() => handleDelete(p._id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{products.length} products</p>
        </div>
    );
}
