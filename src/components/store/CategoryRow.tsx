'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Smartphone, Shirt, Home, Sparkles, Gamepad2, Dumbbell,
    BookOpen, ShoppingBasket, Car, UtensilsCrossed, Sofa,
    Headphones, Watch, Baby, Palette, Wrench, ChevronLeft, ChevronRight
} from 'lucide-react';

const ALL_CATEGORIES: Array<{ name: string; slug: string; icon: typeof Smartphone; color: string; bg: string }> = [
    { name: 'Electronics', slug: 'electronics', icon: Smartphone, color: '#2874F0', bg: 'rgba(40, 116, 240, 0.15)' },
    { name: 'Fashion', slug: 'fashion', icon: Shirt, color: '#FB641B', bg: 'rgba(251, 100, 27, 0.15)' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, color: '#388E3C', bg: 'rgba(56, 142, 60, 0.15)' },
    { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: '#E91E63', bg: 'rgba(233, 30, 99, 0.15)' },
    { name: 'Toys & Baby', slug: 'toys', icon: Baby, color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.15)' },
    { name: 'Sports', slug: 'sports', icon: Dumbbell, color: '#FF5722', bg: 'rgba(255, 87, 34, 0.15)' },
    { name: 'Books', slug: 'books', icon: BookOpen, color: '#795548', bg: 'rgba(121, 85, 72, 0.15)' },
    { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)' },
    { name: 'Mobiles', slug: 'mobiles', icon: Headphones, color: '#00BCD4', bg: 'rgba(0, 188, 212, 0.15)' },
    { name: 'Watches', slug: 'watches', icon: Watch, color: '#607D8B', bg: 'rgba(96, 125, 139, 0.15)' },
    { name: 'Auto Acc', slug: 'auto-accessories', icon: Car, color: '#F44336', bg: 'rgba(244, 67, 54, 0.15)' },
    { name: 'Appliances', slug: 'appliances', icon: UtensilsCrossed, color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)' },
    { name: 'Furniture', slug: 'furniture', icon: Sofa, color: '#8D6E63', bg: 'rgba(141, 110, 99, 0.15)' },
    { name: 'Art & Craft', slug: 'art-craft', icon: Palette, color: '#AB47BC', bg: 'rgba(171, 71, 188, 0.15)' },
    { name: 'Gaming', slug: 'gaming', icon: Gamepad2, color: '#7C4DFF', bg: 'rgba(124, 77, 255, 0.15)' },
    { name: 'Tools', slug: 'tools', icon: Wrench, color: '#546E7A', bg: 'rgba(84, 110, 122, 0.15)' },
];

interface CategoryRowProps {
    categories?: Array<{ name: string; slug: string; icon?: string; image?: string }>;
}

export default function CategoryRow({ categories }: CategoryRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const items = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            name: cat.name,
            slug: cat.slug,
            image: cat.image,
            icon: ALL_CATEGORIES[i % ALL_CATEGORIES.length].icon,
            color: ALL_CATEGORIES[i % ALL_CATEGORIES.length].color,
            bg: ALL_CATEGORIES[i % ALL_CATEGORIES.length].bg,
        }))
        : ALL_CATEGORIES;

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', checkScroll);
        return () => { if (el) el.removeEventListener('scroll', checkScroll); };
    }, []);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-3 md:py-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                    Shop by Category
                </h2>
                <div className="flex items-center gap-2">
                    {/* Arrow controls - desktop only */}
                    <button
                        onClick={() => scroll('left')}
                        className={`hidden md:flex w-8 h-8 rounded-full border border-border items-center justify-center transition-all ${canScrollLeft ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/30 cursor-default'}`}
                        disabled={!canScrollLeft}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className={`hidden md:flex w-8 h-8 rounded-full border border-border items-center justify-center transition-all ${canScrollRight ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/30 cursor-default'}`}
                        disabled={!canScrollRight}
                    >
                        <ChevronRight size={16} />
                    </button>
                    <Link
                        href="/search"
                        className="text-sm font-semibold text-[#2874F0] hover:underline ml-2"
                    >
                        View All →
                    </Link>
                </div>
            </div>

            {/* Scrollable Single Row */}
            <div className="relative">
                {/* Left fade gradient */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                )}

                <div
                    ref={scrollRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.slug}
                                href={`/category/${cat.slug}`}
                                className="group flex flex-col items-center gap-2 min-w-[80px] md:min-w-[110px] py-2 flex-shrink-0"
                            >
                                <div
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${cat.color}30 0%, ${cat.color}15 50%, ${cat.color}08 100%)`,
                                        border: `1px solid ${cat.color}20`
                                    }}
                                >
                                    <Icon size={28} className="md:!w-9 md:!h-9" style={{ color: cat.color }} />
                                </div>
                                <span className="text-xs md:text-sm text-foreground/70 font-semibold text-center leading-tight group-hover:text-foreground transition-colors">
                                    {cat.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right fade gradient */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                )}
            </div>
        </section>
    );
}
