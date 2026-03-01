'use client';

import { useState } from 'react';
import { Send, MessageCircle, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.message) { toast.error('Please fill in required fields'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success('Message sent! We\'ll get back to you soon.');
                setForm({ name: '', email: '', phone: '', subject: '', message: '' });
            } else toast.error('Failed to send');
        } catch { toast.error('Something went wrong'); }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-sm p-6 shadow-sm">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">Contact Us</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your Name *" className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" required />
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" />
                        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number" className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" />
                        <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" />
                        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your Message *" rows={4} className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none resize-none" required />
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3 rounded-sm font-bold hover:bg-blue-600 disabled:opacity-50">
                            <Send size={16} /> {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
                <div className="space-y-4">
                    <div className="bg-white rounded-sm p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Get in Touch</h2>
                        <div className="space-y-4">
                            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999'}`} className="flex items-center gap-3 text-gray-600 hover:text-[#25D366]">
                                <MessageCircle size={20} /> Chat on WhatsApp
                            </a>
                            <div className="flex items-center gap-3 text-gray-600"><Mail size={20} /> support@rjessentials.com</div>
                            <div className="flex items-center gap-3 text-gray-600"><Phone size={20} /> +91 99999 99999</div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#2874F0] to-[#6C63FF] rounded-sm p-6 text-white">
                        <h3 className="font-bold mb-2">Quick Support</h3>
                        <p className="text-sm text-blue-100">For fastest response, message us on WhatsApp. We typically respond within 30 minutes during business hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
