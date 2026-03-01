'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, LogIn } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/store/LoginModal';

export default function CartPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { items, removeItem, updateQuantity, getSubtotal, getMrpTotal, getDiscount, getItemCount } = useCartStore();
    const [showLoginModal, setShowLoginModal] = useState(false);

    const subtotal = getSubtotal();
    const deliveryCharge = subtotal >= 499 ? 0 : 49;
    const totalPayable = subtotal + deliveryCharge;

    const handlePlaceOrder = () => {
        if (!session) {
            setShowLoginModal(true);
        } else {
            router.push('/checkout');
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <div className="bg-white rounded-sm p-12 shadow-sm">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything to your cart yet</p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3 rounded-sm font-bold hover:bg-blue-600 transition-colors">
                        <ShoppingBag size={18} /> Shop Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-lg font-bold text-gray-800 mb-4">Shopping Cart ({getItemCount()} items)</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                    {items.map((item) => (
                        <div key={`${item.productId}-${item.variant || ''}`} className="bg-white rounded-sm p-4 shadow-sm flex gap-4">
                            <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-20 h-20 md:w-28 md:h-28 object-contain bg-gray-50 rounded" />
                                ) : (
                                    <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-100 rounded flex items-center justify-center text-3xl">📦</div>
                                )}
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link href={`/product/${item.slug}`}>
                                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#2874F0]">{item.name}</h3>
                                </Link>
                                {item.variant && <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>}
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-base font-bold">{formatPrice(item.price)}</span>
                                    {item.mrp > item.price && (
                                        <>
                                            <span className="text-sm text-gray-400 line-through">{formatPrice(item.mrp)}</span>
                                            <span className="text-xs text-[#388E3C] font-bold">{calculateDiscount(item.mrp, item.price)}% off</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center border border-gray-300 rounded">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                            disabled={item.quantity <= 1}
                                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[32px] text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                            disabled={item.quantity >= 10}
                                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.productId, item.variant)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-sm p-4 shadow-sm sticky top-20">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 pb-3 border-b border-gray-200">Price Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Price ({getItemCount()} items)</span>
                                <span>{formatPrice(getMrpTotal())}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Discount</span>
                                <span className="text-[#388E3C] font-medium">-{formatPrice(getDiscount())}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Delivery Charges</span>
                                <span className={deliveryCharge === 0 ? 'text-[#388E3C] font-medium' : ''}>
                                    {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                                </span>
                            </div>
                            <div className="flex justify-between font-bold text-base pt-3 border-t border-dashed border-gray-200">
                                <span>Total Amount</span>
                                <span>{formatPrice(totalPayable)}</span>
                            </div>
                            {getDiscount() > 0 && (
                                <p className="text-sm text-[#388E3C] font-medium">
                                    You will save {formatPrice(getDiscount())} on this order
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3.5 rounded-sm font-bold text-base hover:bg-orange-600 transition-colors"
                        >
                            {session ? (
                                <>PLACE ORDER <ArrowRight size={18} /></>
                            ) : (
                                <>LOGIN & PLACE ORDER <LogIn size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                callbackMessage="Sign in to place your order"
            />
        </div>
    );
}

