'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Package, FolderOpen, ShoppingCart, Image, Layers, Star,
    MessageSquare, FileText, Settings, BarChart3, Search, LogOut, ChevronLeft, Menu, Sun, Moon, ExternalLink
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTheme } from 'next-themes';

const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/banners', label: 'Banners', icon: Image },
    { href: '/admin/sections', label: 'Sections', icon: Layers },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/pages', label: 'Pages', icon: FileText },
    { href: '/admin/seo', label: 'SEO', icon: Search },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-foreground text-background p-2 rounded-xl shadow-md"
            >
                <Menu size={18} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Monochrome Logo */}
                        <svg width={collapsed ? 24 : 28} height={collapsed ? 24 : 28} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                            <rect width="120" height="120" rx="24" className="fill-foreground" />
                            <text x="60" y="68" textAnchor="middle" fontFamily="'Inter', 'Arial', sans-serif" fontWeight="800" fontSize="52" className="fill-background" letterSpacing="-3">RJ</text>
                        </svg>
                        {!collapsed && (
                            <div>
                                <h2 className="font-bold text-foreground text-sm tracking-tight">RJ ESSENTIALS</h2>
                                <p className="text-[10px] text-muted-foreground font-medium">Admin Panel</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                    >
                        <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100%-160px)]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${isActive
                                    ? 'bg-foreground text-background font-semibold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon size={17} strokeWidth={isActive ? 2 : 1.6} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border space-y-0.5">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
                        {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" target="_blank">
                        <ExternalLink size={17} strokeWidth={1.6} />
                        {!collapsed && <span>View Store</span>}
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut size={17} strokeWidth={1.6} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
