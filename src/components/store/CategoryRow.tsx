'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Smartphone, Shirt, Home, Sparkles, Gamepad2, Dumbbell,
    BookOpen, ShoppingBasket, Car, UtensilsCrossed, Sofa,
    Headphones, Watch, Baby, Palette, Wrench
} from 'lucide-react';

const ALL_CATEGORIES: Array<{ name: string; slug: string; icon: typeof Smartphone; color: string; image: string }> = [
    { name: 'Electronics', slug: 'electronics', icon: Smartphone, color: '#2874F0', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=120&h=120&fit=crop&auto=format' },
    { name: 'Fashion', slug: 'fashion', icon: Shirt, color: '#FB641B', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=120&h=120&fit=crop&auto=format' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, color: '#388E3C', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=120&fit=crop&auto=format' },
    { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: '#E91E63', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&h=120&fit=crop&auto=format' },
    { name: 'Toys & Baby', slug: 'toys', icon: Baby, color: '#9C27B0', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=120&h=120&fit=crop&auto=format' },
    { name: 'Sports', slug: 'sports', icon: Dumbbell, color: '#FF5722', image: 'https://images.unsplash.com/photo-1461896836934-bd45ba8a0a23?w=120&h=120&fit=crop&auto=format' },
    { name: 'Books', slug: 'books', icon: BookOpen, color: '#795548', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=120&h=120&fit=crop&auto=format' },
    { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, color: '#4CAF50', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop&auto=format' },
    { name: 'Mobiles', slug: 'mobiles', icon: Headphones, color: '#00BCD4', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&h=120&fit=crop&auto=format' },
    { name: 'Watches', slug: 'watches', icon: Watch, color: '#607D8B', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=120&h=120&fit=crop&auto=format' },
    { name: 'Auto Acc', slug: 'auto-accessories', icon: Car, color: '#F44336', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=120&h=120&fit=crop&auto=format' },
    { name: 'Appliances', slug: 'appliances', icon: UtensilsCrossed, color: '#FF9800', image: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=120&h=120&fit=crop&auto=format' },
    { name: 'Furniture', slug: 'furniture', icon: Sofa, color: '#8D6E63', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&h=120&fit=crop&auto=format' },
    { name: 'Art & Craft', slug: 'art-craft', icon: Palette, color: '#AB47BC', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=120&h=120&fit=crop&auto=format' },
    { name: 'Gaming', slug: 'gaming', icon: Gamepad2, color: '#7C4DFF', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=120&h=120&fit=crop&auto=format' },
    { name: 'Tools', slug: 'tools', icon: Wrench, color: '#546E7A', image: 'https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=120&h=120&fit=crop&auto=format' },
];

interface CategoryRowProps {
    categories?: Array<{ name: string; slug: string; icon?: string; image?: string }>;
}

export default function CategoryRow({ categories }: CategoryRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const items = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            name: cat.name,
            slug: cat.slug,
            image: cat.image || ALL_CATEGORIES[i % ALL_CATEGORIES.length].image,
            icon: ALL_CATEGORIES[i % ALL_CATEGORIES.length].icon,
            color: ALL_CATEGORIES[i % ALL_CATEGORIES.length].color,
        }))
        : ALL_CATEGORIES;

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -250 : 250, behavior: 'smooth' });
    };

    return (
        <section className="max-w-7xl mx-auto px-4 py-3 md:py-5">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-2.5 md:mb-4">
                <h2 className="text-base md:text-lg font-bold text-foreground">
                    Shop by Category
                </h2>
                <Link
                    href="/category/all"
                    className="text-xs font-semibold text-[#2874F0] hover:underline"
                >
                    View All →
                </Link>
            </div>

            {/* Scrollable Row — scrollable on both mobile & desktop */}
            <div
                ref={scrollRef}
                className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-1 cursor-grab active:cursor-grabbing"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((cat) => {
                    return (
                        <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            className="group flex flex-col items-center gap-1.5 flex-shrink-0"
                        >
                            <div
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[#2874F0]/50 transition-all duration-200 group-hover:scale-105 relative"
                            >
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {/* Subtle color overlay */}
                                <div
                                    className="absolute inset-0 opacity-10 group-hover:opacity-0 transition-opacity"
                                    style={{ backgroundColor: cat.color }}
                                />
                            </div>
                            <span className="text-[10px] md:text-[11px] text-foreground/60 font-medium text-center leading-tight group-hover:text-foreground transition-colors w-16 md:w-[72px] line-clamp-1">
                                {cat.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
