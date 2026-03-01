'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BannerSlide {
    _id: string;
    image: string;
    link: string;
    title: string;
    isActive?: boolean;
}

// Fallback banners when no admin banners exist
const FALLBACK_BANNERS: BannerSlide[] = [
    {
        _id: 'fb-1',
        title: 'Electronics Sale — Up to 70% Off',
        image: '',
        link: '/category/electronics',
    },
    {
        _id: 'fb-2',
        title: 'Fashion Fiesta — Starting ₹199',
        image: '',
        link: '/category/fashion',
    },
    {
        _id: 'fb-3',
        title: 'Home Essentials — Flat 50% Off',
        image: '',
        link: '/category/home-kitchen',
    },
    {
        _id: 'fb-4',
        title: 'Beauty Picks — Min 40% Off',
        image: '',
        link: '/category/beauty',
    },
];

// Gradient fallbacks for banners without images
const FALLBACK_GRADIENTS = [
    'from-blue-600 via-indigo-600 to-purple-700',
    'from-rose-500 via-pink-500 to-fuchsia-600',
    'from-amber-500 via-orange-500 to-red-500',
    'from-emerald-500 via-teal-500 to-cyan-600',
    'from-violet-500 via-purple-500 to-indigo-600',
    'from-cyan-500 via-blue-500 to-indigo-600',
];

export default function HeroCarousel({ banners: initialBanners }: { banners?: BannerSlide[] }) {
    const [slides, setSlides] = useState<BannerSlide[]>(initialBanners || []);
    const [current, setCurrent] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch banners from API if not provided
    useEffect(() => {
        if (initialBanners && initialBanners.length > 0) {
            setSlides(initialBanners.filter(b => b.isActive !== false));
            setIsLoaded(true);
            return;
        }
        fetch('/api/banners')
            .then(res => res.json())
            .then(data => {
                const active = (Array.isArray(data) ? data : []).filter(
                    (b: BannerSlide) => b.isActive !== false
                );
                setSlides(active.length > 0 ? active : FALLBACK_BANNERS);
                setIsLoaded(true);
            })
            .catch(() => {
                setSlides(FALLBACK_BANNERS);
                setIsLoaded(true);
            });
    }, [initialBanners]);

    const total = slides.length;

    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % total);
    }, [total]);

    const prev = useCallback(() => {
        setCurrent(prev => (prev - 1 + total) % total);
    }, [total]);

    // Auto-slide every 4 seconds
    useEffect(() => {
        if (total <= 1) return;
        const interval = setInterval(next, 4000);
        return () => clearInterval(interval);
    }, [next, total]);

    if (!isLoaded) {
        return (
            <div className="max-w-7xl mx-auto px-4 pt-4">
                <div className="h-[160px] sm:h-[220px] md:h-[300px] lg:h-[360px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-4 pt-4">
            <div className="relative w-full overflow-hidden rounded-2xl group">
                {/* Slides */}
                <div className="relative h-[160px] sm:h-[220px] md:h-[300px] lg:h-[360px]">
                    {slides.map((slide, index) => (
                        <div
                            key={slide._id}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === current
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-105 pointer-events-none'
                                }`}
                        >
                            <Link href={slide.link || '#'} className="block w-full h-full">
                                {slide.image ? (
                                    /* Banner with uploaded image */
                                    <div className="relative w-full h-full">
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Dark overlay for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                        {/* Title overlay */}
                                        {slide.title && (
                                            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                                                <h2 className="text-white text-lg md:text-2xl lg:text-3xl font-bold drop-shadow-lg">
                                                    {slide.title}
                                                </h2>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Fallback gradient banner (no image uploaded) */
                                    <div className={`w-full h-full bg-gradient-to-br ${FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]} flex items-center justify-center p-8`}>
                                        <h2 className="text-white text-xl md:text-3xl lg:text-4xl font-bold text-center drop-shadow-lg">
                                            {slide.title}
                                        </h2>
                                    </div>
                                )}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                {total > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} className="text-gray-700 dark:text-gray-200" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} className="text-gray-700 dark:text-gray-200" />
                        </button>
                    </>
                )}

                {/* Dot Indicators */}
                {total > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === current
                                        ? 'w-7 bg-white shadow-md'
                                        : 'w-2 bg-white/50 hover:bg-white/70'
                                    }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
