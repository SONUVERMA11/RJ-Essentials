'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, MessageCircle, Printer, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatPrice, getWhatsAppLink, ORDER_STATUSES } from '@/lib/utils';
import { toast } from 'sonner';

interface Order {
    _id: string; orderId: string;
    customer: { name: string; phone: string; email: string; address: { line1: string; line2: string; city: string; state: string; pincode: string } };
    items: Array<{ name: string; slug: string; image: string; price: number; mrp: number; quantity: number; variant: string; meeshoLink: string }>;
    subtotal: number; discount: number; deliveryCharge: number; total: number;
    status: string; statusHistory: Array<{ status: string; date: string; note: string }>;
    trackingNumber: string; meeshoOrderId: string; adminNotes: string; createdAt: string;
}

export default function OrderDetailPage() {
    const params = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [meeshoOrderId, setMeeshoOrderId] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => {
                setOrder(data);
                setStatus(data.status);
                setTrackingNumber(data.trackingNumber || '');
                setMeeshoOrderId(data.meeshoOrderId || '');
                setAdminNotes(data.adminNotes || '');
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [params.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/orders/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, trackingNumber, meeshoOrderId, adminNotes }),
            });
            if (res.ok) {
                toast.success('Order updated');
                const updated = await res.json();
                setOrder(updated);
            }
        } catch { toast.error('Failed'); }
        setSaving(false);
    };

    if (loading) return <div className="text-center py-8 dark:text-gray-400">Loading...</div>;
    if (!order) return <div className="text-center py-8 dark:text-gray-400">Order not found</div>;

    const whatsappMsg = `Dear ${order.customer.name}, your order ${order.orderId} has been ${status}. Thank you for shopping with RJ ESSENTIALS!`;

    return (
        <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order {order.orderId}</h1>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    }`}>{order.status}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {/* Customer */}
                    <div className="bg-white dark:bg-gray-800/60 rounded-lg p-4 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700/50">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Customer Details</h2>
                        <p className="text-sm dark:text-gray-200"><strong>{order.customer.name}</strong></p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.phone}</p>
                        {order.customer.email && <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.email}</p>}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {order.customer.address.line1}{order.customer.address.line2 ? `, ${order.customer.address.line2}` : ''}<br />
                            {order.customer.address.city}, {order.customer.address.state} — {order.customer.address.pincode}
                        </p>
                        <div className="flex gap-2 mt-3">
                            <a href={getWhatsAppLink(order.customer.phone, whatsappMsg)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-[#25D366] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-600">
                                <MessageCircle size={14} /> WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-gray-800/60 rounded-lg p-4 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700/50">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Ordered Items</h2>
                        {order.items.map((item, i) => (
                            <div key={i} className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                {item.image ? <img src={item.image} alt="" className="w-14 h-14 object-contain bg-gray-50 dark:bg-gray-700/30 rounded" />
                                    : <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700/30 rounded flex items-center justify-center">📦</div>}
                                <div className="flex-1">
                                    <p className="text-sm font-medium dark:text-gray-200">{item.name}</p>
                                    {item.variant && <p className="text-xs text-gray-500 dark:text-gray-400">{item.variant}</p>}
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                    {item.meeshoLink && (
                                        <a href={item.meeshoLink} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-[#2874F0] hover:underline flex items-center gap-1 mt-1">
                                            <ExternalLink size={12} /> Meesho Link
                                        </a>
                                    )}
                                </div>
                                <span className="font-medium dark:text-gray-200">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-sm">
                            <div className="flex justify-between dark:text-gray-300"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                            <div className="flex justify-between text-[#388E3C]"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>
                            <div className="flex justify-between dark:text-gray-300"><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}</span></div>
                            <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700 dark:text-gray-100"><span>Total (COD)</span><span>{formatPrice(order.total)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800/60 rounded-lg p-4 shadow-sm dark:shadow-gray-900/30 space-y-4 dark:border dark:border-gray-700/50">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100">Update Order</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100">
                                {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking Number</label>
                            <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meesho Order ID</label>
                            <input value={meeshoOrderId} onChange={(e) => setMeeshoOrderId(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes</label>
                            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm resize-none bg-white dark:bg-gray-700/50 dark:text-gray-100" />
                        </div>
                        <button onClick={handleSave} disabled={saving}
                            className="w-full flex items-center justify-center gap-2 bg-[#2874F0] text-white py-2.5 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50">
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {/* Status History */}
                    {order.statusHistory?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800/60 rounded-lg p-4 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700/50">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Status History</h3>
                            <div className="space-y-2">
                                {order.statusHistory.map((h, i) => (
                                    <div key={i} className="text-sm border-b border-gray-100 dark:border-gray-700/50 pb-2 last:border-0">
                                        <p className="font-medium capitalize dark:text-gray-200">{h.status}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(h.date).toLocaleString('en-IN')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-400 dark:text-gray-500">Order placed: {new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
    );
}
