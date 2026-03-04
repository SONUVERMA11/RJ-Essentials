'use client';

import Link from 'next/link';
import { CheckCircle, Package, ShoppingBag, MessageCircle, Copy, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId') || 'RJE-XXXXXXXX-XXXX';
    const [copied, setCopied] = useState(false);

    const copyOrderId = async () => {
        try {
            await navigator.clipboard.writeText(orderId);
            setCopied(true);
            toast.success('Order ID copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = orderId;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            toast.success('Order ID copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <div className="bg-card border border-border rounded-xl p-8 md:p-12 shadow-sm">
                <div className="animate-checkmark">
                    <CheckCircle size={80} className="mx-auto text-[#388E3C] mb-4" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
                <p className="text-muted-foreground mb-6">Thank you for shopping with RJ ESSENTIALS</p>

                <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-xl font-bold text-[#2874F0]">{orderId}</p>
                        <button
                            onClick={copyOrderId}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Copy Order ID"
                        >
                            {copied ? <Check size={18} className="text-[#388E3C]" /> : <Copy size={18} />}
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Estimated delivery in 5-7 business days</p>
                    <p className="text-sm text-foreground mt-1 font-medium">Payment: Cash on Delivery</p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/track-order"
                        className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                    >
                        <Package size={18} /> Track Your Order
                    </Link>
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 border-2 border-border text-foreground py-3 rounded-lg font-bold hover:bg-muted/50 transition-colors"
                    >
                        <ShoppingBag size={18} /> Continue Shopping
                    </Link>
                    <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918287386760'}?text=${encodeURIComponent(`Hi, I just placed order ${orderId}. Can you confirm?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
                    >
                        <MessageCircle size={18} /> WhatsApp Support
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center"><p className="text-muted-foreground">Loading...</p></div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
