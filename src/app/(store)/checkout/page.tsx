'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MapPin, Package, CreditCard, ArrowRight, ArrowLeft, Shield, LogIn, Plus, Check, Home, Briefcase, MapPinned } from 'lucide-react';
import Link from 'next/link';
import LoginModal from '@/components/store/LoginModal';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
];

interface SavedAddress {
    _id: string;
    label: string;
    name: string;
    phone: string;
    email?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

const LABEL_ICONS: Record<string, typeof Home> = {
    Home: Home,
    Office: Briefcase,
    Other: MapPinned,
};

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { items, getSubtotal, getMrpTotal, getDiscount, getItemCount, clearCart } = useCartStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Saved addresses
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [saveNewAddress, setSaveNewAddress] = useState(true);
    const [addressLabel, setAddressLabel] = useState('Home');

    const [address, setAddress] = useState({
        name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '',
    });

    const subtotal = getSubtotal();
    const deliveryCharge = subtotal >= 499 ? 0 : 49;
    const total = subtotal + deliveryCharge;

    // Fetch saved addresses on mount
    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/user/addresses')
                .then((res) => res.json())
                .then((data) => {
                    const addrs = data.addresses || [];
                    setSavedAddresses(addrs);
                    if (addrs.length > 0) {
                        const defaultAddr = addrs.find((a: SavedAddress) => a.isDefault) || addrs[0];
                        setSelectedAddressId(defaultAddr._id);
                        setUseNewAddress(false);
                    } else {
                        setUseNewAddress(true);
                    }
                })
                .catch(() => {
                    setUseNewAddress(true);
                })
                .finally(() => setLoadingAddresses(false));
        } else {
            setLoadingAddresses(false);
        }
    }, [status]);

    // Show login modal if not authenticated
    if (status === 'loading') {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="w-8 h-8 border-2 border-muted border-t-[#2874F0] rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-card rounded-lg p-8 shadow-sm border border-border text-center space-y-4">
                    <LogIn size={48} className="mx-auto text-[#2874F0]" />
                    <h2 className="text-xl font-bold text-foreground">Sign in to Continue</h2>
                    <p className="text-muted-foreground">Please sign in or create an account to place your order.</p>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="inline-flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                    >
                        <LogIn size={18} /> Sign In / Create Account
                    </button>
                    <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} callbackMessage="Sign in to place your order" />
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="bg-card rounded-lg p-12 shadow-sm border border-border">
                    <p className="text-muted-foreground mb-4">Your cart is empty</p>
                    <Link href="/" className="text-[#2874F0] font-medium hover:underline">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    // Get the active address (either selected saved address or manually entered)
    const getActiveAddress = () => {
        if (!useNewAddress && selectedAddressId) {
            const saved = savedAddresses.find((a) => a._id === selectedAddressId);
            if (saved) {
                return {
                    name: saved.name,
                    phone: saved.phone,
                    email: saved.email || '',
                    line1: saved.line1,
                    line2: saved.line2 || '',
                    city: saved.city,
                    state: saved.state,
                    pincode: saved.pincode,
                };
            }
        }
        return address;
    };

    const validateAddress = () => {
        const addr = getActiveAddress();
        const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode'] as const;
        for (const field of required) {
            if (!addr[field].trim()) {
                toast.error(`Please fill in ${field === 'line1' ? 'Address Line 1' : field}`);
                return false;
            }
        }
        if (addr.phone.length !== 10) {
            toast.error('Phone number must be 10 digits');
            return false;
        }
        if (addr.pincode.length !== 6) {
            toast.error('Pincode must be 6 digits');
            return false;
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        const activeAddress = getActiveAddress();
        try {
            // Save address if user opted in
            if (useNewAddress && saveNewAddress) {
                fetch('/api/user/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        label: addressLabel,
                        ...activeAddress,
                    }),
                }).catch(() => { /* non-blocking */ });
            }

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: {
                        name: activeAddress.name,
                        phone: activeAddress.phone,
                        email: activeAddress.email || session?.user?.email || '',
                        address: {
                            line1: activeAddress.line1, line2: activeAddress.line2,
                            city: activeAddress.city, state: activeAddress.state, pincode: activeAddress.pincode,
                        },
                    },
                    items: items.map((i) => ({
                        productId: i.productId, name: i.name, slug: i.slug,
                        image: i.image, price: i.price, mrp: i.mrp,
                        quantity: i.quantity, variant: i.variant, meeshoLink: i.meeshoLink,
                    })),
                    subtotal: getMrpTotal(),
                    discount: getDiscount(),
                    deliveryCharge,
                    total,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                clearCart();
                router.push(`/order-success?orderId=${data.orderId}`);
            } else {
                toast.error(data.error || 'Failed to place order');
            }
        } catch {
            toast.error('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const inputClass = "w-full border border-border bg-background text-foreground rounded-lg px-3 py-2.5 text-sm focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]/30 outline-none transition-colors";

    const activeAddress = getActiveAddress();

    return (
        <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Logged in as */}
            <div className="bg-[#2874F0]/10 border border-[#2874F0]/20 rounded-lg p-3 mb-4 flex items-center justify-between">
                <p className="text-sm text-foreground">
                    Logged in as <span className="font-semibold text-[#2874F0]">{session?.user?.name || session?.user?.email}</span>
                </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm mb-4">
                <div className="flex items-center justify-center gap-2 md:gap-8">
                    {[
                        { num: 1, label: 'Address', icon: MapPin },
                        { num: 2, label: 'Summary', icon: Package },
                        { num: 3, label: 'Payment', icon: CreditCard },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.num ? 'bg-[#2874F0] text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                {s.num}
                            </div>
                            <span className={`text-sm hidden md:inline ${step >= s.num ? 'text-[#2874F0] font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
                            {i < 2 && <div className={`w-16 md:w-24 h-0.5 ${step > s.num ? 'bg-[#2874F0]' : 'bg-muted'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Address */}
            {step === 1 && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-[#2874F0]" /> Delivery Address
                    </h2>

                    {/* Saved Addresses */}
                    {loadingAddresses ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="w-6 h-6 border-2 border-muted border-t-[#2874F0] rounded-full animate-spin" />
                        </div>
                    ) : savedAddresses.length > 0 && (
                        <div className="mb-5">
                            <p className="text-sm font-medium text-muted-foreground mb-3">Saved Addresses</p>
                            <div className="space-y-2.5">
                                {savedAddresses.map((addr) => {
                                    const isSelected = !useNewAddress && selectedAddressId === addr._id;
                                    const LabelIcon = LABEL_ICONS[addr.label] || MapPinned;
                                    return (
                                        <button
                                            key={addr._id}
                                            onClick={() => {
                                                setSelectedAddressId(addr._id);
                                                setUseNewAddress(false);
                                            }}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                ? 'border-[#2874F0] bg-[#2874F0]/5 shadow-sm'
                                                : 'border-border hover:border-[#2874F0]/40 hover:bg-muted/30'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${isSelected ? 'border-[#2874F0]' : 'border-muted-foreground/40'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#2874F0]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <LabelIcon size={14} className="text-[#2874F0]" />
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#2874F0]">{addr.label}</span>
                                                        {addr.isDefault && (
                                                            <span className="text-[10px] font-bold uppercase bg-[#388E3C]/15 text-[#388E3C] px-1.5 py-0.5 rounded">Default</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-foreground">{addr.name} <span className="font-normal text-muted-foreground">— {addr.phone}</span></p>
                                                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}</p>
                                                </div>
                                                {isSelected && <Check size={18} className="text-[#2874F0] mt-1 shrink-0" />}
                                            </div>
                                        </button>
                                    );
                                })}

                                {/* Use a new address button */}
                                <button
                                    onClick={() => setUseNewAddress(true)}
                                    className={`w-full text-left p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${useNewAddress
                                        ? 'border-[#2874F0] bg-[#2874F0]/5'
                                        : 'border-border hover:border-[#2874F0]/40 hover:bg-muted/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${useNewAddress ? 'border-[#2874F0]' : 'border-muted-foreground/40'}`}>
                                            {useNewAddress && <div className="w-2.5 h-2.5 rounded-full bg-[#2874F0]" />}
                                        </div>
                                        <Plus size={16} className="text-[#2874F0]" />
                                        <span className="text-sm font-medium text-foreground">Add a new address</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New Address Form */}
                    {(useNewAddress || savedAddresses.length === 0) && (
                        <div>
                            {savedAddresses.length > 0 && (
                                <div className="border-t border-border pt-5 mt-2">
                                    <p className="text-sm font-medium text-muted-foreground mb-3">New Address</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                                    <input type="text" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                        className={inputClass} placeholder="Enter full name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                                    <input type="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        className={inputClass} placeholder="10-digit mobile number" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1">Email (Optional)</label>
                                    <input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })}
                                        className={inputClass} placeholder="For order updates" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1">Address Line 1 *</label>
                                    <input type="text" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                                        className={inputClass} placeholder="House No., Building, Street" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
                                    <input type="text" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                                        className={inputClass} placeholder="Area, Landmark" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                                    <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className={inputClass} placeholder="City" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                                    <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className={inputClass}>
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
                                    <input type="text" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                        className={inputClass} placeholder="6-digit pincode" />
                                </div>
                            </div>

                            {/* Save address checkbox & label */}
                            <div className="mt-5 pt-4 border-t border-border/50">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={saveNewAddress}
                                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-[#2874F0] focus:ring-[#2874F0]/30 accent-[#2874F0]"
                                    />
                                    <span className="text-sm text-foreground group-hover:text-[#2874F0] transition-colors">Save this address for future orders</span>
                                </label>
                                {saveNewAddress && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Label:</span>
                                        {['Home', 'Office', 'Other'].map((lbl) => (
                                            <button
                                                key={lbl}
                                                onClick={() => setAddressLabel(lbl)}
                                                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${addressLabel === lbl
                                                    ? 'bg-[#2874F0] text-white'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                {lbl}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => validateAddress() && setStep(2)}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
                    >
                        Continue <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* Step 2: Summary */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>
                            <button onClick={() => setStep(1)} className="text-[#2874F0] text-sm font-medium">Edit Address</button>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm text-foreground">
                            <p className="font-medium">{activeAddress.name} — {activeAddress.phone}</p>
                            <p className="text-muted-foreground">{activeAddress.line1}{activeAddress.line2 ? `, ${activeAddress.line2}` : ''}</p>
                            <p className="text-muted-foreground">{activeAddress.city}, {activeAddress.state} — {activeAddress.pincode}</p>
                        </div>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.variant}`} className="flex gap-3 py-2 border-b border-border last:border-0">
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-14 h-14 object-contain bg-muted rounded-lg" />
                                    ) : (
                                        <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">📦</div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm text-foreground font-medium line-clamp-2">{item.name}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3">Price Details</h3>
                        <div className="space-y-2 text-sm text-foreground">
                            <div className="flex justify-between"><span>Price ({getItemCount()} items)</span><span>{formatPrice(getMrpTotal())}</span></div>
                            <div className="flex justify-between"><span>Discount</span><span className="text-[#388E3C]">-{formatPrice(getDiscount())}</span></div>
                            <div className="flex justify-between"><span>Delivery</span><span className={deliveryCharge === 0 ? 'text-[#388E3C]' : ''}>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span></div>
                            <div className="flex justify-between font-bold text-base pt-2 border-t border-dashed border-border"><span>Total</span><span>{formatPrice(total)}</span></div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 border-2 border-border text-foreground py-3 rounded-lg font-bold hover:bg-muted/50 transition-colors">
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors">
                            Continue <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-[#2874F0]" /> Payment Method
                        </h2>
                        <div className="border-2 border-[#2874F0] rounded-lg p-4 bg-[#2874F0]/10">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-[#2874F0] flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-[#2874F0]" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Cash on Delivery (COD)</p>
                                    <p className="text-sm text-muted-foreground">Pay {formatPrice(total)} when your order arrives</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield size={16} className="text-[#388E3C]" />
                            Safe and secure. No online payment needed.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 border-2 border-border text-foreground py-3 rounded-lg font-bold hover:bg-muted/50 transition-colors">
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3.5 rounded-lg font-bold text-base hover:bg-orange-600 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Placing Order...' : `CONFIRM ORDER — ${formatPrice(total)}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
