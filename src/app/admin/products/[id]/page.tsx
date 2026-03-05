'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, Upload, Film, ImageIcon, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Toys', 'Sports', 'Books', 'Grocery'];

export default function ProductFormPage() {
    const router = useRouter();
    const params = useParams();
    const isEdit = params.id !== 'new';
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '', slug: '', category: 'Electronics', brand: '', description: '',
        highlights: [''], specifications: [{ key: '', value: '' }],
        images: [] as { url: string; publicId: string }[],
        mrp: '', sellingPrice: '', stock: '0',
        variants: [] as { type: string; options: string[] }[],
        tags: '',
        meeshoLink: '', meeshoNotes: '', returnDays: '7',
        status: 'active' as string, isFeatured: false, isDealOfDay: false,
        isNewArrival: false, isBestSeller: false,
        metaTitle: '', metaDescription: '',
        mediaLinks: [] as { type: string; url: string; caption: string }[],
    });

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            fetch(`/api/products/${params.id}`)
                .then(r => r.json())
                .then(data => {
                    setForm({
                        name: data.name || '', slug: data.slug || '', category: data.category || '',
                        brand: data.brand || '', description: data.description || '',
                        highlights: data.highlights?.length ? data.highlights : [''],
                        specifications: data.specifications?.length ? data.specifications : [{ key: '', value: '' }],
                        images: data.images || [], mrp: String(data.mrp || ''), sellingPrice: String(data.sellingPrice || ''),
                        stock: String(data.stock || 0), variants: data.variants || [],
                        tags: (data.tags || []).join(', '), meeshoLink: data.meeshoLink || '',
                        meeshoNotes: data.meeshoNotes || '', returnDays: String(data.returnDays || 7),
                        status: data.status || 'active', isFeatured: data.isFeatured || false,
                        isDealOfDay: data.isDealOfDay || false, isNewArrival: data.isNewArrival || false,
                        isBestSeller: data.isBestSeller || false, metaTitle: data.metaTitle || '',
                        metaDescription: data.metaDescription || '',
                        mediaLinks: data.mediaLinks || [],
                    });
                    setLoading(false);
                })
                .catch(() => { toast.error('Failed to load product'); setLoading(false); });
        }
    }, [isEdit, params.id]);

    const handleNameChange = (name: string) => {
        setForm(f => ({ ...f, name, slug: isEdit ? f.slug : generateSlug(name) }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', 'rj-essentials/products');
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.url) {
                    setForm(f => ({ ...f, images: [...f.images, { url: data.url, publicId: data.publicId }] }));
                    toast.success('Image uploaded');
                }
            } catch { toast.error('Upload failed'); }
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.sellingPrice) {
            toast.error('Name and selling price are required');
            return;
        }
        setSaving(true);
        const body = {
            ...form,
            mrp: Number(form.mrp) || Number(form.sellingPrice),
            sellingPrice: Number(form.sellingPrice),
            stock: Number(form.stock),
            returnDays: Number(form.returnDays),
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            highlights: form.highlights.filter(h => h.trim()),
            specifications: form.specifications.filter(s => s.key.trim()),
            mediaLinks: form.mediaLinks.filter(m => m.url.trim()),
        };

        try {
            const url = isEdit ? `/api/products/${params.id}` : '/api/products';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) {
                toast.success(isEdit ? 'Product updated!' : 'Product created!');
                router.push('/admin/products');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save');
            }
        } catch { toast.error('Something went wrong'); }
        setSaving(false);
    };

    if (loading) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading product...</div>;

    return (
        <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/admin/products" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                            <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100">
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100">
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (HTML supported)</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={5} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none resize-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Pricing & Stock</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MRP (₹)</label>
                            <input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (₹) *</label>
                            <input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                    </div>
                    {form.mrp && form.sellingPrice && Number(form.mrp) > Number(form.sellingPrice) && (
                        <p className="text-sm text-[#388E3C] font-medium">
                            Discount: {Math.round(((Number(form.mrp) - Number(form.sellingPrice)) / Number(form.mrp)) * 100)}% off
                        </p>
                    )}
                </div>

                {/* Images */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Images</h2>
                    <div className="flex gap-3 flex-wrap">
                        {form.images.map((img, i) => (
                            <div key={i} className="relative w-24 h-24 border dark:border-gray-600 rounded overflow-hidden group">
                                <img src={img.url} alt="" className="w-full h-full object-contain" />
                                <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#2874F0] text-gray-400 dark:text-gray-500 hover:text-[#2874F0]">
                            <Upload size={20} />
                            <span className="text-[10px] mt-1">Upload</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Media & Video Links */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Film size={18} className="text-[#2874F0]" /> Media & Video Links</h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add YouTube videos, image URLs, or any media links to showcase in the product description.</p>
                    {form.mediaLinks.map((m, i) => (
                        <div key={i} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <select value={m.type} onChange={(e) => {
                                        const updated = [...form.mediaLinks]; updated[i] = { ...updated[i], type: e.target.value };
                                        setForm({ ...form, mediaLinks: updated });
                                    }} className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100 w-28">
                                        <option value="video">🎬 Video</option>
                                        <option value="image">🖼️ Image</option>
                                    </select>
                                    <input value={m.url} onChange={(e) => {
                                        const updated = [...form.mediaLinks]; updated[i] = { ...updated[i], url: e.target.value };
                                        setForm({ ...form, mediaLinks: updated });
                                    }} placeholder={m.type === 'video' ? 'YouTube or video URL' : 'Image URL'}
                                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                                </div>
                                <input value={m.caption} onChange={(e) => {
                                    const updated = [...form.mediaLinks]; updated[i] = { ...updated[i], caption: e.target.value };
                                    setForm({ ...form, mediaLinks: updated });
                                }} placeholder="Caption (optional)"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                            </div>
                            <button onClick={() => setForm(f => ({ ...f, mediaLinks: f.mediaLinks.filter((_, j) => j !== i) }))}
                                className="text-gray-400 hover:text-red-500 mt-2"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button onClick={() => setForm(f => ({ ...f, mediaLinks: [...f.mediaLinks, { type: 'video', url: '', caption: '' }] }))}
                        className="flex items-center gap-1 text-[#2874F0] text-sm font-medium"><Plus size={14} /> Add Media Link</button>
                </div>

                {/* Highlights */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Highlights</h2>
                    {form.highlights.map((h, i) => (
                        <div key={i} className="flex gap-2">
                            <input value={h} onChange={(e) => {
                                const updated = [...form.highlights]; updated[i] = e.target.value;
                                setForm({ ...form, highlights: updated });
                            }} placeholder={`Highlight ${i + 1}`} className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                            <button onClick={() => setForm(f => ({ ...f, highlights: f.highlights.filter((_, j) => j !== i) }))}
                                className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button onClick={() => setForm(f => ({ ...f, highlights: [...f.highlights, ''] }))}
                        className="flex items-center gap-1 text-[#2874F0] text-sm font-medium"><Plus size={14} /> Add Highlight</button>
                </div>

                {/* Specifications */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Specifications</h2>
                    {form.specifications.map((s, i) => (
                        <div key={i} className="flex gap-2">
                            <input value={s.key} onChange={(e) => {
                                const updated = [...form.specifications]; updated[i] = { ...updated[i], key: e.target.value };
                                setForm({ ...form, specifications: updated });
                            }} placeholder="Key" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                            <input value={s.value} onChange={(e) => {
                                const updated = [...form.specifications]; updated[i] = { ...updated[i], value: e.target.value };
                                setForm({ ...form, specifications: updated });
                            }} placeholder="Value" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                            <button onClick={() => setForm(f => ({ ...f, specifications: f.specifications.filter((_, j) => j !== i) }))}
                                className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button onClick={() => setForm(f => ({ ...f, specifications: [...f.specifications, { key: '', value: '' }] }))}
                        className="flex items-center gap-1 text-[#2874F0] text-sm font-medium"><Plus size={14} /> Add Spec</button>
                </div>

                {/* Meesho & Flags */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Dropshipping & Flags</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meesho Product Link (private)</label>
                        <input value={form.meeshoLink} onChange={(e) => setForm({ ...form, meeshoLink: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meesho Notes (private)</label>
                        <textarea value={form.meeshoNotes} onChange={(e) => setForm({ ...form, meeshoNotes: e.target.value })}
                            rows={2} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm resize-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                        <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" placeholder="earbuds, wireless, bluetooth" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Days</label>
                        <input type="number" value={form.returnDays} onChange={(e) => setForm({ ...form, returnDays: e.target.value })}
                            className="w-32 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {[
                            { key: 'isFeatured', label: 'Featured' },
                            { key: 'isDealOfDay', label: 'Deal of Day' },
                            { key: 'isNewArrival', label: 'New Arrival' },
                            { key: 'isBestSeller', label: 'Best Seller' },
                        ].map(f => (
                            <label key={f.key} className="flex items-center gap-2 text-sm dark:text-gray-300">
                                <input type="checkbox" checked={(form as Record<string, unknown>)[f.key] as boolean}
                                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.checked }))}
                                    className="accent-[#2874F0]" />
                                {f.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* SEO */}
                <div className="bg-white dark:bg-gray-800/60 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">SEO</h2>
                    <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                        placeholder="Meta Title" className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                    <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                        placeholder="Meta Description" rows={2} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm resize-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                </div>

                {/* Save */}
                <div className="flex gap-3">
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3 rounded-md font-bold hover:bg-blue-600 disabled:opacity-50">
                        <Save size={18} /> {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                    </button>
                    <Link href="/admin/products" className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</Link>
                </div>
            </div>
        </div>
    );
}
