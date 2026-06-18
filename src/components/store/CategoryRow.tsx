'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
    {
        name: 'Electronics',
        slug: 'electronics',
        tagline: 'Future-ready tech',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&h=600&fit=crop&auto=format&q=80',
        size: 'large',
    },
    {
        name: 'Fashion',
        slug: 'fashion',
        tagline: 'Your style, elevated',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&auto=format&q=80',
        size: 'medium',
    },
    {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        tagline: 'Live beautifully',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&auto=format&q=80',
        size: 'medium',
    },
    {
        name: 'Beauty',
        slug: 'beauty',
        tagline: 'Glow from within',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&auto=format&q=80',
        size: 'small',
    },
    {
        name: 'Sports & Fitness',
        slug: 'sports',
        tagline: 'Push your limits',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop&auto=format&q=80',
        size: 'small',
    },
    {
        name: 'Books',
        slug: 'books',
        tagline: 'Stories that inspire',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop&auto=format&q=80',
        size: 'small',
    },
    {
        name: 'Toys & Baby',
        slug: 'toys',
        tagline: 'Joy for little ones',
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=600&fit=crop&auto=format&q=80',
        size: 'wide',
    },
    {
        name: 'Watches',
        slug: 'watches',
        tagline: 'Time well spent',
        image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&h=400&fit=crop&auto=format&q=80',
        size: 'small',
    },
];

interface CategoryRowProps {
    categories?: Array<{ name: string; slug: string; icon?: string; image?: string }>;
}

function CategoryCard({ cat, className = '' }: { cat: typeof CATEGORIES[0]; className?: string }) {
    return (
        <Link
            href={`/category/${cat.slug}`}
            className={`group relative overflow-hidden rounded-2xl md:rounded-3xl block ${className}`}
        >
            {/* Image */}
            <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 group-hover:from-black/90 group-hover:via-black/30 transition-all duration-500" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                <div className="transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                    <p className="text-[10px] md:text-xs text-white/50 font-medium uppercase tracking-[0.15em] mb-1">
                        {cat.tagline}
                    </p>
                    <h3 className="text-white text-lg md:text-2xl font-bold tracking-tight leading-tight">
                        {cat.name}
                    </h3>
                </div>

                {/* Arrow indicator */}
                <div className="absolute top-4 right-4 md:top-5 md:right-5 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:bg-white/20 border border-white/10">
                    <ArrowUpRight size={16} className="text-white md:w-[18px] md:h-[18px]" />
                </div>
            </div>

            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                 style={{
                     background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 60%)',
                     backgroundSize: '200% 100%',
                     animation: 'shimmer 1.5s ease-in-out infinite',
                 }}
            />
        </Link>
    );
}

export default function CategoryRow({ categories }: CategoryRowProps) {
    const items = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            ...CATEGORIES[i % CATEGORIES.length],
            name: cat.name,
            slug: cat.slug,
            image: cat.image || CATEGORIES[i % CATEGORIES.length].image,
        }))
        : CATEGORIES;

    return (
        <section className="max-w-[1280px] mx-auto px-4 py-2 md:py-4">
            {/* Section Header */}
            <div className="flex items-baseline justify-between mb-5 md:mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                        Explore Categories
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 hidden md:block">Find exactly what you&apos;re looking for</p>
                </div>
                <Link
                    href="/category/all"
                    className="text-sm font-semibold text-[#2874F0] hover:underline transition-colors flex items-center gap-1"
                >
                    View All <ArrowUpRight size={14} />
                </Link>
            </div>

            {/* ── Desktop: Bento Grid ── */}
            <div className="hidden md:grid grid-cols-4 grid-rows-3 gap-3 md:gap-4" style={{ height: '560px' }}>
                {/* Large — Electronics (spans 2 cols, 2 rows) */}
                <CategoryCard
                    cat={items[0]}
                    className="col-span-2 row-span-2"
                />

                {/* Medium — Fashion */}
                <CategoryCard
                    cat={items[1]}
                    className="col-span-1 row-span-1"
                />

                {/* Medium — Home & Kitchen */}
                <CategoryCard
                    cat={items[2]}
                    className="col-span-1 row-span-1"
                />

                {/* Small — Beauty */}
                <CategoryCard
                    cat={items[3]}
                    className="col-span-1 row-span-1"
                />

                {/* Small — Sports */}
                <CategoryCard
                    cat={items[4]}
                    className="col-span-1 row-span-1"
                />

                {/* Wide — Toys (spans 2 cols) */}
                <CategoryCard
                    cat={items[6]}
                    className="col-span-2 row-span-1"
                />

                {/* Small — Books */}
                <CategoryCard
                    cat={items[5]}
                    className="col-span-1 row-span-1"
                />

                {/* Small — Grocery */}
                <CategoryCard
                    cat={items[7]}
                    className="col-span-1 row-span-1"
                />
            </div>

            {/* ── Mobile: Stacked Cards ── */}
            <div className="md:hidden space-y-3">
                {/* Top hero card */}
                <CategoryCard
                    cat={items[0]}
                    className="h-[200px]"
                />

                {/* 2×2 grid */}
                <div className="grid grid-cols-2 gap-3">
                    <CategoryCard cat={items[1]} className="h-[140px]" />
                    <CategoryCard cat={items[2]} className="h-[140px]" />
                    <CategoryCard cat={items[3]} className="h-[140px]" />
                    <CategoryCard cat={items[4]} className="h-[140px]" />
                </div>

                {/* Wide card */}
                <CategoryCard
                    cat={items[6]}
                    className="h-[140px]"
                />

                {/* Bottom row */}
                <div className="grid grid-cols-2 gap-3">
                    <CategoryCard cat={items[5]} className="h-[140px]" />
                    <CategoryCard cat={items[7]} className="h-[140px]" />
                </div>
            </div>
        </section>
    );
}
