'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NextImage from 'next/image';
import {
    LayoutDashboard, Package, FolderOpen, ShoppingCart, Image, Layers, Star,
    MessageSquare, FileText, Settings, BarChart3, Search, LogOut, ChevronLeft, Menu
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

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

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-[#2874F0] text-white p-2 rounded-md shadow-md"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg width={collapsed ? 28 : 32} height={collapsed ? 28 : 32} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                            <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                            <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                            <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                            <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                            <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                        </svg>
                        {!collapsed && (
                            <div>
                                <h2 className="font-bold text-[#2874F0] text-sm">RJ ESSENTIALS</h2>
                                <p className="text-[10px] text-gray-400">Admin Panel</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100%-120px)]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${isActive
                                    ? 'bg-[#2874F0] text-white font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon size={18} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-200">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 mb-1" target="_blank">
                        {!collapsed && <span>View Store</span>}
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50"
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
