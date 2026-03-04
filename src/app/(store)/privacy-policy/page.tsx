import { ShieldCheck, Eye, Database, Lock, Mail } from 'lucide-react';

const sections = [
    {
        icon: Eye,
        title: 'Information We Collect',
        content: null,
        list: [
            'Name, phone number, and email (for order processing)',
            'Delivery address (for shipping)',
            'Browsing data (cookies, analytics)',
        ],
    },
    {
        icon: Database,
        title: 'How We Use It',
        content: null,
        list: [
            'To process and deliver your orders',
            'To send order confirmations and updates',
            'To improve our website and services',
            'To respond to your inquiries',
        ],
    },
    {
        icon: Lock,
        title: 'Data Security',
        content: 'We implement industry-standard security measures. We do not store any payment information since we operate on COD only.',
        list: null,
    },
    {
        icon: Mail,
        title: 'Contact',
        content: 'For privacy-related queries, contact us via WhatsApp or email.',
        list: null,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#2874F0]/10 rounded-xl">
                        <ShieldCheck size={24} className="text-[#2874F0]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
                </div>
                <p className="text-muted-foreground text-sm ml-[52px]">RJ ESSENTIALS is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div key={section.title} className="border-l-2 border-border pl-6 hover:border-[#2874F0] transition-colors">
                            <div className="flex items-center gap-2.5 mb-3">
                                <Icon size={18} className="text-muted-foreground" />
                                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                            </div>
                            {section.content && (
                                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                            )}
                            {section.list && (
                                <ul className="space-y-2 mt-1">
                                    {section.list.map((item, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#2874F0] mt-1.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Last Updated */}
            <div className="mt-12 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">Last updated: March 2026</p>
            </div>
        </div>
    );
}
