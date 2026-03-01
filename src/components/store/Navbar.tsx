'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShoppingCart, Package, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useRouter } from 'next/navigation';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const CATEGORIES = [
    'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Toys', 'Sports', 'Books', 'Grocery'
];

export default function Navbar() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{ name: string; slug: string; image: string; price: number; category: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [mounted, setMounted] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleScroll = () => setIsSticky(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                    setShowSuggestions(true);
                } catch { setSuggestions([]); }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };

    return (
        <header className={`w-full z-50 transition-shadow duration-200 ${isSticky ? 'fixed top-0 shadow-md' : 'relative'}`}>
            <nav className="bg-[#2874F0] dark:bg-[#1a1a2e]">
                <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3 md:gap-4">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0">
                            <Logo size="sm" darkBg />
                        </Link>

                        {/* Search - Desktop */}
                        <div ref={searchRef} className="flex-1 max-w-2xl hidden md:block relative">
                            <form onSubmit={handleSearch} className="flex">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search for products, brands and more"
                                        className="w-full pl-4 pr-12 py-2.5 rounded-sm text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none placeholder:text-gray-400"
                                        id="search-input"
                                    />
                                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2874F0]">
                                        <Search size={20} />
                                    </button>
                                </div>
                            </form>
                            {/* Search Suggestions */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-b-sm z-50 max-h-80 overflow-auto">
                                    {suggestions.map((item, i) => (
                                        <Link
                                            key={i}
                                            href={`/product/${item.slug}`}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                            onClick={() => setShowSuggestions(false)}
                                        >
                                            {item.image && (
                                                <img src={item.image} alt="" className="w-8 h-8 object-contain" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.category}</p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{item.price?.toLocaleString('en-IN')}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* User Menu / Login */}
                            <UserMenu />

                            {/* Track Order - Desktop */}
                            <Link
                                href="/track-order"
                                className="hidden lg:flex items-center gap-1.5 text-white text-sm font-medium hover:opacity-90 px-2 py-2"
                            >
                                <Package size={18} />
                                <span>Track Order</span>
                            </Link>

                            {/* Cart */}
                            <Link href="/cart" className="relative flex items-center gap-1.5 text-white px-2 md:px-3 py-2 hover:opacity-90" id="cart-icon">
                                <ShoppingCart size={20} />
                                <span className="hidden md:inline text-sm font-medium">Cart</span>
                                {itemCount > 0 && (
                                    <span className="absolute -top-0.5 left-5 md:left-5 bg-[#FB641B] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center pulse-badge">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>

                            {/* Mobile menu toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden text-white p-1.5"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search */}
                    <div className="md:hidden mt-2 relative" ref={searchRef}>
                        <form onSubmit={handleSearch} className="flex">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full pl-4 pr-10 py-2 rounded-sm text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2874F0]">
                                <Search size={18} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Category Bar - Desktop */}
                <div className="hidden md:block bg-[#2874F0] dark:bg-[#1a1a2e] border-t border-blue-400/30 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center gap-6 py-1.5 text-sm">
                            {CATEGORIES.map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/category/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                    className="text-white/90 hover:text-white whitespace-nowrap font-medium text-[13px] py-1 transition-colors"
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-0 bg-white dark:bg-gray-900 z-50">
                    <div className="p-4 bg-[#2874F0] dark:bg-[#1a1a2e] flex items-center justify-between">
                        <span className="text-white font-bold text-lg">Menu</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-white"><X size={24} /></button>
                    </div>
                    <div className="p-4 space-y-1">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat}
                                href={`/category/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md border-b border-gray-100 dark:border-gray-800"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {cat}
                            </Link>
                        ))}
                        <Link href="/track-order" className="block py-3 px-4 text-[#2874F0] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                            <Package size={16} className="inline mr-2" /> Track Order
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
