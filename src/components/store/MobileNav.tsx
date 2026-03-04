'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, ShoppingCart, User, Compass } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

const navItems = [
    { href: '/', label: 'Home', icon: Home, color: '#2874F0' },
    { href: '/category/all', label: 'Explore', icon: Compass, color: '#FB641B' },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, color: '#388E3C' },
    { href: '/track-order', label: 'Account', icon: User, color: '#9C27B0' },
];

export default function MobileNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/20">
            <div className="flex items-center justify-around h-[64px] px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    const activeColor = item.color;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
                        >
                            <div className={`relative flex items-center justify-center w-12 h-9 rounded-2xl transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                                style={isActive ? { backgroundColor: `${activeColor}18` } : {}}
                            >
                                <Icon
                                    size={28}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                    style={{ color: isActive ? activeColor : undefined }}
                                    className={`transition-all duration-200 ${!isActive ? 'text-muted-foreground/50' : ''}`}
                                />
                                {item.label === 'Cart' && itemCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1 bg-[#FB641B] text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-background shadow-sm">
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-[10px] leading-none transition-all duration-200 ${isActive ? 'font-bold' : 'font-normal text-muted-foreground/50'}`}
                                style={isActive ? { color: activeColor } : {}}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
            <div className="h-[env(safe-area-inset-bottom,0px)] bg-background/90" />
        </nav>
    );
}
