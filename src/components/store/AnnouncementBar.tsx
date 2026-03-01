'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export default function AnnouncementBar() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="w-full bg-[#FFE500] text-gray-900 text-center py-1.5 px-4 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            <span>🚚 Free Delivery on orders above ₹499 | Cash on Delivery Available!</span>
            <button
                onClick={() => setVisible(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900 p-1 hover:bg-black/5 rounded"
            >
                <X size={14} />
            </button>
        </div>
    );
}
