'use client';

import { useState } from 'react';
import { Search, Package, CheckCircle, Truck, MapPin, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrderStatus {
    orderId: string;
    status: string;
    statusHistory: Array<{ status: string; date: string; note?: string }>;
    items: Array<{ name: string; quantity: number; image: string }>;
    total: number;
    trackingNumber: string;
    createdAt: string;
}

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: CheckCircle, color: '#2874F0' },
    { key: 'confirmed', label: 'Confirmed', icon: Package, color: '#FF9800' },
    { key: 'shipped', label: 'Shipped', icon: Package, color: '#9C27B0' },
    { key: 'out-for-delivery', label: 'Out for Delivery', icon: Truck, color: '#4CAF50' },
    { key: 'delivered', label: 'Delivered', icon: MapPin, color: '#388E3C' },
];

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderStatus | null>(null);

    const handleTrack = async () => {
        if (!orderId.trim() || !phone.trim()) {
            toast.error('Please enter both Order ID and Phone Number');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/orders/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId.trim(), phone: phone.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setOrder(data);
            } else {
                toast.error(data.error || 'Order not found');
                setOrder(null);
            }
        } catch {
            toast.error('Something went wrong');
        }
        setLoading(false);
    };

    const currentIndex = order
        ? STATUS_STEPS.findIndex((s) => s.key === order.status)
        : -1;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-sm p-6 shadow-sm mb-4">
                <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Package size={24} className="text-[#2874F0]" /> Track Your Order
                </h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                            placeholder="e.g. RJE-20241201-ABCD"
                            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:border-[#2874F0] outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:border-[#2874F0] outline-none"
                        />
                    </div>
                    <button
                        onClick={handleTrack}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3 rounded-sm font-bold hover:bg-blue-600 disabled:opacity-50"
                    >
                        <Search size={18} /> {loading ? 'Tracking...' : 'Track Order'}
                    </button>
                </div>
            </div>

            {/* Order Status */}
            {order && (
                <div className="bg-white rounded-sm p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-bold text-lg text-[#2874F0]">{order.orderId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="font-bold text-lg">₹{order.total?.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    {order.status === 'cancelled' ? (
                        <div className="text-center py-6">
                            <XCircle size={48} className="mx-auto text-red-500 mb-2" />
                            <p className="text-lg font-bold text-red-600">Order Cancelled</p>
                        </div>
                    ) : (
                        <div className="space-y-0 ml-4">
                            {STATUS_STEPS.map((step, i) => {
                                const reached = i <= currentIndex;
                                const historyEntry = order.statusHistory.find((h) => h.status === step.key);
                                const Icon = step.icon;
                                return (
                                    <div key={step.key} className="flex gap-4 relative">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${reached ? 'bg-[#388E3C] text-white' : 'bg-gray-200 text-gray-400'
                                                }`}>
                                                <Icon size={16} />
                                            </div>
                                            {i < STATUS_STEPS.length - 1 && (
                                                <div className={`w-0.5 h-12 ${i < currentIndex ? 'bg-[#388E3C]' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                        <div className="pb-8">
                                            <p className={`text-sm font-medium ${reached ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                                            {historyEntry && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(historyEntry.date).toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tracking number */}
                    {order.trackingNumber && (
                        <div className="mt-4 bg-gray-50 p-3 rounded text-sm">
                            <span className="text-gray-500">Tracking Number: </span>
                            <span className="font-medium">{order.trackingNumber}</span>
                        </div>
                    )}

                    {/* Items */}
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-sm font-bold text-gray-500 mb-2">Items Ordered</p>
                        {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                                {item.image ? (
                                    <img src={item.image} alt="" className="w-10 h-10 object-contain bg-gray-50 rounded" />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-sm">📦</div>
                                )}
                                <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                                <span className="text-sm text-gray-500">×{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
