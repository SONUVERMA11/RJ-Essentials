'use client';

import Link from 'next/link';
import { CheckCircle, Package, ShoppingBag, MessageCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId') || 'RJE-XXXXXXXX-XXXX';

    return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-sm p-8 md:p-12 shadow-sm">
                <div className="animate-checkmark">
                    <CheckCircle size={80} className="mx-auto text-[#388E3C] mb-4" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
                <p className="text-gray-500 mb-6">Thank you for shopping with RJ ESSENTIALS</p>

                <div className="bg-gray-50 rounded-md p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="text-xl font-bold text-[#2874F0]">{orderId}</p>
                    <p className="text-sm text-gray-500 mt-2">Estimated delivery in 5-7 business days</p>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Payment: Cash on Delivery</p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/track-order"
                        className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3 rounded-sm font-bold hover:bg-blue-600"
                    >
                        <Package size={18} /> Track Your Order
                    </Link>
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 rounded-sm font-bold hover:bg-gray-50"
                    >
                        <ShoppingBag size={18} /> Continue Shopping
                    </Link>
                    <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918287386760'}?text=${encodeURIComponent(`Hi, I just placed order ${orderId}. Can you confirm?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-sm font-bold hover:bg-green-600"
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
        <Suspense fallback={<div className="py-16 text-center"><p>Loading...</p></div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
