'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Package, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useRouter } from 'next/navigation';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import AnnouncementBar from './AnnouncementBar';

const CATEGORIES = [
    'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Toys', 'Sports', 'Books', 'Grocery'
];

export default function Navbar() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{ name: string; slug: string; image: string; price: number; category: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

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
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4">
                {/* Row 1: Logo, Search, Actions */}
                <div className="flex items-center justify-between gap-4 py-4">
                    {/* Logo Section */}
                    <div className="shrink-0">
                        <Link href="/" className="flex items-center group">
                            <Logo size="sm" />
                        </Link>
                    </div>

                    {/* Prominent Search Bar */}
                    <div ref={searchRef} className="flex-1 max-w-2xl relative hidden md:block">
                        <form onSubmit={handleSearch} className="flex bg-[#F0F5FF] dark:bg-gray-800 rounded-xl border-2 border-transparent focus-within:border-[#2874F0] focus-within:bg-white dark:focus-within:bg-gray-700 transition-all duration-300 overflow-hidden h-11">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products, brands and more"
                                className="w-full pl-5 pr-12 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none placeholder:text-gray-400 font-medium"
                                id="search-input"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2874F0] hover:scale-110 transition-transform">
                                <Search size={22} />
                            </button>
                        </form>

                        {/* Search Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-2xl rounded-b-xl z-50 mt-1 max-h-80 overflow-auto animate-in fade-in slide-in-from-top-2 p-1">
                                {suggestions.map((item, i) => (
                                    <Link
                                        key={i}
                                        href={`/product/${item.slug}`}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                        onClick={() => setShowSuggestions(false)}
                                    >
                                        {item.image && (
                                            <img src={item.image} alt="" className="w-8 h-8 object-contain rounded" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                                        </div>
                                        <span className="text-sm font-black text-[#2874F0]">₹{item.price?.toLocaleString('en-IN')}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions Segment */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <ThemeToggle />
                        <UserMenu />

                        {/* Track Order - Desktop */}
                        <Link
                            href="/track-order"
                            className="hidden lg:flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm font-bold hover:text-[#2874F0] transition-colors"
                        >
                            <Package size={18} className="text-[#2874F0]" />
                            <span>Track Order</span>
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className="relative flex items-center gap-2 group p-1" id="cart-icon">
                            <ShoppingCart size={22} className="text-[#2874F0] group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline text-sm font-bold text-gray-700 dark:text-gray-200">Cart</span>
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#FB641B] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-bounce">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {/* Mobile Search/Menu Icons */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-gray-700 dark:text-gray-200 p-2"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Row 2: Category Subnav */}
                <div className="flex items-center justify-center gap-6 py-2 pb-3 border-t border-gray-50 dark:border-gray-800 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat}
                            href={`/category/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                            className="px-3 py-1 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:text-[#2874F0] dark:hover:text-[#5a9cf5] transition-colors whitespace-nowrap"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-0 bg-white dark:bg-gray-900 z-[100] animate-in slide-in-from-right duration-300">
                    <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <Logo size="sm" />
                        <button onClick={() => setMobileMenuOpen(false)} className="text-gray-700 dark:text-gray-200"><X size={28} /></button>
                    </div>
                    <div className="p-4 space-y-4">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat}
                                href={`/category/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                className="block text-lg font-bold text-gray-700 dark:text-gray-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            <AnnouncementBar />
        </header>
    );
}
