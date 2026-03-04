import { RotateCcw, Clock, ListOrdered, XCircle, Banknote } from 'lucide-react';

const sections = [
    {
        icon: Clock,
        title: 'Return Window',
        content: null,
        richContent: (
            <p className="text-muted-foreground text-sm leading-relaxed">
                You can return most items within <strong className="text-foreground font-semibold">7 days</strong> of delivery. Items must be unused, unworn (for fashion), and in their original packaging.
            </p>
        ),
        list: null,
        ordered: false,
    },
    {
        icon: ListOrdered,
        title: 'How to Return',
        content: null,
        richContent: null,
        list: [
            'Contact us via WhatsApp or the Contact page with your Order ID',
            'Share photos of the product (if defective/damaged)',
            'We will arrange a pickup or provide return shipping instructions',
            'Refund will be processed within 5-7 business days after receiving the item',
        ],
        ordered: true,
    },
    {
        icon: XCircle,
        title: 'Non-Returnable Items',
        content: null,
        richContent: null,
        list: [
            'Intimate wear and innerwear',
            'Products with broken seals',
            'Customized/personalized items',
        ],
        ordered: false,
    },
    {
        icon: Banknote,
        title: 'Refund Method',
        content: 'For COD orders, refunds are processed via UPI/bank transfer to the account you provide.',
        richContent: null,
        list: null,
        ordered: false,
    },
];

export default function ReturnPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#2874F0]/10 rounded-xl">
                        <RotateCcw size={24} className="text-[#2874F0]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Return & Refund Policy</h1>
                </div>
                <p className="text-muted-foreground text-sm ml-[52px]">At RJ ESSENTIALS, we want you to be completely satisfied with your purchase. If you&apos;re not happy, we offer a simple return and refund process.</p>
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
                            {section.richContent}
                            {section.content && (
                                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                            )}
                            {section.list && (
                                <ol className="space-y-2 mt-1">
                                    {section.list.map((item, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                                            {section.ordered ? (
                                                <span className="w-5 h-5 rounded-full bg-[#2874F0]/10 text-[#2874F0] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#2874F0] mt-1.5 flex-shrink-0" />
                                            )}
                                            {item}
                                        </li>
                                    ))}
                                </ol>
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
