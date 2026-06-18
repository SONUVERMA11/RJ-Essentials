'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Edit, Trash2, Eye, EyeOff,
    CheckSquare, Square, ChevronDown, X, Star,
    Zap, TrendingUp, Award, Package, Tag, Layers
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
    _id: string; name: string; slug: string; category: string; brand: string;
    images: { url: string }[]; mrp: number; sellingPrice: number; stock: number;
    status: string; isFeatured: boolean; isDealOfDay: boolean;
    isNewArrival: boolean; isBestSeller: boolean; createdAt: string;
}

type BulkAction =
    | 'activate' | 'deactivate' | 'draft' | 'delete'
    | 'feature' | 'unfeature' | 'deal' | 'undeal'
    | 'bestseller' | 'unbestseller' | 'newarrival' | 'unnewarrival'
    | 'setCategory' | 'setStock';

interface ActionOption {
    key: BulkAction;
    label: string;
    icon: React.ReactNode;
    color: string;
    group: string;
    needsInput?: 'category' | 'stock';
    confirm?: string;
}

const BULK_ACTIONS: ActionOption[] = [
    { key: 'activate', label: 'Set Active', icon: <Eye size={14} />, color: 'text-green-600', group: 'Status' },
    { key: 'draft', label: 'Set Draft', icon: <EyeOff size={14} />, color: 'text-amber-600', group: 'Status' },
    { key: 'deactivate', label: 'Hide', icon: <EyeOff size={14} />, color: 'text-red-500', group: 'Status' },
    { key: 'feature', label: 'Mark Featured', icon: <Star size={14} />, color: 'text-yellow-500', group: 'Flags' },
    { key: 'unfeature', label: 'Remove Featured', icon: <Star size={14} />, color: 'text-gray-400', group: 'Flags' },
    { key: 'deal', label: 'Mark Deal of Day', icon: <Zap size={14} />, color: 'text-orange-500', group: 'Flags' },
    { key: 'undeal', label: 'Remove Deal', icon: <Zap size={14} />, color: 'text-gray-400', group: 'Flags' },
    { key: 'bestseller', label: 'Mark Best Seller', icon: <Award size={14} />, color: 'text-purple-500', group: 'Flags' },
    { key: 'unbestseller', label: 'Remove Best Seller', icon: <Award size={14} />, color: 'text-gray-400', group: 'Flags' },
    { key: 'newarrival', label: 'Mark New Arrival', icon: <TrendingUp size={14} />, color: 'text-blue-500', group: 'Flags' },
    { key: 'unnewarrival', label: 'Remove New Arrival', icon: <TrendingUp size={14} />, color: 'text-gray-400', group: 'Flags' },
    { key: 'setCategory', label: 'Change Category', icon: <Tag size={14} />, color: 'text-indigo-500', group: 'Edit', needsInput: 'category' },
    { key: 'setStock', label: 'Set Stock', icon: <Package size={14} />, color: 'text-teal-500', group: 'Edit', needsInput: 'stock' },
    { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, color: 'text-red-600', group: 'Danger', confirm: 'Are you sure you want to DELETE these products? This cannot be undone!' },
];

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Selection state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Input modal for category/stock
    const [inputModal, setInputModal] = useState<{ action: ActionOption; value: string } | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '50', status: statusFilter, page: String(page) });
            if (search) params.set('search', search);
            if (categoryFilter) params.set('category', categoryFilter);
            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            setProducts(data.products || []);
            setTotalPages(data.pagination?.pages || 1);
            setTotal(data.pagination?.total || 0);

            // Collect unique categories
            const cats = new Set<string>();
            (data.products || []).forEach((p: Product) => { if (p.category) cats.add(p.category); });
            setCategories(prev => {
                const merged = new Set([...prev, ...cats]);
                return Array.from(merged).sort();
            });
        } catch { toast.error('Failed to load products'); }
        setLoading(false);
    }, [statusFilter, page, search, categoryFilter]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Also fetch all categories once
    useEffect(() => {
        fetch('/api/categories').then(r => r.json()).then(data => {
            if (Array.isArray(data)) {
                setCategories(data.map((c: { name: string }) => c.name).sort());
            }
        }).catch(() => {});
    }, []);

    // Clear selection when filters/page change
    useEffect(() => { setSelected(new Set()); }, [statusFilter, categoryFilter, page]);

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

    // ─── Selection helpers ─────────────────────────────────────────
    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === products.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(products.map(p => p._id)));
        }
    };

    const isAllSelected = products.length > 0 && selected.size === products.length;
    const isSomeSelected = selected.size > 0 && selected.size < products.length;

    // ─── Bulk action executor ──────────────────────────────────────
    const executeBulkAction = async (action: ActionOption, extraData?: Record<string, unknown>) => {
        if (selected.size === 0) { toast.error('No products selected'); return; }
        if (action.confirm && !confirm(action.confirm)) return;

        setBulkProcessing(true);
        setBulkMenuOpen(false);
        try {
            const res = await fetch('/api/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action.key,
                    ids: Array.from(selected),
                    data: extraData,
                }),
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(`${action.label}: ${result.count ?? selected.size} products updated`);
                setSelected(new Set());
                fetchProducts();
            } else {
                toast.error(result.error || 'Bulk action failed');
            }
        } catch { toast.error('Bulk action failed'); }
        setBulkProcessing(false);
    };

    const handleActionClick = (action: ActionOption) => {
        if (action.needsInput) {
            setInputModal({ action, value: '' });
            setBulkMenuOpen(false);
        } else {
            executeBulkAction(action);
        }
    };

    // Group actions for menu
    const actionGroups = BULK_ACTIONS.reduce((acc, action) => {
        if (!acc[action.group]) acc[action.group] = [];
        acc[action.group].push(action);
        return acc;
    }, {} as Record<string, ActionOption[]>);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Products</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} total products</p>
                </div>
                <Link href="/admin/products/new" className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    <Plus size={16} /> Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl p-4 shadow-sm mb-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchProducts(); } }}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none bg-background transition-all"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background min-w-[130px]">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                </select>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background min-w-[150px]">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => { setPage(1); fetchProducts(); }}
                    className="bg-[#2874F0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    Search
                </button>
            </div>

            {/* Bulk Actions Bar */}
            {selected.size > 0 && (
                <div className="bg-[#2874F0]/5 border border-[#2874F0]/20 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#2874F0]">
                        <Layers size={16} />
                        <span>{selected.size} selected</span>
                    </div>

                    <div className="h-5 w-px bg-border" />

                    {/* Quick actions */}
                    <button onClick={() => executeBulkAction(BULK_ACTIONS[0])}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                        ✓ Activate
                    </button>
                    <button onClick={() => executeBulkAction(BULK_ACTIONS[1])}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                        Draft
                    </button>
                    <button onClick={() => executeBulkAction(BULK_ACTIONS[2])}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
                        Hide
                    </button>

                    {/* More actions dropdown */}
                    <div className="relative ml-auto">
                        <button onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                            disabled={bulkProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50">
                            {bulkProcessing ? (
                                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ChevronDown size={14} />
                            )}
                            More Actions
                        </button>

                        {bulkMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setBulkMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl w-56 py-1 max-h-[400px] overflow-y-auto">
                                    {Object.entries(actionGroups).map(([group, actions]) => (
                                        <div key={group}>
                                            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {group}
                                            </div>
                                            {actions.map(action => (
                                                <button
                                                    key={action.key}
                                                    onClick={() => handleActionClick(action)}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                                                >
                                                    <span className={action.color}>{action.icon}</span>
                                                    <span>{action.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={() => setSelected(new Set())}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors" title="Clear selection">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-3 w-10">
                                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors" title="Select all">
                                        {isAllSelected ? <CheckSquare size={18} className="text-[#2874F0]" /> :
                                            isSomeSelected ? <CheckSquare size={18} className="text-[#2874F0]/50" /> :
                                                <Square size={18} />}
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Flags</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                    <span className="inline-block w-5 h-5 border-2 border-[#2874F0] border-t-transparent rounded-full animate-spin mr-2" />
                                    Loading...
                                </td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No products found</td></tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p._id}
                                        className={`border-b border-border/30 transition-colors cursor-pointer
                                            ${selected.has(p._id) ? 'bg-[#2874F0]/5' : 'hover:bg-muted/30'}`}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('a, button')) return;
                                            toggleSelect(p._id);
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <button onClick={(e) => { e.stopPropagation(); toggleSelect(p._id); }}
                                                className="text-muted-foreground hover:text-foreground transition-colors">
                                                {selected.has(p._id) ?
                                                    <CheckSquare size={18} className="text-[#2874F0]" /> :
                                                    <Square size={18} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {p.images?.[0]?.url ? (
                                                    <img src={p.images[0].url} alt="" className="w-10 h-10 object-contain bg-muted/50 rounded-lg" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-sm">📦</div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate max-w-[200px]">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                            <span className="px-2 py-0.5 bg-muted rounded-md text-xs">{p.category}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{formatPrice(p.sellingPrice)}</p>
                                            {p.mrp > p.sellingPrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.mrp)}</p>}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={p.stock <= 0 ? 'text-red-600 font-medium' : p.stock < 10 ? 'text-amber-600' : 'text-muted-foreground'}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    p.status === 'draft' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-red-100 text-red-700'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div className="flex gap-1">
                                                {p.isFeatured && <span title="Featured" className="text-xs">⭐</span>}
                                                {p.isDealOfDay && <span title="Deal of Day" className="text-xs">⚡</span>}
                                                {p.isBestSeller && <span title="Best Seller" className="text-xs">🏆</span>}
                                                {p.isNewArrival && <span title="New Arrival" className="text-xs">🆕</span>}
                                                {!p.isFeatured && !p.isDealOfDay && !p.isBestSeller && !p.isNewArrival && (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-0.5">
                                                <Link href={`/admin/products/${p._id}`}
                                                    className="p-1.5 text-muted-foreground hover:text-[#2874F0] hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit size={15} />
                                                </Link>
                                                <button onClick={(e) => { e.stopPropagation(); toggleStatus(p._id, p.status); }}
                                                    className="p-1.5 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Toggle Visibility">
                                                    {p.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} ({total} products)
                    </p>
                    <div className="flex gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            Prev
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = page <= 3 ? i + 1 : page + i - 2;
                            if (pageNum < 1 || pageNum > totalPages) return null;
                            return (
                                <button key={pageNum} onClick={() => setPage(pageNum)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pageNum === page ? 'bg-[#2874F0] text-white' : 'border border-border hover:bg-muted'}`}>
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Input Modal for category/stock */}
            {inputModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInputModal(null)}>
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-1">{inputModal.action.label}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Apply to {selected.size} selected product{selected.size > 1 ? 's' : ''}
                        </p>

                        {inputModal.action.needsInput === 'category' ? (
                            <select
                                value={inputModal.value}
                                onChange={e => setInputModal({ ...inputModal, value: e.target.value })}
                                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background mb-4"
                            >
                                <option value="">Select category...</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ) : (
                            <input
                                type="number"
                                min="0"
                                value={inputModal.value}
                                onChange={e => setInputModal({ ...inputModal, value: e.target.value })}
                                placeholder="Enter stock quantity..."
                                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background mb-4"
                                autoFocus
                            />
                        )}

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setInputModal(null)}
                                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!inputModal.value) { toast.error('Please enter a value'); return; }
                                    const data = inputModal.action.needsInput === 'category'
                                        ? { category: inputModal.value }
                                        : { stock: inputModal.value };
                                    executeBulkAction(inputModal.action, data);
                                    setInputModal(null);
                                }}
                                className="px-4 py-2 text-sm bg-[#2874F0] text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                            >
                                Apply to {selected.size} products
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
