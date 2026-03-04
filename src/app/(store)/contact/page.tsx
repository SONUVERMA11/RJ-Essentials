'use client';

import { useState } from 'react';
import { Send, MessageCircle, Mail, Phone, Headphones } from 'lucide-react';
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
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#2874F0]/10 rounded-xl">
                        <Headphones size={24} className="text-[#2874F0]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
                </div>
                <p className="text-muted-foreground text-sm ml-[52px]">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                {/* Form - takes 3/5 */}
                <div className="md:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Your Name *</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none transition-all" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none transition-all" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 99999" className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Your Message *</label>
                            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us more about your inquiry..." rows={5} className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none resize-none transition-all" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3.5 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/25">
                            <Send size={16} /> {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>

                {/* Contact Info - takes 2/5 */}
                <div className="md:col-span-2 space-y-4">
                    {/* Contact Methods */}
                    <div className="border border-border rounded-xl p-6 space-y-5">
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Get in Touch</h2>
                        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999'}`} className="flex items-center gap-3 text-foreground hover:text-[#25D366] transition-colors group">
                            <div className="p-2 bg-[#25D366]/10 rounded-lg group-hover:scale-110 transition-transform">
                                <MessageCircle size={18} className="text-[#25D366]" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Chat on WhatsApp</p>
                                <p className="text-xs text-muted-foreground">Fastest response</p>
                            </div>
                        </a>
                        <div className="flex items-center gap-3 text-foreground">
                            <div className="p-2 bg-[#2874F0]/10 rounded-lg">
                                <Mail size={18} className="text-[#2874F0]" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">support@rjessentials.com</p>
                                <p className="text-xs text-muted-foreground">Email support</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-foreground">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Phone size={18} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">+91 99999 99999</p>
                                <p className="text-xs text-muted-foreground">Phone support</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Support */}
                    <div className="bg-gradient-to-br from-[#2874F0] to-[#6C63FF] rounded-xl p-6 text-white">
                        <h3 className="font-bold mb-2">⚡ Quick Support</h3>
                        <p className="text-sm text-blue-100 leading-relaxed">For fastest response, message us on WhatsApp. We typically respond within 30 minutes during business hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
