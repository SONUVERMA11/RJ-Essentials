'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ShoppingCart, Package, Menu, X, Smartphone, Shirt, Home, Sparkles, Baby, Dumbbell, BookOpen, ShoppingBasket, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useRouter, usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const CATEGORIES = [
    { name: 'Electronics', slug: 'electronics', icon: Smartphone, color: '#2874F0' },
    { name: 'Fashion', slug: 'fashion', icon: Shirt, color: '#FB641B' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, color: '#388E3C' },
    { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: '#E91E63' },
    { name: 'Toys', slug: 'toys', icon: Baby, color: '#9C27B0' },
    { name: 'Sports', slug: 'sports', icon: Dumbbell, color: '#FF5722' },
    { name: 'Books', slug: 'books', icon: BookOpen, color: '#795548' },
    { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, color: '#4CAF50' },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const isProductPage = pathname.startsWith('/product/');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{ name: string; slug: string; image: string; price: number; category: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const rawCount = useCartStore((s) => s.getItemCount());
    const itemCount = mounted ? rawCount : 0;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node) &&
                mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
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

    const renderSuggestions = () => {
        if (!showSuggestions || suggestions.length === 0) return null;
        return (
            <div className="absolute top-full left-0 right-0 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl z-50 mt-2 max-h-80 overflow-auto p-1.5">
                {suggestions.map((item, i) => (
                    <Link
                        key={i}
                        href={`/product/${item.slug}`}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-xl transition-colors"
                        onClick={() => setShowSuggestions(false)}
                    >
                        {item.image && (
                            <img src={item.image} alt="" className="w-9 h-9 object-contain rounded-lg bg-muted/30 p-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">{item.category}</p>
                        </div>
                        <span className="text-sm font-bold text-[#2874F0]">₹{item.price?.toLocaleString('en-IN')}</span>
                    </Link>
                ))}
            </div>
        );
    };

    // Product page: minimal header with back, search, cart
    if (isProductPage) {
        return (
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-background/95 backdrop-blur-sm'}`}>
                <div className="max-w-7xl mx-auto px-3">
                    <div className="flex items-center gap-2 h-14">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="text-foreground/70 p-2 rounded-full hover:bg-muted/50 transition-colors shrink-0"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={22} />
                        </button>

                        {/* Search Bar */}
                        <div ref={searchRef} className="flex-1 relative">
                            <form onSubmit={handleSearch} className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for products..."
                                    className="w-full h-9 pl-9 pr-4 text-sm bg-muted/60 hover:bg-muted/80 focus:bg-muted/80 border border-border/40 text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-[#2874F0]/40 placeholder:text-muted-foreground transition-all duration-200"
                                    id="product-search-input"
                                />
                            </form>
                            {renderSuggestions()}
                        </div>

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2 rounded-full hover:bg-muted/50 transition-colors shrink-0" id="product-cart-icon">
                            <ShoppingCart size={22} className="text-foreground/70" />
                            {itemCount > 0 && (
                                <span className="absolute top-0 right-0 bg-[#FB641B] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-background/95 backdrop-blur-sm'}`}>
                <div className="max-w-7xl mx-auto px-4">
                    {/* Row 1: Logo, Search, Actions */}
                    <div className="flex items-center gap-3 md:gap-5 h-12 md:h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0 group">
                            <Logo size="sm" showTagline={false} />
                        </Link>

                        {/* Search Bar — Desktop */}
                        <div ref={searchRef} className="flex-1 max-w-xl relative hidden md:block">
                            <form onSubmit={handleSearch} className="relative">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for products, brands and more"
                                    className="w-full h-10 pl-10 pr-4 text-sm bg-muted/60 hover:bg-muted/80 focus:bg-muted/80 border border-border/40 text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-[#2874F0]/40 placeholder:text-muted-foreground transition-all duration-200"
                                    id="search-input"
                                />
                            </form>
                            {renderSuggestions()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
                            <ThemeToggle />
                            <UserMenu />

                            {/* Track Order - Desktop */}
                            <Link
                                href="/track-order"
                                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
                            >
                                <Package size={16} />
                                <span>Track</span>
                            </Link>

                            {/* Cart */}
                            <Link href="/cart" className="relative flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-muted/50 transition-colors group" id="cart-icon">
                                <ShoppingCart size={20} className="text-foreground/70 group-hover:text-foreground transition-colors" />
                                <span className="hidden md:inline text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Cart</span>
                                {itemCount > 0 && (
                                    <span className="absolute top-0.5 left-5 md:left-auto md:-top-0.5 md:right-0 bg-[#FB641B] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>

                            {/* Mobile Menu */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden text-foreground/70 p-2 rounded-full hover:bg-muted/50 transition-colors"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search */}
                    <div ref={mobileSearchRef} className="md:hidden pb-2 relative">
                        <form onSubmit={handleSearch} className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full h-8 pl-9 pr-4 text-sm bg-muted/60 border border-border/40 text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-[#2874F0]/40 placeholder:text-muted-foreground transition-all duration-200"
                                id="mobile-search-input"
                            />
                        </form>
                        {renderSuggestions()}
                    </div>

                    {/* Category Nav */}
                    <div className="hidden md:flex items-center gap-0.5 pb-2 overflow-x-auto scrollbar-hide -mx-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <Link
                                    key={cat.slug}
                                    href={`/category/${cat.slug}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-muted-foreground/70 hover:text-foreground rounded-full transition-all whitespace-nowrap group hover:bg-muted/40"
                                >
                                    <Icon size={13} style={{ color: cat.color }} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </header>

            {/* Mobile Menu Overlay — rendered via portal to escape header containment */}
            {
                mobileMenuOpen && typeof document !== 'undefined' && createPortal(
                    <div className="md:hidden fixed inset-0 top-0 z-[200] animate-in slide-in-from-right duration-300 bg-white dark:bg-black overflow-y-auto">
                        <div className="p-4 flex items-center justify-between border-b border-border/50">
                            <Logo size="sm" showTagline={false} />
                            <button onClick={() => setMobileMenuOpen(false)} className="text-foreground/70 p-2 rounded-full hover:bg-muted/50">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <Link
                                        key={cat.slug}
                                        href={`/category/${cat.slug}`}
                                        className="flex items-center gap-3 text-base font-medium text-foreground/80 hover:text-foreground px-3 py-3 rounded-xl hover:bg-muted/40 transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                                            <Icon size={16} style={{ color: cat.color }} />
                                        </div>
                                        {cat.name}
                                    </Link>
                                );
                            })}
                            <div className="border-t border-border/50 my-3" />
                            <Link
                                href="/track-order"
                                className="flex items-center gap-3 text-base font-medium text-foreground/80 hover:text-foreground px-3 py-3 rounded-xl hover:bg-muted/40 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2874F0]/10">
                                    <Package size={16} className="text-[#2874F0]" />
                                </div>
                                Track Order
                            </Link>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
}
