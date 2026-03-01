'use client';

import Link from 'next/link';
import { Smartphone, Shirt, Home, Sparkles, Gamepad2, Dumbbell, BookOpen, ShoppingBasket } from 'lucide-react';

const DEFAULT_CATEGORIES = [
    { name: 'Electronics', slug: 'electronics', icon: Smartphone, color: '#2874F0' },
    { name: 'Fashion', slug: 'fashion', icon: Shirt, color: '#FB641B' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, color: '#388E3C' },
    { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: '#E91E63' },
    { name: 'Toys', slug: 'toys', icon: Gamepad2, color: '#9C27B0' },
    { name: 'Sports', slug: 'sports', icon: Dumbbell, color: '#FF5722' },
    { name: 'Books', slug: 'books', icon: BookOpen, color: '#795548' },
    { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, color: '#4CAF50' },
];

interface CategoryRowProps {
    categories?: Array<{ name: string; slug: string; icon?: string; image?: string }>;
}

export default function CategoryRow({ categories }: CategoryRowProps) {
    const items: Array<{ name: string; slug: string; icon: typeof Smartphone; color: string; image?: string }> = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            name: cat.name,
            slug: cat.slug,
            image: cat.image,
            icon: DEFAULT_CATEGORIES[i % DEFAULT_CATEGORIES.length].icon,
            color: DEFAULT_CATEGORIES[i % DEFAULT_CATEGORIES.length].color,
        }))
        : DEFAULT_CATEGORIES;

    return (
        <div className="bg-white py-4 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide py-2">
                    {items.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.slug}
                                href={`/category/${cat.slug}`}
                                className="flex flex-col items-center gap-2 min-w-[72px] group"
                            >
                                <div
                                    className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                                    style={{ backgroundColor: `${cat.color}15` }}
                                >
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Icon size={24} style={{ color: cat.color }} />
                                    )}
                                </div>
                                <span className="text-[11px] md:text-xs text-gray-700 font-medium text-center whitespace-nowrap group-hover:text-[#2874F0] transition-colors">
                                    {cat.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
