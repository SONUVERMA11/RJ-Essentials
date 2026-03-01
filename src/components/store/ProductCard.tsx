'use client';

import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { calculateDiscount, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
    product: {
        _id: string;
        name: string;
        slug: string;
        images: { url: string }[];
        mrp: number;
        sellingPrice: number;
        ratings: { average: number; count: number };
        stock: number;
        meeshoLink?: string;
        isFeatured?: boolean;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((s) => s.addItem);
    const discount = calculateDiscount(product.mrp, product.sellingPrice);
    const isOutOfStock = product.stock <= 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock) return;

        addItem({
            productId: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0]?.url || '/placeholder.png',
            price: product.sellingPrice,
            mrp: product.mrp,
            quantity: 1,
            stock: product.stock,
            meeshoLink: product.meeshoLink,
        });
        toast.success('Added to cart!');
    };

    return (
        <Link href={`/product/${product.slug}`} className="block">
            <div className="product-card bg-white rounded-sm overflow-hidden relative group border border-transparent hover:border-gray-200">
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
                    <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded">OUT OF STOCK</span>
                        </div>
                    )}
                    {discount > 0 && !isOutOfStock && (
                        <span className="absolute top-2 left-2 bg-[#FB641B] text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                            {discount}% OFF
                        </span>
                    )}
                    {/* Add to cart on hover */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAddToCart}
                            className="absolute bottom-2 right-2 bg-white shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#2874F0] hover:text-white text-gray-700"
                        >
                            <ShoppingCart size={16} />
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1">
                    <h3 className="text-sm text-gray-800 font-medium line-clamp-2 leading-tight min-h-[2.5rem]">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                {product.ratings.average.toFixed(1)} <Star size={10} fill="white" />
                            </span>
                            <span className="text-xs text-gray-500">({product.ratings.count.toLocaleString()})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">{formatPrice(product.sellingPrice)}</span>
                        {discount > 0 && (
                            <>
                                <span className="text-sm text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                                <span className="text-xs text-[#388E3C] font-medium">{discount}% off</span>
                            </>
                        )}
                    </div>

                    {/* Free delivery badge */}
                    <p className="text-[11px] text-[#388E3C] font-medium">Free Delivery</p>
                </div>
            </div>
        </Link>
    );
}
