'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingCart, IndianRupee, Clock, TrendingUp, Plus, Eye, BarChart3 } from 'lucide-react';
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

    return (
        <div className="pb-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <div className="flex gap-2.5">
                    <Link href="/admin/products/new" className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm">
                        <Plus size={18} /> <span className="hidden md:inline">Add Product</span>
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-muted/80 transition-all">
                        <Eye size={18} /> <span className="hidden md:inline">View Orders</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Today\'s Orders', value: stats.todayOrders, icon: ShoppingCart, color: '#2874F0', bg: '#EBF0FF' },
                    { label: 'Today\'s Revenue', value: formatPrice(stats.todayRevenue), icon: IndianRupee, color: '#388E3C', bg: '#E8F5E9' },
                    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: '#FB641B', bg: '#FFF3E0' },
                    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: '#9C27B0', bg: '#F3E5F5' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-card/80 backdrop-blur-xl rounded-[24px] p-4 md:p-5 shadow-sm border border-border/50 transition-all hover:scale-[1.02]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                                    <Icon size={24} style={{ color: stat.color }} strokeWidth={2} />
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{loading ? '...' : stat.value}</p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
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
                    <div key={s.label} className="bg-card/80 backdrop-blur-xl rounded-[20px] p-4 shadow-sm border border-border/50 text-center flex flex-row md:flex-col items-center justify-between md:justify-center transition-all hover:bg-muted/20">
                        <p className="text-sm font-semibold text-muted-foreground">{s.label} Orders</p>
                        <p className="text-xl md:text-2xl font-bold text-foreground">{loading ? '...' : s.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-card/80 backdrop-blur-xl rounded-[24px] shadow-sm border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Orders</h2>
                    <Link href="/admin/orders" className="text-[#2874F0] text-sm font-semibold hover:underline">View All</Link>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Order ID</th>
                                <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Customer</th>
                                <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Items</th>
                                <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Total</th>
                                <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Status</th>
                                <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : recentOrders.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No orders yet</td></tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order._id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/orders/${order._id}`} className="text-[#2874F0] font-semibold hover:underline">{order.orderId}</Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-foreground">{order.customer.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{order.customer.address?.city}</p>
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground font-medium">{order.items?.length || 0} items</td>
                                        <td className="px-5 py-4 font-bold">{formatPrice(order.total)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                }`}>
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
                <div className="md:hidden flex flex-col divide-y divide-border/50">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No orders yet</div>
                    ) : (
                        recentOrders.map((order) => (
                            <Link href={`/admin/orders/${order._id}`} key={order._id} className="flex flex-col p-5 active:bg-muted/30 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-foreground text-sm tracking-tight">{order.orderId}</p>
                                        <p className="text-sm font-medium text-muted-foreground mt-0.5">{order.customer.name}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <p className="text-xs font-medium text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
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
