'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Order {
    _id: string; orderId: string; customer: { name: string; phone: string; address: { city: string; state: string } };
    items: Array<{ name: string }>; total: number; status: string; createdAt: string;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        const params = new URLSearchParams({ limit: '50' });
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        try {
            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            setOrders(data.orders || []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, [statusFilter]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                        placeholder="Search by Order ID, name, or phone..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:border-[#2874F0] outline-none" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="out-for-delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={fetchOrders} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200">
                    <Filter size={14} className="inline mr-1" /> Apply
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Order ID</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">City</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Items</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/orders/${order._id}`} className="text-[#2874F0] font-medium hover:underline">{order.orderId}</Link>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{order.customer.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{order.customer.phone}</td>
                                    <td className="px-4 py-3 text-gray-500">{order.customer.address?.city}</td>
                                    <td className="px-4 py-3 text-gray-500">{order.items.length}</td>
                                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-blue-100 text-blue-700'
                                            }`}>{order.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
