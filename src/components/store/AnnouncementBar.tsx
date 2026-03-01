'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export default function AnnouncementBar() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="announcement-bar bg-gradient-to-r from-[#FFE500] via-[#FFD000] to-[#FFB800] text-gray-900 text-center py-2 px-4 text-sm font-semibold relative shadow-sm">
            <span>🚚 Free Delivery on orders above ₹499 | Cash on Delivery Available!</span>
            <button
                onClick={() => setVisible(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
            >
                <X size={16} />
            </button>
        </div>
    );
}
