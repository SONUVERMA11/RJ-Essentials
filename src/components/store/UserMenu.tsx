'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, User, LogOut, Package, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function UserMenu() {
    const { data: session, status } = useSession();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (status === 'loading') {
        return <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />;
    }

    if (!session) {
        return (
            <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-1.5 text-white text-sm font-medium hover:opacity-90 px-2 md:px-3 py-2"
            >
                <LogIn size={18} />
                <span className="hidden md:inline">Login</span>
            </button>
        );
    }

    const initial = session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || 'U';
    const isAdmin = (session.user as { role?: string })?.role === 'admin';

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-white hover:opacity-90 px-1 md:px-2 py-1"
            >
                {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full border-2 border-white/40" />
                ) : (
                    <div className="w-7 h-7 rounded-full bg-[#FB641B] flex items-center justify-center text-white text-xs font-bold border-2 border-white/40">
                        {initial}
                    </div>
                )}
                <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">{session.user?.name?.split(' ')[0] || 'Account'}</span>
                <ChevronDown size={14} className={`hidden md:block transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                    </div>

                    <Link href="/track-order" onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Package size={16} /> My Orders
                    </Link>

                    {isAdmin && (
                        <Link href="/admin/dashboard" onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2874F0] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <User size={16} /> Admin Panel
                        </Link>
                    )}

                    <div className="border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
