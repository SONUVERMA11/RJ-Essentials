'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Banner { _id: string; title: string; image: string; link: string; type: string; isActive: boolean; order: number; }

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', image: '', link: '', type: 'hero', isActive: true, order: 0 });

    const fetchBanners = async () => {
        const res = await fetch('/api/banners');
        const data = await res.json();
        setBanners(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'rj-essentials/banners');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) setForm(f => ({ ...f, image: data.url }));
    };

    const handleSave = async () => {
        if (!form.title) { toast.error('Title required'); return; }
        try {
            if (editing && editing !== 'new') {
                await fetch(`/api/banners/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            } else {
                await fetch('/api/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            }
            toast.success('Saved');
            setEditing(null);
            fetchBanners();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete?')) return;
        await fetch(`/api/banners/${id}`, { method: 'DELETE' });
        toast.success('Deleted');
        fetchBanners();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">Banners</h1>
                <button onClick={() => { setEditing('new'); setForm({ title: '', image: '', link: '', type: 'hero', isActive: true, order: banners.length }); }}
                    className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium"><Plus size={16} /> Add Banner</button>
            </div>

            {editing && (
                <div className="bg-card rounded-lg p-4 shadow-sm mb-4 space-y-3">
                    <div className="flex justify-between"><h3 className="font-bold">{editing === 'new' ? 'New Banner' : 'Edit Banner'}</h3><button onClick={() => setEditing(null)}><X size={18} className="text-muted-foreground" /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="border border-border rounded-md px-3 py-2 text-sm" />
                        <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link URL" className="border border-border rounded-md px-3 py-2 text-sm" />
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
                            <option value="hero">Hero</option><option value="strip">Strip</option>
                        </select>
                        <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="border border-border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                        {form.image && <img src={form.image} alt="" className="h-20 object-cover rounded" />}
                        <label className="border-2 border-dashed border-border rounded px-4 py-2 cursor-pointer text-sm text-muted-foreground hover:border-[#2874F0]">
                            <Upload size={14} className="inline mr-1" /> Upload Image
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-[#2874F0]" /> Active</label>
                    <button onClick={handleSave} className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium"><Save size={14} /> Save</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? <p className="text-muted-foreground">Loading...</p> :
                    banners.length === 0 ? <p className="text-muted-foreground col-span-2 bg-card rounded-lg p-8 text-center shadow-sm">No banners</p> :
                        banners.map(b => (
                            <div key={b._id} className="bg-card rounded-lg shadow-sm overflow-hidden">
                                {b.image ? <img src={b.image} alt={b.title} className="w-full h-32 object-cover" /> :
                                    <div className="w-full h-32 bg-gradient-to-r from-[#2874F0] to-[#6C63FF] flex items-center justify-center text-white font-bold">{b.title}</div>}
                                <div className="p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{b.title}</p>
                                        <p className="text-xs text-muted-foreground">{b.type} • Order: {b.order} • {b.isActive ? '✅ Active' : '❌ Inactive'}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditing(b._id); setForm({ title: b.title, image: b.image, link: b.link, type: b.type, isActive: b.isActive, order: b.order }); }}
                                            className="p-1.5 text-muted-foreground hover:text-[#2874F0]"><Edit size={15} /></button>
                                        <button onClick={() => handleDelete(b._id)} className="p-1.5 text-muted-foreground hover:text-red-500"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                }
            </div>
        </div>
    );
}
