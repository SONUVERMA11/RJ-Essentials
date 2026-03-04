'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999';
    const message = 'Hi RJ ESSENTIALS, I need help with my order';
    const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-[140px] md:bottom-6 right-4 z-40 bg-[#25D366] text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle size={24} fill="white" />
        </a>
    );
}
