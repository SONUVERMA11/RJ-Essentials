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

// Promo cards for the banner section (Flipkart style)
const PROMO_CARDS = [
    {
        id: 'promo-1',
        title: 'Electronics Sale',
        subtitle: 'Up to 70% Off',
        description: 'Top brands, best prices',
        link: '/category/electronics',
        gradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40',
        accent: 'text-indigo-600 dark:text-indigo-400',
        badge: '🔥 Trending',
        badgeColor: 'bg-red-500',
        emoji: '📱',
    },
    {
        id: 'promo-2',
        title: 'Fashion Fiesta',
        subtitle: 'Starting ₹199',
        description: 'Latest styles for everyone',
        link: '/category/fashion',
        gradient: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40',
        accent: 'text-rose-600 dark:text-rose-400',
        badge: '✨ New',
        badgeColor: 'bg-pink-500',
        emoji: '👗',
    },
    {
        id: 'promo-3',
        title: 'Home Essentials',
        subtitle: 'Flat 50% Off',
        description: 'Upgrade your space',
        link: '/category/home-kitchen',
        gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
        accent: 'text-amber-600 dark:text-amber-400',
        badge: '⭐ Popular',
        badgeColor: 'bg-amber-500',
        emoji: '🏠',
    },
    {
        id: 'promo-4',
        title: 'Beauty Picks',
        subtitle: 'Min 40% Off',
        description: 'Premium beauty products',
        link: '/category/beauty',
        gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
        accent: 'text-emerald-600 dark:text-emerald-400',
        badge: '💚 Deals',
        badgeColor: 'bg-emerald-500',
        emoji: '💄',
    },
    {
        id: 'promo-5',
        title: 'Sports & Fitness',
        subtitle: 'From ₹299',
        description: 'Gear up for adventure',
        link: '/category/sports',
        gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
        accent: 'text-blue-600 dark:text-blue-400',
        badge: '🏃 Active',
        badgeColor: 'bg-blue-500',
        emoji: '⚽',
    },
    {
        id: 'promo-6',
        title: 'Books & Toys',
        subtitle: 'Up to 60% Off',
        description: 'Fun for all ages',
        link: '/category/books',
        gradient: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40',
        accent: 'text-violet-600 dark:text-violet-400',
        badge: '📚 Picks',
        badgeColor: 'bg-violet-500',
        emoji: '🎮',
    },
];

export default function HeroCarousel({ banners }: { banners?: BannerSlide[] }) {
    const hasCustomBanners = banners && banners.length > 0 && banners.some(b => b.image);
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        if (hasCustomBanners) {
            setCurrent((prev) => (prev + 1) % banners!.length);
        }
    }, [hasCustomBanners, banners]);

    const prev = useCallback(() => {
        if (hasCustomBanners) {
            setCurrent((prev) => (prev - 1 + banners!.length) % banners!.length);
        }
    }, [hasCustomBanners, banners]);

    useEffect(() => {
        if (!hasCustomBanners) return;
        const interval = setInterval(next, 4000);
        return () => clearInterval(interval);
    }, [next, hasCustomBanners]);

    // If custom banners with images exist, show the traditional carousel
    if (hasCustomBanners) {
        return (
            <div className="relative w-full bg-white dark:bg-gray-800 overflow-hidden group">
                <div className="relative h-[140px] sm:h-[200px] md:h-[280px] lg:h-[340px]">
                    {banners!.map((slide, index) => (
                        <div
                            key={slide._id}
                            className={`absolute inset-0 transition-opacity duration-500 ${index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
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

    // Flipkart-style promo cards (default)
    return (
        <section className="max-w-7xl mx-auto px-4 pt-4">
            {/* Main Banner Grid - 3 cards on desktop, scrollable on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {PROMO_CARDS.slice(0, 3).map((card) => (
                    <Link key={card.id} href={card.link} className="block group">
                        <div className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl p-5 md:p-6 h-[160px] md:h-[180px] overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
                            {/* Badge */}
                            <span className={`inline-block ${card.badgeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3`}>
                                {card.badge}
                            </span>

                            {/* Content */}
                            <h3 className={`text-lg md:text-xl font-bold ${card.accent} leading-tight`}>{card.title}</h3>
                            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mt-1">{card.subtitle}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>

                            {/* Emoji decoration */}
                            <span className="absolute right-4 bottom-3 text-5xl md:text-6xl opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-300">
                                {card.emoji}
                            </span>

                            {/* Shop Now arrow */}
                            <div className="absolute bottom-4 left-5 md:left-6 flex items-center gap-1 text-xs font-semibold text-[#2874F0] dark:text-[#5a9cf5] opacity-0 group-hover:opacity-100 transition-opacity">
                                Shop Now <ChevronRight size={14} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Secondary Row - 3 more cards, smaller */}
            <div className="grid grid-cols-3 gap-3">
                {PROMO_CARDS.slice(3, 6).map((card) => (
                    <Link key={card.id} href={card.link} className="block group">
                        <div className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl p-4 h-[100px] md:h-[120px] overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
                            {/* Content */}
                            <h3 className={`text-sm md:text-base font-bold ${card.accent} leading-tight`}>{card.title}</h3>
                            <p className="text-base md:text-lg font-black text-gray-900 dark:text-white mt-0.5">{card.subtitle}</p>
                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden md:block">{card.description}</p>

                            {/* Emoji */}
                            <span className="absolute right-3 bottom-2 text-3xl md:text-4xl opacity-15 group-hover:opacity-30 transition-opacity">
                                {card.emoji}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
