'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ShoppingCart, Package, X, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useRouter, usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const CATEGORIES = [
    { name: 'All', slug: 'all' },
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
    { name: 'Beauty', slug: 'beauty' },
    { name: 'Toys & Baby', slug: 'toys' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Books', slug: 'books' },
    { name: 'Watches', slug: 'watches' },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const isProductPage = pathname.startsWith('/product/');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{ name: string; slug: string; image: string; price: number; category: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
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
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchExpanded(false);
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
            setSearchExpanded(false);
        }
    };

    const handleSearchExpand = () => {
        setSearchExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const renderSuggestions = () => {
        if (!showSuggestions || suggestions.length === 0) return null;
        return (
            <div className="absolute top-full left-0 right-0 bg-card border border-border shadow-lg rounded-2xl z-50 mt-2 max-h-80 overflow-auto p-1.5">
                {suggestions.map((item, i) => (
                    <Link
                        key={i}
                        href={`/product/${item.slug}`}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-xl transition-colors"
                        onClick={() => { setShowSuggestions(false); setSearchExpanded(false); }}
                    >
                        {item.image && (
                            <img src={item.image} alt="" className="w-9 h-9 object-contain rounded-lg bg-muted p-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">{item.category}</p>
                        </div>
                        <span className="text-sm font-bold text-foreground">₹{item.price?.toLocaleString('en-IN')}</span>
                    </Link>
                ))}
            </div>
        );
    };

    // Product page: minimal header
    if (isProductPage) {
        return (
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-2xl border-b border-border' : 'bg-background'}`}>
                <div className="max-w-7xl mx-auto px-3">
                    <div className="flex items-center gap-2 h-14">
                        <button
                            onClick={() => router.back()}
                            className="text-foreground p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} strokeWidth={1.8} />
                        </button>

                        <div ref={searchRef} className="flex-1 relative">
                            <form onSubmit={handleSearch} className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full h-9 pl-9 pr-4 text-sm bg-muted border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/20 placeholder:text-muted-foreground transition-all duration-200"
                                    id="product-search-input"
                                />
                            </form>
                            {renderSuggestions()}
                        </div>

                        <Link href="/cart" className="relative p-2 rounded-xl hover:bg-muted transition-colors shrink-0" id="product-cart-icon">
                            <ShoppingCart size={20} strokeWidth={1.8} className="text-foreground" />
                            {itemCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 bg-foreground text-background text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-badge-bounce">
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
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl shadow-sm shadow-black/5' : 'bg-white dark:bg-[#0A0A0A]'}`}>
                <div className="max-w-[1280px] mx-auto px-4">
                    {/* Row 1: Logo, Search, Actions */}
                    <div className="flex items-center gap-4 h-14 md:h-[68px]">
                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0 group">
                            <Logo size="sm" showTagline={false} />
                        </Link>

                        {/* Search Bar — Desktop (expandable) */}
                        <div ref={searchRef} className="flex-1 max-w-xl relative hidden md:block">
                            {searchExpanded ? (
                                <form onSubmit={handleSearch} className="relative animate-fade-in-up">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search for products, brands and more"
                                        className="w-full h-10 pl-10 pr-10 text-sm bg-muted border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/20 placeholder:text-muted-foreground transition-all duration-200"
                                        id="search-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setSearchExpanded(false); setSearchQuery(''); setShowSuggestions(false); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={16} />
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={handleSearchExpand}
                                    className="flex items-center gap-2 h-10 px-4 text-sm text-muted-foreground bg-muted border border-border rounded-xl hover:border-foreground/20 transition-all duration-200 w-full"
                                >
                                    <Search size={16} />
                                    <span>Search products...</span>
                                </button>
                            )}
                            {searchExpanded && renderSuggestions()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-auto md:ml-0 shrink-0">
                            <ThemeToggle />
                            <div className="hidden md:block"><UserMenu /></div>

                            {/* Track Order - Desktop */}
                            <Link
                                href="/track-order"
                                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
                            >
                                <Package size={16} strokeWidth={1.8} />
                                <span>Track</span>
                            </Link>

                            {/* Cart — Desktop */}
                            <Link href="/cart" className="relative hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-muted transition-colors group" id="cart-icon">
                                <ShoppingCart size={18} strokeWidth={1.8} className="text-foreground" />
                                <span className="hidden md:inline text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Cart</span>
                                {itemCount > 0 && (
                                    <span className="absolute top-0.5 left-7 bg-foreground text-background text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-badge-bounce">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>

                            {/* Mobile: Search icon */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
                                aria-label="Menu"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <line x1="4" y1="7" x2="20" y2="7" />
                                    <line x1="4" y1="12" x2="16" y2="12" />
                                    <line x1="4" y1="17" x2="12" y2="17" />
                                </svg>
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
                                placeholder="Search products..."
                                className="w-full h-9 pl-9 pr-4 text-sm bg-muted border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/20 placeholder:text-muted-foreground transition-all duration-200"
                                id="mobile-search-input"
                            />
                        </form>
                        {renderSuggestions()}
                    </div>

                    {/* Category Ribbon — Desktop */}
                    <div className="hidden md:block border-t border-border/60">
                        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
                            {CATEGORIES.map((cat) => {
                                const isActive = pathname === `/category/${cat.slug}`;
                                return (
                                    <Link
                                        key={cat.slug}
                                        href={`/category/${cat.slug}`}
                                        className={`relative px-4 py-3 text-[14px] font-medium transition-all whitespace-nowrap group ${
                                            isActive
                                                ? 'text-foreground font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {cat.name}
                                        {/* Animated underline */}
                                        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-foreground rounded-full transition-all duration-300 ease-out ${
                                            isActive ? 'w-[60%]' : 'w-0 group-hover:w-[60%]'
                                        }`} />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {
                mobileMenuOpen && typeof document !== 'undefined' && createPortal(
                    <div className="md:hidden fixed inset-0 z-[200]">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                        {/* Panel */}
                        <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-background border-l border-border animate-in slide-in-from-right duration-300 overflow-y-auto">
                            <div className="p-4 flex items-center justify-between border-b border-border">
                                <span className="text-sm font-bold text-foreground uppercase tracking-wide">Menu</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground p-2 rounded-xl hover:bg-muted hover:text-foreground transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-3 space-y-0.5">
                                {CATEGORIES.map((cat) => (
                                    <Link
                                        key={cat.slug}
                                        href={`/category/${cat.slug}`}
                                        className="flex items-center text-[15px] font-medium text-foreground/80 hover:text-foreground px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                <div className="border-t border-border my-2" />
                                <Link
                                    href="/track-order"
                                    className="flex items-center gap-3 text-[15px] font-medium text-foreground/80 hover:text-foreground px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Package size={18} strokeWidth={1.8} />
                                    Track Order
                                </Link>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
}
