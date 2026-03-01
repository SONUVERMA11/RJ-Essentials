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
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
                <button onClick={() => { setEditing('new'); setForm({ name: '', slug: '', description: '', order: categories.length }); }}
                    className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                    <Plus size={16} /> Add Category
                </button>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold">{editing === 'new' ? 'New Category' : 'Edit Category'}</h3>
                        <button onClick={() => setEditing(null)} className="text-gray-400"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category Name" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (auto)" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none" />
                    <button onClick={handleSave} className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium"><Save size={14} /> Save</button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No categories. Add one above.</td></tr>
                        ) : categories.map((cat) => (
                            <tr key={cat._id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-3">{cat.order}</td>
                                <td className="px-4 py-3 font-medium">{cat.name}</td>
                                <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                                <td className="px-4 py-3 flex gap-1">
                                    <button onClick={() => { setEditing(cat._id); setForm({ name: cat.name, slug: cat.slug, description: cat.description, order: cat.order }); }}
                                        className="p-1.5 text-gray-400 hover:text-[#2874F0]"><Edit size={15} /></button>
                                    <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
