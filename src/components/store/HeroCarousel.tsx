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

// Default demo banners when no banners in DB
const DEFAULT_BANNERS: BannerSlide[] = [
    { _id: '1', image: '', link: '/category/electronics', title: 'Electronics Sale — Up to 70% Off' },
    { _id: '2', image: '', link: '/category/fashion', title: 'Fashion Fiesta — Starting ₹199' },
    { _id: '3', image: '', link: '/category/home-kitchen', title: 'Home & Kitchen Essentials' },
];

export default function HeroCarousel({ banners }: { banners?: BannerSlide[] }) {
    const slides = banners && banners.length > 0 ? banners : DEFAULT_BANNERS;
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prev = useCallback(() => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    useEffect(() => {
        const interval = setInterval(next, 4000);
        return () => clearInterval(interval);
    }, [next]);

    return (
        <div className="relative w-full bg-white overflow-hidden group">
            <div className="relative h-[140px] sm:h-[200px] md:h-[280px] lg:h-[340px]">
                {slides.map((slide, index) => (
                    <div
                        key={slide._id}
                        className={`absolute inset-0 transition-opacity duration-500 ${index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                    >
                        <Link href={slide.link || '#'} className="block w-full h-full">
                            {slide.image ? (
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-[#2874F0] via-[#4b8df8] to-[#2874F0] flex items-center justify-center">
                                    <div className="text-center text-white px-6">
                                        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">{slide.title}</h2>
                                        <p className="text-sm md:text-lg text-blue-100">Shop Now →</p>
                                    </div>
                                </div>
                            )}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Navigation arrows */}
            <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-sm p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
                <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-sm p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
                <ChevronRight size={24} className="text-gray-700" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
