'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MapPin, Package, CreditCard, ArrowRight, ArrowLeft, Shield, LogIn } from 'lucide-react';
import Link from 'next/link';
import LoginModal from '@/components/store/LoginModal';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
];

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { items, getSubtotal, getMrpTotal, getDiscount, getItemCount, clearCart } = useCartStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [address, setAddress] = useState({
        name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '',
    });

    const subtotal = getSubtotal();
    const deliveryCharge = subtotal >= 499 ? 0 : 49;
    const total = subtotal + deliveryCharge;

    // Show login modal if not authenticated
    if (status === 'loading') {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-[#2874F0] rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg p-8 shadow-sm text-center space-y-4">
                    <LogIn size={48} className="mx-auto text-[#2874F0]" />
                    <h2 className="text-xl font-bold text-gray-800">Sign in to Continue</h2>
                    <p className="text-gray-500">Please sign in or create an account to place your order.</p>
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
                <div className="bg-white rounded-sm p-12 shadow-sm">
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <Link href="/" className="text-[#2874F0] font-medium hover:underline">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    const validateAddress = () => {
        const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode'] as const;
        for (const field of required) {
            if (!address[field].trim()) {
                toast.error(`Please fill in ${field === 'line1' ? 'Address Line 1' : field}`);
                return false;
            }
        }
        if (address.phone.length !== 10) {
            toast.error('Phone number must be 10 digits');
            return false;
        }
        if (address.pincode.length !== 6) {
            toast.error('Pincode must be 6 digits');
            return false;
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: {
                        name: address.name,
                        phone: address.phone,
                        email: address.email || session?.user?.email || '',
                        address: {
                            line1: address.line1, line2: address.line2,
                            city: address.city, state: address.state, pincode: address.pincode,
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

    return (
        <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Logged in as */}
            <div className="bg-blue-50 border border-blue-100 rounded-sm p-3 mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-700">
                    Logged in as <span className="font-semibold text-[#2874F0]">{session?.user?.name || session?.user?.email}</span>
                </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-sm p-4 shadow-sm mb-4">
                <div className="flex items-center justify-center gap-2 md:gap-8">
                    {[
                        { num: 1, label: 'Address', icon: MapPin },
                        { num: 2, label: 'Summary', icon: Package },
                        { num: 3, label: 'Payment', icon: CreditCard },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.num ? 'bg-[#2874F0] text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {s.num}
                            </div>
                            <span className={`text-sm hidden md:inline ${step >= s.num ? 'text-[#2874F0] font-medium' : 'text-gray-500'}`}>{s.label}</span>
                            {i < 2 && <div className={`w-16 md:w-24 h-0.5 ${step > s.num ? 'bg-[#2874F0]' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Address */}
            {step === 1 && (
                <div className="bg-white rounded-sm p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-[#2874F0]" /> Delivery Address
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input type="text" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="Enter full name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                            <input type="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="10-digit mobile number" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                            <input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="For order updates" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                            <input type="text" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="House No., Building, Street" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                            <input type="text" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="Area, Landmark" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="City" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none bg-white">
                                <option value="">Select State</option>
                                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                            <input type="text" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-[#2874F0] outline-none" placeholder="6-digit pincode" />
                        </div>
                    </div>
                    <button
                        onClick={() => validateAddress() && setStep(2)}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3 rounded-sm font-bold hover:bg-orange-600"
                    >
                        Continue <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* Step 2: Summary */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="bg-white rounded-sm p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
                            <button onClick={() => setStep(1)} className="text-[#2874F0] text-sm font-medium">Edit Address</button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-700">
                            <p className="font-medium">{address.name} — {address.phone}</p>
                            <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                            <p>{address.city}, {address.state} — {address.pincode}</p>
                        </div>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.variant}`} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-14 h-14 object-contain bg-gray-50 rounded" />
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center">📦</div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800 font-medium line-clamp-2">{item.name}</p>
                                        <p className="text-sm text-gray-600 mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                    </div>
                                    <span className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-sm p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Price Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Price ({getItemCount()} items)</span><span>{formatPrice(getMrpTotal())}</span></div>
                            <div className="flex justify-between"><span>Discount</span><span className="text-[#388E3C]">-{formatPrice(getDiscount())}</span></div>
                            <div className="flex justify-between"><span>Delivery</span><span className={deliveryCharge === 0 ? 'text-[#388E3C]' : ''}>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span></div>
                            <div className="flex justify-between font-bold text-base pt-2 border-t border-dashed"><span>Total</span><span>{formatPrice(total)}</span></div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 rounded-sm font-bold hover:bg-gray-50">
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3 rounded-sm font-bold hover:bg-orange-600">
                            Continue <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-white rounded-sm p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-[#2874F0]" /> Payment Method
                        </h2>
                        <div className="border-2 border-[#2874F0] rounded-md p-4 bg-blue-50">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-[#2874F0] flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-[#2874F0]" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">Cash on Delivery (COD)</p>
                                    <p className="text-sm text-gray-600">Pay {formatPrice(total)} when your order arrives</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                            <Shield size={16} className="text-[#388E3C]" />
                            Safe and secure. No online payment needed.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 rounded-sm font-bold hover:bg-gray-50">
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3.5 rounded-sm font-bold text-base hover:bg-orange-600 disabled:opacity-50"
                        >
                            {loading ? 'Placing Order...' : `CONFIRM ORDER — ${formatPrice(total)}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
