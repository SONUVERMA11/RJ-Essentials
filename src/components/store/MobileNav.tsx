'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';
import { useSession } from 'next-auth/react';

// Custom SVG icons with filled/outline variants
const HomeOutline = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 14 15 14 15 21" />
    </svg>
);
const HomeFilled = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0.5">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
);

const ExploreOutline = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);
const ExploreFilled = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.36 6.64l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
);

const CartOutline = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);
const CartFilled = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0.5">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zm10 8a4 4 0 0 1-8 0H6.5a5.5 5.5 0 0 0 11 0H16z" />
    </svg>
);

const PersonOutline = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
);
const PersonFilled = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0h16z" />
    </svg>
);

const navItems = [
    { href: '/', label: 'Home', outlineIcon: HomeOutline, filledIcon: HomeFilled, color: '#2874F0' },
    { href: '/category/all', label: 'Explore', outlineIcon: ExploreOutline, filledIcon: ExploreFilled, color: '#FB641B' },
    { href: '/cart', label: 'Cart', outlineIcon: CartOutline, filledIcon: CartFilled, color: '#388E3C' },
    { href: '/account', label: 'Account', outlineIcon: PersonOutline, filledIcon: PersonFilled, color: '#9C27B0' },
];

export default function MobileNav() {
    const pathname = usePathname();
    const isProductPage = pathname.startsWith('/product/');
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

    // Hide mobile nav on product pages
    if (isProductPage) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30">
            <div className="flex items-center justify-around h-[56px] px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const activeColor = item.color;
                    const IconOutline = item.outlineIcon;
                    const IconFilled = item.filledIcon;
                    const isAccount = item.label === 'Account';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
                        >
                            <div className={`relative flex items-center justify-center w-10 h-8 rounded-2xl transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                                style={isActive ? { backgroundColor: `${activeColor}18` } : {}}
                            >
                                {/* Account: show profile picture or initial */}
                                {isAccount && session?.user ? (
                                    <div className={`w-7 h-7 rounded-full overflow-hidden ring-2 transition-all duration-200 ${isActive ? 'ring-[#9C27B0]' : 'ring-transparent'}`}>
                                        {session.user.image ? (
                                            <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center text-[11px] font-bold text-white ${isActive ? 'bg-[#9C27B0]' : 'bg-muted-foreground/60'}`}>
                                                {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {isActive ? (
                                            <IconFilled size={22} color={activeColor} />
                                        ) : (
                                            <IconOutline size={22} color="currentColor" />
                                        )}
                                    </>
                                )}

                                {/* Cart badge */}
                                {item.label === 'Cart' && itemCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1 bg-[#FB641B] text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-background shadow-sm">
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-[10px] leading-none transition-all duration-200 ${isActive ? 'font-bold' : 'font-medium text-muted-foreground/80'}`}
                                style={isActive ? { color: activeColor } : {}}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
