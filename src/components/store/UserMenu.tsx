'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, User, LogOut, Package, ChevronDown, Shield } from 'lucide-react';
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
        return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
    }

    if (!session) {
        return (
            <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all"
            >
                <LogIn size={16} strokeWidth={1.8} />
                <span className="hidden sm:inline">Login</span>
            </button>
        );
    }

    const initial = session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || 'U';
    const isAdmin = (session.user as { role?: string })?.role === 'admin';

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-foreground hover:bg-muted px-2 py-2 rounded-xl transition-all"
            >
                {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full border border-border" />
                ) : (
                    <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold">
                        {initial}
                    </div>
                )}
                <span className="hidden md:inline text-sm font-semibold max-w-[100px] truncate">{session.user?.name?.split(' ')[0] || 'Account'}</span>
                <ChevronDown size={14} className={`hidden md:block transition-transform duration-200 ${open ? 'rotate-180' : ''} text-muted-foreground`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-2xl shadow-lg border border-border z-[100] py-1 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-bold text-foreground truncate">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user?.email}</p>
                    </div>

                    <div className="py-1">
                        <Link href="/account" onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground font-medium rounded-lg mx-1 transition-colors">
                            <User size={16} strokeWidth={1.8} />
                            My Account
                        </Link>
                        <Link href="/account?tab=orders" onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground font-medium rounded-lg mx-1 transition-colors">
                            <Package size={16} strokeWidth={1.8} />
                            My Orders
                        </Link>

                        {isAdmin && (
                            <Link href="/admin/dashboard" onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground font-bold hover:bg-muted rounded-lg mx-1 transition-colors">
                                <Shield size={16} strokeWidth={1.8} />
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    <div className="border-t border-border pt-1 pb-1">
                        <button
                            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 font-semibold rounded-lg mx-1 transition-colors"
                            style={{ width: 'calc(100% - 0.5rem)' }}
                        >
                            <LogOut size={16} strokeWidth={1.8} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
