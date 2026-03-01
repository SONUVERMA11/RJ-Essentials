'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BannerSlide {
    _id: string;
    image: string;
    link: string;
    title: string;
}

// Flipkart-style small promo tiles
const PROMO_TILES = [
    {
        id: 't1',
        title: 'Electronics',
        offer: 'Up to 70% Off',
        link: '/category/electronics',
        bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        emoji: '📱',
    },
    {
        id: 't2',
        title: 'Fashion',
        offer: 'Starting ₹199',
        link: '/category/fashion',
        bg: 'bg-gradient-to-br from-pink-500 to-rose-600',
        emoji: '👗',
    },
    {
        id: 't3',
        title: 'Home & Kitchen',
        offer: 'Flat 50% Off',
        link: '/category/home-kitchen',
        bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        emoji: '🏠',
    },
    {
        id: 't4',
        title: 'Beauty',
        offer: 'Min 40% Off',
        link: '/category/beauty',
        bg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
        emoji: '💄',
    },
    {
        id: 't5',
        title: 'Sports',
        offer: 'From ₹299',
        link: '/category/sports',
        bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        emoji: '⚽',
    },
    {
        id: 't6',
        title: 'Toys & Games',
        offer: 'Up to 60% Off',
        link: '/category/toys',
        bg: 'bg-gradient-to-br from-violet-500 to-purple-700',
        emoji: '🎮',
    },
    {
        id: 't7',
        title: 'Books',
        offer: 'Buy 2 Get 1',
        link: '/category/books',
        bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
        emoji: '📚',
    },
    {
        id: 't8',
        title: 'Grocery',
        offer: 'Fresh Deals',
        link: '/category/grocery',
        bg: 'bg-gradient-to-br from-lime-500 to-green-600',
        emoji: '🛒',
    },
];

export default function HeroCarousel({ banners }: { banners?: BannerSlide[] }) {
    const hasCustomBanners = banners && banners.length > 0 && banners.some(b => b.image);
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        if (hasCustomBanners) setCurrent((prev) => (prev + 1) % banners!.length);
    }, [hasCustomBanners, banners]);

    const prev = useCallback(() => {
        if (hasCustomBanners) setCurrent((prev) => (prev - 1 + banners!.length) % banners!.length);
    }, [hasCustomBanners, banners]);

    useEffect(() => {
        if (!hasCustomBanners) return;
        const interval = setInterval(next, 4000);
        return () => clearInterval(interval);
    }, [next, hasCustomBanners]);

    // Custom banner carousel
    if (hasCustomBanners) {
        return (
            <div className="relative w-full bg-white dark:bg-gray-800 overflow-hidden group">
                <div className="relative h-[140px] sm:h-[200px] md:h-[280px] lg:h-[340px]">
                    {banners!.map((slide, index) => (
                        <div key={slide._id} className={`absolute inset-0 transition-opacity duration-500 ${index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <Link href={slide.link || '#'} className="block w-full h-full">
                                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                            </Link>
                        </div>
                    ))}
                </div>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={22} className="text-gray-700 dark:text-gray-200" />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners!.map((_, i) => (
                        <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
                    ))}
                </div>
            </div>
        );
    }

    // Flipkart-style compact tiles grid
    return (
        <section className="max-w-7xl mx-auto px-4 pt-4">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
                {PROMO_TILES.map((tile) => (
                    <Link key={tile.id} href={tile.link} className="block group">
                        <div className={`${tile.bg} rounded-xl p-3 md:p-4 text-center text-white aspect-square flex flex-col items-center justify-center gap-1 hover:shadow-lg hover:scale-105 transition-all duration-200 relative overflow-hidden`}>
                            <span className="text-2xl md:text-3xl drop-shadow-sm">{tile.emoji}</span>
                            <p className="text-[10px] md:text-xs font-bold leading-tight mt-1">{tile.title}</p>
                            <p className="text-[9px] md:text-[10px] font-medium opacity-80 leading-tight">{tile.offer}</p>
                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
