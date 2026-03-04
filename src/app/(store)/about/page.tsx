import { Store, Target, CheckCircle, Truck, Shield, RotateCcw, CreditCard, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us — RJ ESSENTIALS',
    description: 'Learn about RJ ESSENTIALS — your one-stop destination for quality products at unbeatable prices. Cash on Delivery available across India.',
};

const benefits = [
    { icon: CreditCard, title: 'Cash on Delivery', desc: 'Pay only when your order arrives. No prepayment hassle.', color: 'text-[#2874F0]', bg: 'bg-[#2874F0]/10' },
    { icon: Shield, title: 'Quality Assured', desc: 'Every product is verified and tested before listing.', color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy on all products.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: MessageCircle, title: 'WhatsApp Support', desc: 'Get instant help via WhatsApp.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Hero Header */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-[#2874F0]/10 rounded-xl">
                        <Store size={24} className="text-[#2874F0]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">About RJ ESSENTIALS</h1>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Welcome to <strong className="text-foreground font-semibold">RJ ESSENTIALS</strong> — your one-stop destination for quality products at unbeatable prices. We are an online store dedicated to bringing you the best in Electronics, Fashion, Home & Kitchen, Beauty, and more.
                </p>
            </div>

            {/* Mission Section */}
            <div className="mb-12 border-l-2 border-[#2874F0] pl-6">
                <div className="flex items-center gap-2.5 mb-3">
                    <Target size={18} className="text-[#2874F0]" />
                    <h2 className="text-lg font-semibold text-foreground">Our Mission</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                    Quality at Your Doorstep. We believe everyone deserves access to premium products without breaking the bank. Our curated selection ensures that every item meets our strict quality standards.
                </p>
            </div>

            {/* Why Choose Us */}
            <div className="mb-12">
                <div className="flex items-center gap-2.5 mb-6">
                    <CheckCircle size={18} className="text-[#388E3C]" />
                    <h2 className="text-lg font-semibold text-foreground">Why Choose Us?</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    {benefits.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-[#2874F0]/30 transition-all group">
                                <div className={`p-2.5 ${item.bg} rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Icon size={20} className={item.color} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Contact CTA */}
            <div className="border-t border-border pt-8">
                <h2 className="text-lg font-semibold text-foreground mb-2">Get in Touch</h2>
                <p className="text-muted-foreground text-sm mb-4">
                    Have questions? Reach out to us anytime. We&apos;re always happy to help!
                </p>
                <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2874F0] hover:underline">
                    <MessageCircle size={16} /> Contact Us →
                </Link>
            </div>
        </div>
    );
}
