'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function WhatsAppButton() {
    const pathname = usePathname();
    const isProductPage = pathname.startsWith('/product/');
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918287386760';
    const message = 'Hi RJ ESSENTIALS, I need help with my order';
    const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed ${isProductPage ? 'bottom-[72px]' : 'bottom-20'} md:bottom-6 right-4 z-40 bg-[#25D366] text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110`}
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle size={24} fill="white" />
        </a>
    );
}
