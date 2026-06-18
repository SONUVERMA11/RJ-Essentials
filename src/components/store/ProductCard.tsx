'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
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
            <div className="bg-card rounded-2xl overflow-hidden relative product-card h-full flex flex-col border border-border">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                    <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                        loading="lazy"
                    />
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                            <span className="bg-foreground text-background text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">Out of Stock</span>
                        </div>
                    )}
                    {discount > 0 && !isOutOfStock && (
                        <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-[#FB641B] to-[#ff8534] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            {discount}% OFF
                        </span>
                    )}
                    {/* Add to cart on hover */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAddToCart}
                            className="absolute bottom-2.5 right-2.5 bg-foreground text-background rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg hover:bg-[#2874F0]"
                            aria-label="Add to cart"
                        >
                            <ShoppingCart size={15} />
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 md:p-4 space-y-1.5 flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-foreground truncate leading-snug" title={product.name}>
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {product.ratings.average.toFixed(1)} <span className="text-[8px]">★</span>
                            </span>
                            <span className="text-xs text-muted-foreground">({product.ratings.count.toLocaleString()})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 flex-wrap mt-auto pt-1">
                        <span className="text-base md:text-lg font-bold text-foreground">{formatPrice(product.sellingPrice)}</span>
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
