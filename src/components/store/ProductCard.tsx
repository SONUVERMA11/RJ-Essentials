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
            <div className="product-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden relative group border border-gray-100 dark:border-gray-700 hover:border-[#2874F0] dark:hover:border-[#5a9cf5] hover:shadow-lg transition-all duration-300">
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center overflow-hidden">
                    <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-90"
                        loading="lazy"
                    />
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center">
                            <span className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs font-bold px-3 py-1 rounded">OUT OF STOCK</span>
                        </div>
                    )}
                    {discount > 0 && !isOutOfStock && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-[#FB641B] to-[#ff8534] text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                            {discount}% OFF
                        </span>
                    )}
                    {/* Add to cart on hover */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAddToCart}
                            className="absolute bottom-2 right-2 bg-white dark:bg-gray-700 shadow-md rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#2874F0] hover:text-white text-gray-700 dark:text-gray-200 hover:scale-110"
                        >
                            <ShoppingCart size={16} />
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="p-3.5 space-y-1.5">
                    <h3 className="text-sm text-gray-800 dark:text-gray-100 font-bold truncate leading-tight" title={product.name}>
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                {product.ratings.average.toFixed(1)} <Star size={10} fill="white" />
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({product.ratings.count.toLocaleString()})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{formatPrice(product.sellingPrice)}</span>
                        {discount > 0 && (
                            <>
                                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{formatPrice(product.mrp)}</span>
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
