'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, Grid3X3, ShoppingCart, Package, MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/category/all', label: 'Categories', icon: Grid3X3 },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/track-order', label: 'Orders', icon: Package },
    { href: '/about', label: 'More', icon: MoreHorizontal },
];

export default function MobileNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-around py-1.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${isActive ? 'text-[#2874F0]' : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <div className="relative">
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                {item.label === 'Cart' && itemCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-[#FB641B] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
