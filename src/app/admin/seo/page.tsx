'use client';

import { useState } from 'react';
import { Search, Globe, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSEOPage() {
    const [settings, setSettings] = useState({
        siteTitle: 'RJ ESSENTIALS — Quality at Your Doorstep',
        siteDescription: 'Shop quality products at affordable prices. Cash on Delivery available across India.',
        siteKeywords: 'online shopping, COD, cash on delivery, electronics, fashion, India, RJ ESSENTIALS',
        ogImage: '',
        robotsTxt: `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://yourdomain.com/sitemap.xml`,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Save SEO settings via settings API
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteTitle: settings.siteTitle,
                    siteDescription: settings.siteDescription,
                    siteKeywords: settings.siteKeywords,
                }),
            });
            toast.success('SEO settings saved');
        } catch { toast.error('Failed'); }
        setSaving(false);
    };

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Search size={24} /> SEO Settings
            </h1>

            <div className="space-y-6">
                <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-foreground flex items-center gap-2"><Globe size={18} /> Global SEO</h2>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Site Title</label>
                        <input value={settings.siteTitle} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">{settings.siteTitle.length}/60 characters</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Site Description</label>
                        <textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                            rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm resize-none" />
                        <p className="text-xs text-muted-foreground mt-1">{settings.siteDescription.length}/160 characters</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Keywords</label>
                        <input value={settings.siteKeywords} onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm" />
                    </div>
                </div>

                <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-foreground flex items-center gap-2"><FileText size={18} /> robots.txt</h2>
                    <textarea value={settings.robotsTxt} onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
                        rows={6} className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono resize-none" />
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">💡 SEO Tips</p>
                    <ul className="space-y-1 text-blue-700">
                        <li>• Keep titles under 60 characters</li>
                        <li>• Descriptions should be 120-160 characters</li>
                        <li>• Each product has its own SEO fields (edit in product form)</li>
                        <li>• Sitemap is auto-generated at /sitemap.xml</li>
                    </ul>
                </div>

                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3 rounded-md font-bold hover:bg-blue-600 disabled:opacity-50">
                    <Save size={18} /> {saving ? 'Saving...' : 'Save SEO Settings'}
                </button>
            </div>
        </div>
    );
}
