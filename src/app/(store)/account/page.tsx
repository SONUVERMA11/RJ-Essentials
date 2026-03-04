'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Package, MapPin, Heart, Settings, LogOut, ChevronRight,
    Truck, Shield, Clock, HelpCircle, CreditCard, Bell,
    ShoppingBag, Star, RotateCcw, Gift
} from 'lucide-react';

interface OrderItem {
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    mrp: number;
    quantity: number;
    variant?: string;
}

interface Order {
    _id: string;
    orderId: string;
    status: string;
    total: number;
    items: OrderItem[];
    createdAt: string;
    customer: {
        name: string;
        phone: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
        };
    };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-500', label: 'Pending' },
    confirmed: { bg: 'bg-blue-500/15', text: 'text-blue-500', label: 'Confirmed' },
    shipped: { bg: 'bg-purple-500/15', text: 'text-purple-500', label: 'Shipped' },
    'out-for-delivery': { bg: 'bg-orange-500/15', text: 'text-orange-500', label: 'Out for Delivery' },
    delivered: { bg: 'bg-green-500/15', text: 'text-green-500', label: 'Delivered' },
    cancelled: { bg: 'bg-red-500/15', text: 'text-red-500', label: 'Cancelled' },
};

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses'>('overview');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user) {
            fetchOrders();
        }
    }, [session]);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/user/orders');
            const data = await res.json();
            if (res.ok) setOrders(data.orders || []);
        } catch { /* silent */ }
        setLoadingOrders(false);
    };

    // Extract unique addresses from orders
    const savedAddresses = orders.reduce((acc: Array<{ line1: string; city: string; state: string; pincode: string; name: string; phone: string }>, order) => {
        const addr = order.customer.address;
        const key = `${addr.line1}-${addr.pincode}`;
        if (!acc.find(a => `${a.line1}-${a.pincode}` === key)) {
            acc.push({ ...addr, name: order.customer.name, phone: order.customer.phone });
        }
        return acc;
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#2874F0] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) return null;

    const user = session.user;
    const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
    const recentOrders = orders.slice(0, 5);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    const quickActions = [
        { icon: Package, label: 'My Orders', color: '#2874F0', count: totalOrders, action: () => setActiveTab('orders') },
        { icon: Truck, label: 'Track Order', color: '#FB641B', href: '/track-order' },
        { icon: MapPin, label: 'Addresses', color: '#388E3C', count: savedAddresses.length, action: () => setActiveTab('addresses') },
        { icon: Heart, label: 'Wishlist', color: '#E91E63', href: '#' },
        { icon: CreditCard, label: 'Payments', color: '#9C27B0', href: '#' },
        { icon: Gift, label: 'Coupons', color: '#FF9800', href: '#' },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-24 md:pb-8">
            {/* Profile Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2874F0]/20 via-[#6C63FF]/10 to-[#9C27B0]/20" />
                <div className="relative px-4 pt-6 pb-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                            {user?.image ? (
                                <img src={user.image} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20 shadow-xl" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2874F0] to-[#6C63FF] flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/20 shadow-xl">
                                    {initial}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#388E3C] rounded-full flex items-center justify-center ring-2 ring-background">
                                <Shield size={12} className="text-white" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-foreground truncate">{user?.name || 'User'}</h1>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">{user?.email}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ShoppingBag size={12} className="text-[#2874F0]" />
                                    <span>{totalOrders} orders</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star size={12} className="text-yellow-500" />
                                    <span>{deliveredOrders} delivered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[56px] md:top-[130px] z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
                <div className="flex">
                    {[
                        { id: 'overview' as const, label: 'Overview' },
                        { id: 'orders' as const, label: 'Orders' },
                        { id: 'addresses' as const, label: 'Addresses' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-sm font-medium text-center transition-all relative ${activeTab === tab.id ? 'text-[#2874F0]' : 'text-muted-foreground'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-[#2874F0] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: Overview */}
            {activeTab === 'overview' && (
                <div className="px-4 space-y-6 pt-4">
                    {/* Quick Actions Grid */}
                    <div>
                        <h2 className="text-sm font-bold text-foreground mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {quickActions.map((action, i) => {
                                const Icon = action.icon;
                                const content = (
                                    <div key={i} className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border/30 hover:border-border transition-all active:scale-95">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                                            <Icon size={22} style={{ color: action.color }} />
                                        </div>
                                        <span className="text-xs font-medium text-foreground text-center leading-tight">{action.label}</span>
                                        {action.count !== undefined && (
                                            <span className="text-[10px] text-muted-foreground">{action.count}</span>
                                        )}
                                    </div>
                                );
                                if (action.href) return <Link key={i} href={action.href}>{content}</Link>;
                                return <button key={i} onClick={action.action}>{content}</button>;
                            })}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
                            {totalOrders > 0 && (
                                <button onClick={() => setActiveTab('orders')} className="text-xs font-medium text-[#2874F0]">
                                    View All →
                                </button>
                            )}
                        </div>
                        {loadingOrders ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-card rounded-xl border border-border/30 p-4 animate-pulse">
                                        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                                        <div className="h-3 bg-muted rounded w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : recentOrders.length > 0 ? (
                            <div className="space-y-3">
                                {recentOrders.map(order => {
                                    const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                                    return (
                                        <Link key={order._id} href="/track-order" className="block bg-card rounded-xl border border-border/30 p-4 hover:border-border transition-all active:scale-[0.99]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-[#2874F0]">{order.orderId}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                {order.items.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="w-10 h-10 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
                                                        {item.image ? (
                                                            <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                                                        )}
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground">+{order.items.length - 3} more</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-sm font-bold text-foreground">₹{order.total?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-card rounded-xl border border-border/30">
                                <Package size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No orders yet</p>
                                <Link href="/" className="text-xs text-[#2874F0] font-medium mt-1 inline-block">Start Shopping →</Link>
                            </div>
                        )}
                    </div>

                    {/* Settings Section */}
                    <div>
                        <h2 className="text-sm font-bold text-foreground mb-3">Settings</h2>
                        <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                            {[
                                { icon: Bell, label: 'Notifications', color: '#FB641B', subtitle: 'Manage alerts' },
                                { icon: HelpCircle, label: 'Help & Support', color: '#2874F0', subtitle: 'FAQs, contact us' },
                                { icon: Shield, label: 'Privacy & Security', color: '#388E3C', subtitle: 'Password, data' },
                                { icon: Settings, label: 'App Settings', color: '#9C27B0', subtitle: 'Theme, language' },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <button key={i} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}12` }}>
                                            <Icon size={18} style={{ color: item.color }} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                                            <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-muted-foreground/40" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors mb-4"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            )}

            {/* TAB: Orders */}
            {activeTab === 'orders' && (
                <div className="px-4 pt-4 space-y-3">
                    {loadingOrders ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-card rounded-xl border border-border/30 p-4 animate-pulse">
                                    <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                                    <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : orders.length > 0 ? (
                        orders.map(order => {
                            const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                            return (
                                <div key={order._id} className="bg-card rounded-xl border border-border/30 overflow-hidden">
                                    {/* Order Header */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                                        <div>
                                            <span className="text-xs font-bold text-[#2874F0]">{order.orderId}</span>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="px-4 py-3 space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-foreground truncate">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Qty: {item.quantity} {item.variant && `• ${item.variant}`}</p>
                                                </div>
                                                <span className="text-xs font-bold text-foreground">₹{item.price?.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Footer */}
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                                        <span className="text-sm font-bold text-foreground">Total: ₹{order.total?.toLocaleString('en-IN')}</span>
                                        <div className="flex gap-2">
                                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                <Link href="/track-order" className="text-xs font-bold text-[#2874F0] px-3 py-1.5 rounded-full border border-[#2874F0]/30 hover:bg-[#2874F0]/10 transition-colors">
                                                    Track
                                                </Link>
                                            )}
                                            {order.status === 'delivered' && (
                                                <span className="text-xs font-medium text-[#388E3C] flex items-center gap-1">
                                                    <RotateCcw size={12} /> Return
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16">
                            <ShoppingBag size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-foreground font-medium">No orders yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Your order history will appear here</p>
                            <Link href="/" className="mt-4 inline-block px-6 py-2.5 bg-[#2874F0] text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors">
                                Browse Products
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Addresses */}
            {activeTab === 'addresses' && (
                <div className="px-4 pt-4 space-y-3">
                    {savedAddresses.length > 0 ? (
                        savedAddresses.map((addr, i) => (
                            <div key={i} className="bg-card rounded-xl border border-border/30 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#388E3C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin size={16} className="text-[#388E3C]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{addr.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            {addr.line1}
                                            {addr.city && `, ${addr.city}`}
                                            {addr.state && `, ${addr.state}`}
                                            {addr.pincode && ` - ${addr.pincode}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock size={10} /> {addr.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <MapPin size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-foreground font-medium">No saved addresses</p>
                            <p className="text-sm text-muted-foreground mt-1">Addresses from your orders will appear here</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
