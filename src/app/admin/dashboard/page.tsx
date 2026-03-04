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
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <div className="flex gap-2">
                    <Link href="/admin/products/new" className="flex items-center gap-2 bg-[#2874F0] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                        <Plus size={16} /> Add Product
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted">
                        <Eye size={16} /> View Orders
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
                        <div key={stat.label} className="bg-card rounded-lg p-4 shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                                    <Icon size={20} style={{ color: stat.color }} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{loading ? '...' : stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'This Week', value: stats.weekOrders },
                    { label: 'This Month', value: stats.monthOrders },
                    { label: 'All Time', value: stats.totalOrders },
                ].map((s) => (
                    <div key={s.label} className="bg-card rounded-lg p-4 shadow-sm text-center">
                        <p className="text-xl font-bold text-foreground">{loading ? '...' : s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label} Orders</p>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Recent Orders</h2>
                    <Link href="/admin/orders" className="text-[#2874F0] text-sm font-medium hover:underline">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order ID</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                            ) : recentOrders.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td></tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order._id} className="border-b border-gray-50 hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/orders/${order._id}`} className="text-[#2874F0] font-medium hover:underline">{order.orderId}</Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{order.customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{order.customer.address?.city}</p>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{order.items?.length || 0} items</td>
                                        <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
