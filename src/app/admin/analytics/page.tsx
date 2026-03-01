'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, MapPin, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface AnalyticsData {
    overview: { totalOrders: number; totalRevenue: number; todayOrders: number; todayRevenue: number; weekOrders: number; monthOrders: number; pendingOrders: number };
    dailyOrders: Array<{ _id: string; count: number; revenue: number }>;
    ordersByStatus: Array<{ _id: string; count: number }>;
    topProducts: Array<{ _id: string; totalSold: number; revenue: number }>;
    topCities: Array<{ _id: string; count: number }>;
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-gray-400 py-8 text-center">Loading analytics...</p>;
    if (!data) return <p className="text-gray-400 py-8 text-center">No data available</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h1>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Revenue', value: formatPrice(data.overview.totalRevenue), color: '#388E3C' },
                    { label: 'Total Orders', value: data.overview.totalOrders, color: '#2874F0' },
                    { label: 'This Month', value: data.overview.monthOrders, color: '#FB641B' },
                    { label: 'Pending', value: data.overview.pendingOrders, color: '#FF5722' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Orders by Status */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Package size={18} /> Orders by Status</h2>
                    <div className="space-y-2">
                        {(data.ordersByStatus || []).map(s => (
                            <div key={s._id} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-gray-600">{s._id}</span>
                                <span className="font-medium">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Cities */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={18} /> Top Cities</h2>
                    <div className="space-y-2">
                        {(data.topCities || []).map(c => (
                            <div key={c._id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{c._id || 'Unknown'}</span>
                                <span className="font-medium">{c.count} orders</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-lg p-4 shadow-sm lg:col-span-2">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Top Selling Products</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left py-2 font-medium text-gray-500">Product</th>
                                    <th className="text-left py-2 font-medium text-gray-500">Units Sold</th>
                                    <th className="text-left py-2 font-medium text-gray-500">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.topProducts || []).map(p => (
                                    <tr key={p._id} className="border-b border-gray-50">
                                        <td className="py-2 text-gray-700">{p._id}</td>
                                        <td className="py-2">{p.totalSold}</td>
                                        <td className="py-2 font-medium">{formatPrice(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
