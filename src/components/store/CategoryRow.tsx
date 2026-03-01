'use client';

import Link from 'next/link';
import {
    Smartphone, Shirt, Home, Sparkles, Gamepad2, Dumbbell,
    BookOpen, ShoppingBasket, Car, UtensilsCrossed, Sofa,
    Headphones, Watch, Baby, Palette, Wrench
} from 'lucide-react';

const ALL_CATEGORIES: Array<{ name: string; slug: string; icon: typeof Smartphone; color: string; image?: string }> = [
    { name: 'Electronics', slug: 'electronics', icon: Smartphone, color: '#2874F0' },
    { name: 'Fashion', slug: 'fashion', icon: Shirt, color: '#FB641B' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, color: '#388E3C' },
    { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: '#E91E63' },
    { name: 'Toys & Baby', slug: 'toys', icon: Baby, color: '#9C27B0' },
    { name: 'Sports', slug: 'sports', icon: Dumbbell, color: '#FF5722' },
    { name: 'Books', slug: 'books', icon: BookOpen, color: '#795548' },
    { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, color: '#4CAF50' },
    { name: 'Mobiles', slug: 'mobiles', icon: Headphones, color: '#00BCD4' },
    { name: 'Watches', slug: 'watches', icon: Watch, color: '#607D8B' },
    { name: 'Auto Acc', slug: 'auto-accessories', icon: Car, color: '#F44336' },
    { name: 'Appliances', slug: 'appliances', icon: UtensilsCrossed, color: '#FF9800' },
    { name: 'Furniture', slug: 'furniture', icon: Sofa, color: '#8D6E63' },
    { name: 'Art & Craft', slug: 'art-craft', icon: Palette, color: '#AB47BC' },
    { name: 'Gaming', slug: 'gaming', icon: Gamepad2, color: '#7C4DFF' },
    { name: 'Tools', slug: 'tools', icon: Wrench, color: '#546E7A' },
];

interface CategoryRowProps {
    categories?: Array<{ name: string; slug: string; icon?: string; image?: string }>;
}

export default function CategoryRow({ categories }: CategoryRowProps) {
    const items = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            name: cat.name,
            slug: cat.slug,
            image: cat.image,
            icon: ALL_CATEGORIES[i % ALL_CATEGORIES.length].icon,
            color: ALL_CATEGORIES[i % ALL_CATEGORIES.length].color,
        }))
        : ALL_CATEGORIES;

    return (
        <section className="max-w-7xl mx-auto px-4 py-5">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                    Shop by Category
                </h2>
                <Link
                    href="/search"
                    className="text-sm font-medium text-[#2874F0] hover:underline"
                >
                    View All →
                </Link>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                {items.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            className="category-tile group flex flex-col items-center gap-2.5 p-3 md:p-4 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        >
                            <div
                                className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                                style={{
                                    background: `linear-gradient(135deg, ${cat.color}18, ${cat.color}08)`,
                                }}
                            >
                                {cat.image && typeof cat.image === 'string' ? (
                                    <img src={cat.image} alt={cat.name} className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                                ) : (
                                    <Icon
                                        size={24}
                                        style={{ color: cat.color }}
                                        className="transition-transform duration-300 group-hover:scale-105"
                                    />
                                )}
                            </div>
                            <span className="text-[11px] md:text-xs text-gray-600 dark:text-gray-300 font-medium text-center leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                                {cat.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
