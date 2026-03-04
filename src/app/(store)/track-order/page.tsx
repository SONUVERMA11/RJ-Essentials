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
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2874F0]/10 flex items-center justify-center">
                    <Package size={28} className="text-[#2874F0]" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Track Your Order</h1>
                <p className="text-sm text-muted-foreground mt-2">Enter your order details to check the current status</p>
            </div>

            {/* Search Form */}
            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Order ID</label>
                    <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                        placeholder="e.g. RJE-20241201-ABCD"
                        className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/20 outline-none transition-all"
                    />
                </div>
                <button
                    onClick={handleTrack}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3.5 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                    <Search size={18} /> {loading ? 'Tracking...' : 'Track Order'}
                </button>
            </div>

            {/* Order Status */}
            {order && (
                <div className="border-t border-border pt-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Order ID</p>
                            <p className="font-bold text-lg text-[#2874F0] mt-0.5">{order.orderId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total</p>
                            <p className="font-bold text-lg text-foreground mt-0.5">₹{order.total?.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    {order.status === 'cancelled' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
                                <XCircle size={32} className="text-red-500" />
                            </div>
                            <p className="text-lg font-bold text-red-500">Order Cancelled</p>
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
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-colors ${reached ? 'bg-[#388E3C] text-white' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                <Icon size={16} />
                                            </div>
                                            {i < STATUS_STEPS.length - 1 && (
                                                <div className={`w-0.5 h-12 ${i < currentIndex ? 'bg-[#388E3C]' : 'bg-border'}`} />
                                            )}
                                        </div>
                                        <div className="pb-8">
                                            <p className={`text-sm font-medium ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                                            {historyEntry && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
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
                        <div className="mt-4 border border-border rounded-lg p-4 text-sm">
                            <span className="text-muted-foreground">Tracking Number: </span>
                            <span className="font-medium text-foreground">{order.trackingNumber}</span>
                        </div>
                    )}

                    {/* Items */}
                    <div className="mt-6 border-t border-border pt-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Items Ordered</p>
                        <div className="divide-y divide-border">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-12 h-12 object-contain bg-muted/30 rounded-lg" />
                                    ) : (
                                        <div className="w-12 h-12 bg-muted/30 rounded-lg flex items-center justify-center text-sm">📦</div>
                                    )}
                                    <span className="text-sm text-foreground flex-1">{item.name}</span>
                                    <span className="text-sm text-muted-foreground">×{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
