'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, LogIn, ShieldCheck, Truck } from 'lucide-react';
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
                <div className="py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                        <ShoppingBag size={40} className="text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">Looks like you haven&apos;t added anything to your cart yet. Start shopping to find great deals!</p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-blue-600 transition-all hover:shadow-lg hover:shadow-blue-500/25">
                        <ShoppingBag size={18} /> Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
                <p className="text-sm text-muted-foreground mt-1">{getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} in your cart</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="divide-y divide-border">
                        {items.map((item) => (
                            <div key={`${item.productId}-${item.variant || ''}`} className="py-5 first:pt-0 last:pb-0">
                                <div className="flex gap-4">
                                    <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-24 h-24 md:w-28 md:h-28 object-contain bg-muted/30 rounded-lg" />
                                        ) : (
                                            <div className="w-24 h-24 md:w-28 md:h-28 bg-muted/30 rounded-lg flex items-center justify-center text-3xl">📦</div>
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/product/${item.slug}`}>
                                            <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-[#2874F0] transition-colors">{item.name}</h3>
                                        </Link>
                                        {item.variant && <p className="text-xs text-muted-foreground mt-1">{item.variant}</p>}
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <span className="text-lg font-bold text-foreground">{formatPrice(item.price)}</span>
                                            {item.mrp > item.price && (
                                                <>
                                                    <span className="text-sm text-muted-foreground line-through">{formatPrice(item.mrp)}</span>
                                                    <span className="text-xs text-[#388E3C] font-semibold">{calculateDiscount(item.mrp, item.price)}% off</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center border border-border rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                                    disabled={item.quantity <= 1}
                                                    className="px-3 py-2 text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="px-4 py-2 text-sm font-semibold border-x border-border min-w-[40px] text-center text-foreground">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                                    disabled={item.quantity >= 10}
                                                    className="px-3 py-2 text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.productId, item.variant)}
                                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                                <span className="hidden sm:inline">Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="border border-border rounded-xl p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-5 pb-4 border-b border-border">Price Details</h3>
                            <div className="space-y-3.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Price ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})</span>
                                    <span className="text-foreground">{formatPrice(getMrpTotal())}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="text-[#388E3C] font-medium">-{formatPrice(getDiscount())}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Delivery Charges</span>
                                    <span className={deliveryCharge === 0 ? 'text-[#388E3C] font-medium' : 'text-foreground'}>
                                        {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-4 border-t border-dashed border-border">
                                    <span className="text-foreground">Total Amount</span>
                                    <span className="text-foreground">{formatPrice(totalPayable)}</span>
                                </div>
                                {getDiscount() > 0 && (
                                    <p className="text-sm text-[#388E3C] font-medium pt-1">
                                        You will save {formatPrice(getDiscount())} on this order
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                className="w-full mt-6 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3.5 rounded-lg font-bold text-base hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/25"
                            >
                                {session ? (
                                    <>PLACE ORDER <ArrowRight size={18} /></>
                                ) : (
                                    <>LOGIN & PLACE ORDER <LogIn size={18} /></>
                                )}
                            </button>
                        </div>

                        {/* Trust signals */}
                        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#388E3C]" /> Secure Checkout</span>
                            <span className="flex items-center gap-1.5"><Truck size={14} className="text-[#2874F0]" /> Fast Delivery</span>
                        </div>
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
