'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem('rj-cookie-consent');
        if (!accepted) setShow(true);
    }, []);

    if (!show) return null;

    const accept = () => {
        localStorage.setItem('rj-cookie-consent', 'true');
        setShow(false);
    };

    return (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-xl">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-300">
                    We use cookies to enhance your shopping experience. By continuing, you agree to our{' '}
                    <a href="/privacy-policy" className="text-[#2874F0] underline">Privacy Policy</a>.
                </p>
                <button
                    onClick={accept}
                    className="bg-[#2874F0] text-white px-6 py-2 rounded-sm text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                    Accept Cookies
                </button>
            </div>
        </div>
    );
}
