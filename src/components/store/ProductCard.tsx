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
        <Link href={`/product/${product.slug}`} className="block group">
            <div className="bg-card rounded-xl overflow-hidden relative hover:shadow-lg hover:shadow-[#2874F0]/5 transition-all duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-square bg-muted/30 p-3 flex items-center justify-center overflow-hidden rounded-t-xl">
                    <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 rounded-lg"
                        loading="lazy"
                    />
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                            <span className="bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full">OUT OF STOCK</span>
                        </div>
                    )}
                    {discount > 0 && !isOutOfStock && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-[#FB641B] to-[#ff8534] text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full shadow-sm">
                            {discount}% OFF
                        </span>
                    )}
                    {/* Add to cart on hover */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAddToCart}
                            className="absolute bottom-2 right-2 bg-card shadow-md rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#2874F0] hover:text-white text-muted-foreground hover:scale-110 border border-border"
                        >
                            <ShoppingCart size={16} />
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                    <h3 className="text-sm text-foreground font-semibold truncate leading-tight" title={product.name}>
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                                {product.ratings.average.toFixed(1)} <Star size={9} fill="white" />
                            </span>
                            <span className="text-xs text-muted-foreground">({product.ratings.count.toLocaleString()})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 flex-wrap mt-auto">
                        <span className="text-base font-bold text-foreground">{formatPrice(product.sellingPrice)}</span>
                        {discount > 0 && (
                            <>
                                <span className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</span>
                                <span className="text-xs text-[#388E3C] font-semibold">{discount}% off</span>
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
