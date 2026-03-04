import { FileText, ShieldCheck, CreditCard, RotateCcw, Scale, Mail } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions — RJ ESSENTIALS',
    description: 'Terms and conditions for shopping at RJ ESSENTIALS. COD, pricing, and return policies.',
};

const sections = [
    {
        icon: ShieldCheck,
        title: 'Orders',
        content: null,
        list: [
            'All orders are Cash on Delivery (COD)',
            'Orders are subject to availability',
            'We reserve the right to cancel orders if items are out of stock',
            'Delivery typically takes 5-7 business days',
        ],
    },
    {
        icon: CreditCard,
        title: 'Pricing',
        content: 'All prices are in INR (₹) and inclusive of applicable taxes. Prices are subject to change without notice. The price at the time of order confirmation is final.',
        list: null,
    },
    {
        icon: RotateCcw,
        title: 'Returns',
        content: 'Please refer to our Return Policy page for detailed return and refund information.',
        list: null,
    },
    {
        icon: Scale,
        title: 'Intellectual Property',
        content: 'All content on this website including text, images, logos, and design is the property of RJ ESSENTIALS.',
        list: null,
    },
    {
        icon: Mail,
        title: 'Contact',
        content: 'For any questions about these terms, please contact us via our Contact page.',
        list: null,
    },
];

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#2874F0]/10 rounded-xl">
                        <FileText size={24} className="text-[#2874F0]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Terms & Conditions</h1>
                </div>
                <p className="text-muted-foreground text-sm ml-[52px]">By using RJ ESSENTIALS, you agree to the following terms.</p>
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
