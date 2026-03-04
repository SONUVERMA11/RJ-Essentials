'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings').then(r => r.json()).then(data => { setSettings(data || {}); setLoading(false); });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
            if (res.ok) toast.success('Settings saved');
            else toast.error('Failed');
        } catch { toast.error('Error'); }
        setSaving(false);
    };

    const update = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

    if (loading) return <p className="text-muted-foreground py-8 text-center">Loading...</p>;

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">Store Settings</h1>
            <div className="space-y-6">
                <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-foreground">General</h2>
                    {[
                        { key: 'storeName', label: 'Store Name' },
                        { key: 'tagline', label: 'Tagline' },
                        { key: 'storeEmail', label: 'Store Email' },
                        { key: 'storePhone', label: 'Store Phone' },
                        { key: 'whatsappNumber', label: 'WhatsApp Number (with country code)' },
                        { key: 'currency', label: 'Currency Symbol' },
                        { key: 'freeDeliveryAbove', label: 'Free Delivery Above (₹)' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-sm font-medium text-foreground mb-1">{f.label}</label>
                            <input value={settings[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}
                                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none" />
                        </div>
                    ))}
                </div>

                <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-foreground">Social Media</h2>
                    {[
                        { key: 'instagramUrl', label: 'Instagram URL' },
                        { key: 'facebookUrl', label: 'Facebook URL' },
                        { key: 'youtubeUrl', label: 'YouTube URL' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-sm font-medium text-foreground mb-1">{f.label}</label>
                            <input value={settings[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}
                                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:border-[#2874F0] outline-none" />
                        </div>
                    ))}
                </div>

                <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-foreground">Announcement</h2>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Announcement Text</label>
                        <input value={settings['announcementText'] || ''} onChange={(e) => update('announcementText', e.target.value)}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="🚚 Free Delivery on orders above ₹499" />
                    </div>
                </div>

                <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                    <h2 className="font-bold text-foreground">Analytics</h2>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Google Analytics ID (GA4)</label>
                        <input value={settings['gaId'] || ''} onChange={(e) => update('gaId', e.target.value)}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm" placeholder="G-XXXXXXXXXX" />
                    </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3 rounded-md font-bold hover:bg-blue-600 disabled:opacity-50">
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
