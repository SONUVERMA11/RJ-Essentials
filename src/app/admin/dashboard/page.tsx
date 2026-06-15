'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, IndianRupee, Clock, TrendingUp, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Analytics {
    overview: {
        totalOrders: number;
        pendingOrders: number;
        todayOrders: number;
        weekOrders: number;
        monthOrders: number;
        totalRevenue: number;
        todayRevenue: number;
    };
    dailyOrders: Array<{ _id: string; count: number; revenue: number }>;
    topProducts: Array<{ _id: string; totalSold: number; revenue: number }>;
    topCities: Array<{ _id: string; count: number }>;
}

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [recentOrders, setRecentOrders] = useState<Array<{
        _id: string; orderId: string; customer: { name: string; phone: string; address: { city: string } };
        total: number; status: string; createdAt: string; items: Array<{ name: string }>;
    }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/analytics').then(r => r.json()).catch(() => null),
            fetch('/api/orders?limit=10').then(r => r.json()).catch(() => ({ orders: [] })),
        ]).then(([analyticsData, ordersData]) => {
            setAnalytics(analyticsData);
            setRecentOrders(ordersData.orders || []);
            setLoading(false);
        });
    }, []);

    const stats = analytics?.overview || {
        totalOrders: 0, pendingOrders: 0, todayOrders: 0, weekOrders: 0,
        monthOrders: 0, totalRevenue: 0, todayRevenue: 0,
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-foreground text-background';
            case 'pending': return 'bg-muted text-muted-foreground';
            case 'cancelled': return 'border border-destructive text-destructive bg-transparent';
            default: return 'bg-muted text-foreground';
        }
    };

    return (
        <div className="pb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Overview of your store performance</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/products/new" className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                        <Plus size={16} strokeWidth={2} /> <span className="hidden md:inline">Add Product</span>
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/80 transition-all border border-border">
                        <Eye size={16} strokeWidth={2} /> <span className="hidden md:inline">View Orders</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                {[
                    { label: 'Today\'s Orders', value: stats.todayOrders, icon: ShoppingCart },
                    { label: 'Today\'s Revenue', value: formatPrice(stats.todayRevenue), icon: IndianRupee },
                    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock },
                    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: TrendingUp },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-card rounded-2xl p-4 md:p-5 border border-border hover:border-foreground/20 transition-all duration-200 group">
                            <div className="flex items-center justify-between mb-4">
                                <Icon size={18} strokeWidth={1.5} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{loading ? '—' : stat.value}</p>
                            <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                {[
                    { label: 'This Week', value: stats.weekOrders },
                    { label: 'This Month', value: stats.monthOrders },
                    { label: 'All Time', value: stats.totalOrders },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-2xl p-4 border border-border text-center flex flex-row md:flex-col items-center justify-between md:justify-center transition-all hover:border-foreground/20">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label} Orders</p>
                        <p className="text-xl md:text-2xl font-bold text-foreground">{loading ? '—' : s.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground tracking-tight">Recent Orders</h2>
                    <Link href="/admin/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">View All →</Link>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : recentOrders.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No orders yet</td></tr>
                            ) : (
                                recentOrders.map((order, i) => (
                                    <tr key={order._id} className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/orders/${order._id}`} className="text-foreground font-semibold hover:underline">{order.orderId}</Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-foreground">{order.customer.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{order.customer.address?.city}</p>
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground font-medium">{order.items?.length || 0} items</td>
                                        <td className="px-5 py-4 font-bold text-foreground">{formatPrice(order.total)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden flex flex-col divide-y divide-border">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No orders yet</div>
                    ) : (
                        recentOrders.map((order) => (
                            <Link href={`/admin/orders/${order._id}`} key={order._id} className="flex flex-col p-4 active:bg-muted/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-foreground text-sm tracking-tight">{order.orderId}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{order.customer.name}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wide uppercase ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                                    <p className="font-bold text-base text-foreground">{formatPrice(order.total)}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
