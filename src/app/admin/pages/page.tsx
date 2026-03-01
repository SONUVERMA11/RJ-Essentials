'use client';

import { useEffect, useState } from 'react';
import { Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

const PAGES = ['about', 'privacy-policy', 'return-policy', 'terms', 'faq', 'shipping'];

export default function AdminPagesPage() {
    const [selectedPage, setSelectedPage] = useState('about');
    const [content, setContent] = useState({ title: '', content: '', metaTitle: '', metaDescription: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchPage = async (slug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pages/${slug}`);
            const data = await res.json();
            setContent({ title: data.title || '', content: data.content || '', metaTitle: data.metaTitle || '', metaDescription: data.metaDescription || '' });
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchPage(selectedPage); }, [selectedPage]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/pages/${selectedPage}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content),
            });
            toast.success('Page saved');
        } catch { toast.error('Failed'); }
        setSaving(false);
    };

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Pages</h1>
            <div className="flex gap-4">
                <div className="w-48 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {PAGES.map(p => (
                            <button key={p} onClick={() => setSelectedPage(p)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-gray-100 ${selectedPage === p ? 'bg-[#2874F0] text-white' : 'text-gray-600 hover:bg-gray-50'
                                    }`}>
                                {p.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-lg p-6 shadow-sm space-y-4">
                    {loading ? <p className="text-gray-400">Loading...</p> : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                                <input value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
                                <textarea value={content.content} onChange={(e) => setContent({ ...content, content: e.target.value })}
                                    rows={15} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                <input value={content.metaTitle} onChange={(e) => setContent({ ...content, metaTitle: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                <textarea value={content.metaDescription} onChange={(e) => setContent({ ...content, metaDescription: e.target.value })}
                                    rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none" />
                            </div>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 bg-[#2874F0] text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50">
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Page'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
