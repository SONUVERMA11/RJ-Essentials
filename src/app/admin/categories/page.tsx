'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    _id: string; name: string; slug: string; description: string; image: string;
    subcategories: { name: string; slug: string }[]; order: number;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '', order: 0 });

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSave = async () => {
        if (!form.name) { toast.error('Name is required'); return; }
        const slug = form.slug || form.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
        try {
            if (editing && editing !== 'new') {
                await fetch(`/api/categories/${editing}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, slug }),
                });
                toast.success('Category updated');
            } else {
                await fetch('/api/categories', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, slug }),
                });
                toast.success('Category created');
            }
            setEditing(null);
            setForm({ name: '', slug: '', description: '', order: 0 });
            fetchCategories();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        toast.success('Category deleted');
        fetchCategories();
    };

    return (
    return (
        <div className="pb-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
                <button onClick={() => { setEditing('new'); setForm({ name: '', slug: '', description: '', order: categories.length }); }}
                    className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm">
                    <Plus size={18} /> <span className="hidden md:inline">Add Category</span>
                </button>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="bg-card/80 backdrop-blur-xl rounded-[24px] p-5 md:p-6 shadow-sm border border-border/50 mb-6 space-y-4 transition-all">
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <h3 className="font-bold text-lg tracking-tight text-foreground">{editing === 'new' ? 'New Category' : 'Edit Category'}</h3>
                        <button onClick={() => setEditing(null)} className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:bg-muted transition-colors"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category Name" className="bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2874F0]/20 focus:border-[#2874F0] transition-all outline-none" />
                        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (auto)" className="bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2874F0]/20 focus:border-[#2874F0] transition-all outline-none" />
                        <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2874F0]/20 focus:border-[#2874F0] transition-all outline-none" />
                    </div>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-[#2874F0]/20 focus:border-[#2874F0] transition-all outline-none" />
                    <div className="pt-2">
                        <button onClick={handleSave} className="flex items-center gap-2 bg-[#2874F0] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm"><Save size={16} /> Save Category</button>
                    </div>
                </div>
            )}

            <div className="bg-card/80 backdrop-blur-xl rounded-[24px] shadow-sm border border-border/50 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-5 py-4 text-left font-semibold text-muted-foreground">Order</th>
                                <th className="px-5 py-4 text-left font-semibold text-muted-foreground">Name</th>
                                <th className="px-5 py-4 text-left font-semibold text-muted-foreground">Slug</th>
                                <th className="px-5 py-4 text-right font-semibold text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No categories. Add one above.</td></tr>
                            ) : categories.map((cat) => (
                                <tr key={cat._id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-5 py-4 font-medium">{cat.order}</td>
                                    <td className="px-5 py-4 font-bold text-foreground">{cat.name}</td>
                                    <td className="px-5 py-4 text-muted-foreground">{cat.slug}</td>
                                    <td className="px-5 py-4 flex gap-2 justify-end">
                                        <button onClick={() => { setEditing(cat._id); setForm({ name: cat.name, slug: cat.slug, description: cat.description, order: cat.order }); }}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(cat._id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden flex flex-col divide-y divide-border/50">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No categories. Add one above.</div>
                    ) : categories.map((cat) => (
                        <div key={cat._id} className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-bold text-muted-foreground">{cat.order}</span>
                                    <p className="font-bold text-foreground tracking-tight">{cat.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium ml-8">{cat.slug}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditing(cat._id); setForm({ name: cat.name, slug: cat.slug, description: cat.description, order: cat.order }); }}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(cat._id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
