'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/category/all', label: 'Categories', icon: Grid3X3 },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/track-order', label: 'Account', icon: User },
];

export default function MobileNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
            <div className="flex items-center justify-around h-14">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${isActive ? 'text-[#2874F0]' : 'text-muted-foreground'}`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#2874F0] rounded-full" />
                            )}
                            <div className="relative">
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                {item.label === 'Cart' && itemCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 bg-[#FB641B] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
