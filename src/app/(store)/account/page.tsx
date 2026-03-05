'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
    Package, MapPin, Heart, Settings, LogOut, ChevronRight, ChevronDown,
    Truck, Shield, Clock, HelpCircle, CreditCard, Bell,
    ShoppingBag, Star, RotateCcw, Gift, ArrowLeft, Moon, Sun,
    Mail, Phone, MessageCircle, Lock, Trash2, Globe, Info, X
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

type TabType = 'overview' | 'orders' | 'addresses' | 'notifications' | 'help' | 'privacy' | 'settings';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-500', label: 'Pending' },
    confirmed: { bg: 'bg-blue-500/15', text: 'text-blue-500', label: 'Confirmed' },
    shipped: { bg: 'bg-purple-500/15', text: 'text-purple-500', label: 'Shipped' },
    'out-for-delivery': { bg: 'bg-orange-500/15', text: 'text-orange-500', label: 'Out for Delivery' },
    delivered: { bg: 'bg-green-500/15', text: 'text-green-500', label: 'Delivered' },
    cancelled: { bg: 'bg-red-500/15', text: 'text-red-500', label: 'Cancelled' },
};

const FAQ_ITEMS = [
    {
        q: 'How do I return a product?',
        a: 'You can request a return within 7 days of delivery by going to your Orders tab, selecting the order, and clicking "Return". Our team will arrange pickup from your address.'
    },
    {
        q: 'When will I get my refund?',
        a: 'Refunds are processed within 5-7 business days after the returned product is received and inspected. The amount will be credited to your original payment method.'
    },
    {
        q: 'What payment methods are accepted?',
        a: 'We accept UPI, Credit/Debit Cards, Net Banking, Wallets (Paytm, PhonePe), and Cash on Delivery (COD) for orders up to ₹5,000.'
    },
    {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 3-7 business days depending on your location. Metro cities usually receive orders within 3-4 days. You can track your order in real-time from the Orders tab.'
    },
    {
        q: 'Can I change my delivery address after ordering?',
        a: 'You can change the delivery address before the order is shipped. Go to your Orders, select the order, and contact our support team to request an address change.'
    },
    {
        q: 'How do I cancel an order?',
        a: 'Orders can be cancelled before shipping. Go to your Orders tab, click on the order you wish to cancel, and select "Cancel Order". Refunds for prepaid orders will be processed within 5-7 business days.'
    },
];

function AccountPageContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    const validTabs: TabType[] = ['overview', 'orders', 'addresses', 'notifications', 'help', 'privacy', 'settings'];
    const initialTab = validTabs.includes(searchParams.get('tab') as TabType)
        ? (searchParams.get('tab') as TabType)
        : 'overview';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    // Notification preferences (persisted in localStorage)
    const [notifPrefs, setNotifPrefs] = useState({
        orderUpdates: true,
        promotionalOffers: true,
        priceAlerts: false,
        deliveryUpdates: true,
    });

    // FAQ accordion
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    // Load notification preferences from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('rj_notif_prefs');
            if (saved) setNotifPrefs(JSON.parse(saved));
        } catch { /* silent */ }
    }, []);

    const updateNotifPref = (key: keyof typeof notifPrefs) => {
        const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
        setNotifPrefs(updated);
        localStorage.setItem('rj_notif_prefs', JSON.stringify(updated));
    };

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

    // Is it a settings sub-tab?
    const isSettingsTab = ['notifications', 'help', 'privacy', 'settings'].includes(activeTab);
    const mainTabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'orders', label: 'Orders' },
        { id: 'addresses', label: 'Addresses' },
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

            {/* Tabs — show back button for settings tabs */}
            {isSettingsTab ? (
                <div className="sticky top-[56px] md:top-[130px] z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <button onClick={() => setActiveTab('overview')} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                            <ArrowLeft size={20} className="text-foreground" />
                        </button>
                        <h2 className="text-sm font-bold text-foreground">
                            {activeTab === 'notifications' && 'Notifications'}
                            {activeTab === 'help' && 'Help & Support'}
                            {activeTab === 'privacy' && 'Privacy & Security'}
                            {activeTab === 'settings' && 'App Settings'}
                        </h2>
                    </div>
                </div>
            ) : (
                <div className="sticky top-[56px] md:top-[130px] z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
                    <div className="flex">
                        {mainTabs.map(tab => (
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
            )}

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
                                        <Link key={order._id} href={`/track-order?orderId=${order.orderId}`} className="block bg-card rounded-xl border border-border/30 p-4 hover:border-border transition-all active:scale-[0.99]">
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
                                { icon: Bell, label: 'Notifications', color: '#FB641B', subtitle: 'Manage alerts', tab: 'notifications' as TabType },
                                { icon: HelpCircle, label: 'Help & Support', color: '#2874F0', subtitle: 'FAQs, contact us', tab: 'help' as TabType },
                                { icon: Shield, label: 'Privacy & Security', color: '#388E3C', subtitle: 'Password, data', tab: 'privacy' as TabType },
                                { icon: Settings, label: 'App Settings', color: '#9C27B0', subtitle: 'Theme, language', tab: 'settings' as TabType },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <button key={i} onClick={() => setActiveTab(item.tab)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
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
                                                <Link href={`/track-order?orderId=${order.orderId}`} className="text-xs font-bold text-[#2874F0] px-3 py-1.5 rounded-full border border-[#2874F0]/30 hover:bg-[#2874F0]/10 transition-colors">
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

            {/* TAB: Notifications */}
            {activeTab === 'notifications' && (
                <div className="px-4 pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">Choose which notifications you&apos;d like to receive.</p>

                    <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                        {[
                            { key: 'orderUpdates' as const, icon: Package, label: 'Order Updates', desc: 'Get notified about order status changes', color: '#2874F0' },
                            { key: 'deliveryUpdates' as const, icon: Truck, label: 'Delivery Updates', desc: 'Real-time delivery tracking alerts', color: '#388E3C' },
                            { key: 'promotionalOffers' as const, icon: Gift, label: 'Promotional Offers', desc: 'Discounts, deals, and exclusive offers', color: '#FB641B' },
                            { key: 'priceAlerts' as const, icon: Bell, label: 'Price Drop Alerts', desc: 'Get alerted when wishlist items drop in price', color: '#9C27B0' },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.key} className="flex items-center gap-3 px-4 py-4">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}12` }}>
                                        <Icon size={18} style={{ color: item.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotifPref(item.key)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifPrefs[item.key] ? 'bg-[#388E3C]' : 'bg-muted'}`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-[#2874F0]/5 rounded-xl p-4 border border-[#2874F0]/10">
                        <div className="flex items-start gap-3">
                            <Info size={16} className="text-[#2874F0] mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Notification preferences are saved locally on this device. Order and delivery updates are also sent via SMS and email regardless of these settings.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Help & Support */}
            {activeTab === 'help' && (
                <div className="px-4 pt-4 space-y-6">
                    {/* Contact Options */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Contact Us</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: Phone, label: 'Call Us', detail: '+91 99999 00000', color: '#388E3C', href: 'tel:+919999900000' },
                                { icon: Mail, label: 'Email', detail: 'support@rj.in', color: '#2874F0', href: 'mailto:support@rjessentials.in' },
                                { icon: MessageCircle, label: 'WhatsApp', detail: 'Chat now', color: '#25D366', href: 'https://wa.me/919999900000' },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border/30 hover:border-border transition-all active:scale-95">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                                            <Icon size={20} style={{ color: item.color }} />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">{item.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Frequently Asked Questions</h3>
                        <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                            {FAQ_ITEMS.map((faq, i) => (
                                <div key={i}>
                                    <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{faq.q}</p>
                                        </div>
                                        <ChevronDown size={16} className={`text-muted-foreground/50 transition-transform duration-200 flex-shrink-0 ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openFaqIndex === i && (
                                        <div className="px-4 pb-4">
                                            <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Hours */}
                    <div className="bg-card rounded-xl border border-border/30 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FF9800]/10 flex items-center justify-center flex-shrink-0">
                                <Clock size={18} className="text-[#FF9800]" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Support Hours</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Monday - Saturday, 9:00 AM - 7:00 PM IST</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Privacy & Security */}
            {activeTab === 'privacy' && (
                <div className="px-4 pt-4 space-y-4">
                    {/* Security Overview */}
                    <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                        <div className="flex items-center gap-3 px-4 py-4">
                            <div className="w-9 h-9 rounded-full bg-[#388E3C]/10 flex items-center justify-center flex-shrink-0">
                                <Lock size={18} className="text-[#388E3C]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">Change Password</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Update your account password</p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground/40" />
                        </div>
                        <div className="flex items-center gap-3 px-4 py-4">
                            <div className="w-9 h-9 rounded-full bg-[#2874F0]/10 flex items-center justify-center flex-shrink-0">
                                <Shield size={18} className="text-[#2874F0]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Add an extra layer of security</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500">Coming Soon</span>
                        </div>
                    </div>

                    {/* Data & Privacy */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Data & Privacy</h3>
                        <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                            <div className="flex items-center gap-3 px-4 py-4">
                                <div className="w-9 h-9 rounded-full bg-[#9C27B0]/10 flex items-center justify-center flex-shrink-0">
                                    <Package size={18} className="text-[#9C27B0]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">Download My Data</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Get a copy of your personal data</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/40" />
                            </div>
                            <Link href="/privacy-policy" className="flex items-center gap-3 px-4 py-4 hover:bg-muted/20 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-[#FB641B]/10 flex items-center justify-center flex-shrink-0">
                                    <Info size={18} className="text-[#FB641B]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Read how we handle your data</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/40" />
                            </Link>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div>
                        <h3 className="text-sm font-bold text-red-500 mb-3">Danger Zone</h3>
                        <div className="bg-card rounded-xl border border-red-500/20">
                            <button className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-500/5 transition-colors rounded-xl">
                                <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <Trash2 size={18} className="text-red-500" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-red-500">Delete Account</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Permanently delete your account and all data</p>
                                </div>
                                <ChevronRight size={16} className="text-red-500/40" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: App Settings */}
            {activeTab === 'settings' && (
                <div className="px-4 pt-4 space-y-4">
                    {/* Appearance */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Appearance</h3>
                        <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                            <div className="flex items-center gap-3 px-4 py-4">
                                <div className="w-9 h-9 rounded-full bg-[#9C27B0]/10 flex items-center justify-center flex-shrink-0">
                                    <Moon size={18} className="text-[#9C27B0]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">Theme</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Toggle between light and dark mode</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const root = document.documentElement;
                                        const isDark = root.classList.contains('dark');
                                        root.classList.toggle('dark');
                                        localStorage.setItem('theme', isDark ? 'light' : 'dark');
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
                                >
                                    <Sun size={14} className="text-yellow-500" />
                                    <span>/</span>
                                    <Moon size={14} className="text-[#9C27B0]" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-4">
                                <div className="w-9 h-9 rounded-full bg-[#2874F0]/10 flex items-center justify-center flex-shrink-0">
                                    <Globe size={18} className="text-[#2874F0]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">Language</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Choose your preferred language</p>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted/50">English</span>
                            </div>
                        </div>
                    </div>

                    {/* Storage & Cache */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Storage</h3>
                        <div className="bg-card rounded-xl border border-border/30">
                            <button
                                onClick={() => {
                                    if (typeof window !== 'undefined' && 'caches' in window) {
                                        caches.keys().then(names => {
                                            names.forEach(name => caches.delete(name));
                                        });
                                    }
                                    localStorage.removeItem('rj_notif_prefs');
                                    window.location.reload();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/20 transition-colors rounded-xl"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#FB641B]/10 flex items-center justify-center flex-shrink-0">
                                    <Trash2 size={18} className="text-[#FB641B]" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground">Clear Cache</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Clear cached data and reload the app</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/40" />
                            </button>
                        </div>
                    </div>

                    {/* About */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">About</h3>
                        <div className="bg-card rounded-xl border border-border/30 divide-y divide-border/30">
                            <div className="flex items-center gap-3 px-4 py-4">
                                <div className="w-9 h-9 rounded-full bg-[#388E3C]/10 flex items-center justify-center flex-shrink-0">
                                    <Info size={18} className="text-[#388E3C]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">App Version</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">v1.0.0</p>
                                </div>
                            </div>
                            <Link href="/terms" className="flex items-center gap-3 px-4 py-4 hover:bg-muted/20 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-[#FF9800]/10 flex items-center justify-center flex-shrink-0">
                                    <Info size={18} className="text-[#FF9800]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">Terms of Service</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/40" />
                            </Link>
                            <Link href="/privacy-policy" className="flex items-center gap-3 px-4 py-4 hover:bg-muted/20 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-[#E91E63]/10 flex items-center justify-center flex-shrink-0">
                                    <Shield size={18} className="text-[#E91E63]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/40" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-3 border-[#2874F0] border-t-transparent rounded-full animate-spin" /></div>}>
            <AccountPageContent />
        </Suspense>
    );
}
