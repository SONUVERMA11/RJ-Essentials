'use client';

import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Section {
    _id: string; title: string; type: string; layout: string; productIds: string[];
    isActive: boolean; order: number;
}

export default function AdminSectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', type: 'featured', layout: 'grid', isActive: true, order: 0, productIds: '' });

    const fetchSections = async () => {
        const res = await fetch('/api/sections');
        const data = await res.json();
        setSections(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchSections(); }, []);

    const handleSave = async () => {
        if (!form.title) { toast.error('Title required'); return; }
        const body = { ...form, productIds: form.productIds.split(',').map(s => s.trim()).filter(Boolean) };
        try {
            if (editing && editing !== 'new') {
                await fetch(`/api/sections/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            } else {
                await fetch('/api/sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            }
            toast.success('Saved');
            setEditing(null);
            fetchSections();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete?')) return;
        await fetch(`/api/sections/${id}`, { method: 'DELETE' });
        toast.success('Deleted');
        fetchSections();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Homepage Sections</h1>
                <button onClick={() => { setEditing('new'); setForm({ title: '', type: 'featured', layout: 'grid', isActive: true, order: sections.length, productIds: '' }); }}
                    className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium"><Plus size={16} /> Add Section</button>
            </div>

            {editing && (
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4 space-y-3">
                    <div className="flex justify-between"><h3 className="font-bold">{editing === 'new' ? 'New Section' : 'Edit Section'}</h3><button onClick={() => setEditing(null)}><X size={18} className="text-gray-400" /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Section Title" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                            <option value="featured">Featured</option><option value="deals">Deals</option><option value="new">New Arrivals</option>
                            <option value="best-sellers">Best Sellers</option><option value="custom">Custom</option>
                        </select>
                        <select value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                            <option value="grid">Grid</option><option value="carousel">Carousel</option><option value="list">List</option>
                        </select>
                    </div>
                    <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Display Order" className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    <input value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} placeholder="Product IDs (comma-separated, for custom type)" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-[#2874F0]" /> Active</label>
                    <button onClick={handleSave} className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium"><Save size={14} /> Save</button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Layout</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr> :
                            sections.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No sections</td></tr> :
                                sections.map(s => (
                                    <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-3">{s.order}</td>
                                        <td className="px-4 py-3 font-medium">{s.title}</td>
                                        <td className="px-4 py-3 text-gray-500 capitalize">{s.type}</td>
                                        <td className="px-4 py-3 text-gray-500 capitalize">{s.layout}</td>
                                        <td className="px-4 py-3"><span className={`text-xs font-medium ${s.isActive ? 'text-green-600' : 'text-gray-400'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                                        <td className="px-4 py-3 flex gap-1">
                                            <button onClick={() => { setEditing(s._id); setForm({ title: s.title, type: s.type, layout: s.layout, isActive: s.isActive, order: s.order, productIds: (s.productIds || []).join(', ') }); }}
                                                className="p-1.5 text-gray-400 hover:text-[#2874F0]"><Save size={15} /></button>
                                            <button onClick={() => handleDelete(s._id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
