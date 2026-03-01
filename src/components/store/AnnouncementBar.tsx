'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export default function AnnouncementBar() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="announcement-bar bg-[#2874F0] text-white text-center py-2 px-4 text-sm font-medium relative">
            <span>🚚 Free Delivery on orders above ₹499 | Cash on Delivery Available!</span>
            <button
                onClick={() => setVisible(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            >
                <X size={16} />
            </button>
        </div>
    );
}
