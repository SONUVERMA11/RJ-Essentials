'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';
import { useSession } from 'next-auth/react';

// Custom SVG icons with filled/outline variants
const HomeOutline = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 14 15 14 15 21" />
    </svg>
);
const HomeFilled = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
);

const ExploreOutline = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);
const ExploreFilled = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.36 6.64l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
);

const CartOutline = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);
const CartFilled = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zm10 8a4 4 0 0 1-8 0H6.5a5.5 5.5 0 0 0 11 0H16z" />
    </svg>
);

const PersonOutline = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
);
const PersonFilled = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0h16z" />
    </svg>
);

const navItems = [
    { href: '/', label: 'Home', outlineIcon: HomeOutline, filledIcon: HomeFilled },
    { href: '/category/all', label: 'Explore', outlineIcon: ExploreOutline, filledIcon: ExploreFilled },
    { href: '/cart', label: 'Cart', outlineIcon: CartOutline, filledIcon: CartFilled },
    { href: '/account', label: 'Account', outlineIcon: PersonOutline, filledIcon: PersonFilled },
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-border">
            <div className="flex items-center justify-around h-[52px] px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const IconOutline = item.outlineIcon;
                    const IconFilled = item.filledIcon;
                    const isAccount = item.label === 'Account';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200"
                        >
                            <div className="relative flex items-center justify-center w-10 h-7 transition-all duration-300">
                                {/* Account: show profile picture or initial */}
                                {isAccount && session?.user ? (
                                    <div className={`w-6 h-6 rounded-full overflow-hidden ring-2 transition-all duration-200 ${isActive ? 'ring-foreground' : 'ring-transparent'}`}>
                                        {session.user.image ? (
                                            <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-foreground text-background' : 'bg-muted-foreground/30 text-foreground'}`}>
                                                {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {isActive ? (
                                            <IconFilled size={21} />
                                        ) : (
                                            <IconOutline size={21} />
                                        )}
                                    </>
                                )}

                                {/* Cart badge */}
                                {item.label === 'Cart' && itemCount > 0 && (
                                    <span className="absolute -top-1 right-0 bg-foreground text-background text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 ring-2 ring-background animate-badge-bounce">
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                )}
                            </div>

                            {/* Label — only show for active */}
                            <span
                                className={`text-[9px] leading-none font-semibold uppercase tracking-wider transition-all duration-200 ${
                                    isActive ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                            >
                                {item.label}
                            </span>

                            {/* Active dot indicator */}
                            {isActive && (
                                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-foreground" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
