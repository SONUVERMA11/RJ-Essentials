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

// Fallback banners with high-res category images
const FALLBACK_BANNERS: BannerSlide[] = [
    {
        _id: 'fb-1',
        title: 'Electronics Sale — Up to 70% Off',
        image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1400&h=600&fit=crop&auto=format&q=85',
        link: '/category/electronics',
    },
    {
        _id: 'fb-2',
        title: 'Fashion Fiesta — Starting ₹199',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=600&fit=crop&auto=format&q=85',
        link: '/category/fashion',
    },
    {
        _id: 'fb-3',
        title: 'Home Essentials — Flat 50% Off',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&h=600&fit=crop&auto=format&q=85',
        link: '/category/home-kitchen',
    },
    {
        _id: 'fb-4',
        title: 'Beauty Picks — Min 40% Off',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&h=600&fit=crop&auto=format&q=85',
        link: '/category/beauty',
    },
    {
        _id: 'fb-5',
        title: 'Watches — Timeless Elegance',
        image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1400&h=600&fit=crop&auto=format&q=85',
        link: '/category/watches',
    },
    {
        _id: 'fb-6',
        title: 'Sports & Fitness — Gear Up',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&h=600&fit=crop&auto=format&q=85',
        link: '/category/sports',
    },
];

const FALLBACK_SUBTITLES = [
    'Premium tech at unbeatable prices',
    'Curated styles for every occasion',
    'Transform your living space',
    'Self-care essentials you deserve',
    'Craftsmanship meets precision',
    'Push your limits further',
];

export default function HeroCarousel({ banners: initialBanners }: { banners?: BannerSlide[] }) {
    const [slides, setSlides] = useState<BannerSlide[]>(initialBanners || []);
    const [current, setCurrent] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch banners from API — always include our curated banners
    useEffect(() => {
        if (initialBanners && initialBanners.length > 0) {
            setSlides(initialBanners.filter(b => b.isActive !== false));
            setIsLoaded(true);
            return;
        }
        fetch('/api/banners')
            .then(res => res.json())
            .then(data => {
                const dbBanners = (Array.isArray(data) ? data : []).filter(
                    (b: BannerSlide) => b.isActive !== false && b.image
                );
                // Use curated banners — admin banners go first if they exist
                setSlides(dbBanners.length > 0 ? [...dbBanners, ...FALLBACK_BANNERS] : FALLBACK_BANNERS);
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

    // Auto-slide every 4.5 seconds
    useEffect(() => {
        if (total <= 1) return;
        const interval = setInterval(next, 4500);
        return () => clearInterval(interval);
    }, [next, total]);

    if (!isLoaded) {
        return (
            <div className="max-w-[1280px] mx-auto px-4">
                <div className="h-[200px] sm:h-[260px] md:h-[340px] lg:h-[420px] bg-muted rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    return (
        <section className="w-full">
            <div className="max-w-[1280px] mx-auto px-4">
                <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl group">
                    {/* Slides */}
                    <div className="relative h-[200px] sm:h-[260px] md:h-[340px] lg:h-[420px]">
                        {slides.map((slide, index) => {
                            const subtitle = FALLBACK_SUBTITLES[index % FALLBACK_SUBTITLES.length];
                            return (
                                <div
                                    key={slide._id}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                        index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                                                {slide.title && (
                                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                                                        <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/60 font-semibold mb-2 block">Featured</span>
                                                        <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-lg">
                                                            {slide.title}
                                                        </h2>
                                                        <div className="mt-4 md:mt-6">
                                                            <span className="inline-flex items-center gap-2 bg-[#2874F0] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a5dc7] transition-colors shadow-lg">
                                                                Shop Now
                                                                <ChevronRight size={16} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Fallback dark banner (no image) */
                                            <div className="w-full h-full bg-[#0A0A0A] flex flex-col justify-center p-6 md:p-10 lg:p-14">
                                                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/50 font-semibold mb-3 block">
                                                    Featured
                                                </span>
                                                <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-lg tracking-tight">
                                                    {slide.title}
                                                </h2>
                                                <p className="text-white/50 text-sm md:text-base mt-2 max-w-md">
                                                    {subtitle}
                                                </p>
                                                <div className="mt-5 md:mt-8">
                                                    <span className="inline-flex items-center gap-2 bg-[#2874F0] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a5dc7] transition-colors shadow-lg">
                                                        Shop Now
                                                        <ChevronRight size={16} />
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Arrows */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={18} className="text-black dark:text-white" />
                            </button>
                            <button
                                onClick={next}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
                                aria-label="Next slide"
                            >
                                <ChevronRight size={18} className="text-black dark:text-white" />
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
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        i === current
                                            ? 'w-7 bg-white shadow-md'
                                            : 'w-2 bg-white/50 hover:bg-white/70'
                                    }`}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
