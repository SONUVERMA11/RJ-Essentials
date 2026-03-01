'use client';

import { useState, useEffect } from 'react';
import { Star, ShoppingCart, Zap, Share2, MapPin, ChevronRight, Shield, RotateCcw, Truck, Copy, MessageCircle, Play } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useRecentlyViewedStore } from '@/lib/store/recently-viewed';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import ProductCard from '@/components/store/ProductCard';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductDetailProps {
    product: {
        _id: string;
        name: string;
        slug: string;
        category: string;
        brand: string;
        description: string;
        highlights: string[];
        specifications: { key: string; value: string }[];
        images: { url: string }[];
        mrp: number;
        sellingPrice: number;
        stock: number;
        variants: { type: string; options: string[] }[];
        ratings: { average: number; count: number };
        returnDays: number;
        soldCount: number;
        mediaLinks?: { type: string; url: string; caption: string }[];
    };
    relatedProducts: typeof DEMO_PRODUCTS;
    reviews: Array<{ _id: string; name: string; rating: number; comment: string; createdAt: string }>;
}

const DEMO_PRODUCTS: Array<{
    _id: string; name: string; slug: string; images: { url: string }[];
    mrp: number; sellingPrice: number; ratings: { average: number; count: number }; stock: number;
}> = [];

export default function ProductDetailClient({ product, relatedProducts, reviews }: ProductDetailProps) {
    const router = useRouter();
    const addItem = useCartStore((s) => s.addItem);
    const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<string>('');
    const [pincode, setPincode] = useState('');
    const [pincodeResult, setPincodeResult] = useState('');
    const [reviewName, setReviewName] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const discount = calculateDiscount(product.mrp, product.sellingPrice);
    const isOutOfStock = product.stock <= 0;

    useEffect(() => {
        addRecentlyViewed({
            productId: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0]?.url || '',
            price: product.sellingPrice,
            mrp: product.mrp,
        });
    }, [product._id]);

    const handleAddToCart = () => {
        if (isOutOfStock) return;
        addItem({
            productId: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0]?.url || '',
            price: product.sellingPrice,
            mrp: product.mrp,
            quantity,
            variant: selectedVariant,
            stock: product.stock,
        });
        toast.success('Added to cart!');
    };

    const handleBuyNow = () => {
        handleAddToCart();
        router.push('/checkout');
    };

    const checkPincode = () => {
        if (pincode.length === 6) {
            setPincodeResult(`Delivery available to ${pincode}. Estimated delivery in 5-7 business days.`);
        } else {
            setPincodeResult('Please enter a valid 6-digit pincode');
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewName.trim() || !reviewComment.trim()) {
            toast.error('Please fill in your name and review');
            return;
        }
        setSubmittingReview(true);
        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    name: reviewName,
                    rating: reviewRating,
                    comment: reviewComment,
                }),
            });
            toast.success('Review submitted! It will appear after approval.');
            setReviewName('');
            setReviewComment('');
        } catch {
            toast.error('Failed to submit review');
        }
        setSubmittingReview(false);
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: product.name, url });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied!');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap">
                <Link href="/" className="hover:text-[#2874F0]">Home</Link>
                <ChevronRight size={14} />
                <Link href={`/category/${product.category?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="hover:text-[#2874F0]">{product.category}</Link>
                <ChevronRight size={14} />
                <span className="text-gray-800 font-medium truncate">{product.name}</span>
            </div>

            <div className="bg-white rounded-sm shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 p-4 md:p-6">
                    {/* Images */}
                    <div className="space-y-3">
                        <div className="relative aspect-square bg-gray-50 rounded-sm overflow-hidden flex items-center justify-center border border-gray-100">
                            {product.images?.[selectedImage]?.url ? (
                                <div className="zoom-container w-full h-full flex items-center justify-center">
                                    <img src={product.images[selectedImage].url} alt={product.name} className="max-h-full max-w-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <span className="text-6xl text-gray-300">📦</span>
                                </div>
                            )}
                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                    <span className="bg-red-600 text-white px-4 py-2 rounded font-bold">OUT OF STOCK</span>
                                </div>
                            )}
                        </div>
                        {product.images?.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`w-16 h-16 rounded border-2 flex-shrink-0 overflow-hidden ${i === selectedImage ? 'border-[#2874F0]' : 'border-gray-200'}`}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Mobile buttons */}
                        <div className="md:hidden flex gap-3">
                            <button onClick={handleAddToCart} disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3 rounded-sm font-bold disabled:opacity-50">
                                <ShoppingCart size={18} /> ADD TO CART
                            </button>
                            <button onClick={handleBuyNow} disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3 rounded-sm font-bold disabled:opacity-50">
                                <Zap size={18} /> BUY NOW
                            </button>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4 mt-4 md:mt-0">
                        {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
                        <h1 className="text-lg md:text-xl font-medium text-gray-800 leading-tight">{product.name}</h1>

                        {/* Rating */}
                        {product.ratings.count > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 bg-[#388E3C] text-white text-sm font-bold px-2 py-0.5 rounded-sm">
                                    {product.ratings.average.toFixed(1)} <Star size={12} fill="white" />
                                </span>
                                <span className="text-sm text-gray-500">({product.ratings.count.toLocaleString()} reviews)</span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-3">
                                <span className="text-2xl md:text-3xl font-bold text-gray-900">{formatPrice(product.sellingPrice)}</span>
                                {discount > 0 && (
                                    <>
                                        <span className="text-lg text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                                        <span className="text-lg text-[#388E3C] font-bold">{discount}% off</span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">inclusive of all taxes</p>
                        </div>

                        {/* COD Badge */}
                        <div className="inline-flex items-center gap-2 bg-green-50 text-[#388E3C] px-3 py-2 rounded text-sm font-medium border border-green-200">
                            <Shield size={16} /> COD Available — Pay on Delivery
                        </div>

                        {/* Social proof */}
                        {product.soldCount > 0 && (
                            <p className="text-sm text-gray-500">🔥 Sold {product.soldCount} times this week</p>
                        )}

                        {/* Variants */}
                        {product.variants?.map((v, vi) => (
                            <div key={vi} className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">{v.type}:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {v.options?.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setSelectedVariant(opt)}
                                            className={`px-4 py-2 rounded-sm border-2 text-sm font-medium transition-colors ${selectedVariant === opt
                                                ? 'border-[#2874F0] text-[#2874F0] bg-blue-50'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-400'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Quantity */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Qty:</span>
                            <select
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                            >
                                {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        {/* Desktop buttons */}
                        <div className="hidden md:flex gap-3">
                            <button onClick={handleAddToCart} disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#2874F0] text-white py-4 rounded-sm font-bold text-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ShoppingCart size={20} /> ADD TO CART
                            </button>
                            <button onClick={handleBuyNow} disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-4 rounded-sm font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Zap size={20} /> BUY NOW
                            </button>
                        </div>

                        {/* Info badges */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <Truck size={20} className="mx-auto mb-1 text-gray-600" />
                                <p className="text-xs text-gray-600 font-medium">Free Delivery</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <RotateCcw size={20} className="mx-auto mb-1 text-gray-600" />
                                <p className="text-xs text-gray-600 font-medium">{product.returnDays || 7} Day Return</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <Shield size={20} className="mx-auto mb-1 text-gray-600" />
                                <p className="text-xs text-gray-600 font-medium">COD Available</p>
                            </div>
                        </div>

                        {/* Pincode */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Delivery</p>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded px-3">
                                    <MapPin size={16} className="text-gray-400" />
                                    <input
                                        type="text"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter pincode"
                                        className="flex-1 py-2 text-sm outline-none"
                                    />
                                </div>
                                <button onClick={checkPincode} className="px-4 py-2 text-[#2874F0] font-bold text-sm hover:bg-blue-50 rounded">
                                    Check
                                </button>
                            </div>
                            {pincodeResult && <p className="text-sm text-gray-600">{pincodeResult}</p>}
                        </div>

                        {/* Share */}
                        <button onClick={handleShare} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2874F0]">
                            <Share2 size={16} /> Share this product
                        </button>

                        {/* Seller */}
                        <div className="text-sm text-gray-500 pt-2 border-t border-gray-100">
                            Sold by <span className="text-[#2874F0] font-medium">RJ ESSENTIALS</span> | Meesho Verified
                        </div>
                    </div>
                </div>

                {/* Highlights */}
                {product.highlights?.length > 0 && (
                    <div className="border-t border-gray-100 p-4 md:p-6">
                        <h3 className="text-base font-bold text-gray-800 mb-3">Highlights</h3>
                        <ul className="space-y-1.5">
                            {product.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400 mt-1">•</span> {h}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <div className="border-t border-gray-100 p-4 md:p-6">
                        <h3 className="text-base font-bold text-gray-800 mb-3">Description</h3>
                        <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>
                )}

                {/* Media & Videos */}
                {product.mediaLinks && product.mediaLinks.length > 0 && (
                    <div className="border-t border-gray-100 p-4 md:p-6">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Play size={18} className="text-[#2874F0]" /> Media & Videos
                        </h3>
                        <div className="space-y-4">
                            {product.mediaLinks.map((media, i) => (
                                <div key={i}>
                                    {media.type === 'video' ? (
                                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                            <iframe
                                                src={media.url.includes('youtube.com/watch') ? media.url.replace('watch?v=', 'embed/') : media.url.includes('youtu.be/') ? media.url.replace('youtu.be/', 'www.youtube.com/embed/') : media.url}
                                                title={media.caption || `Video ${i + 1}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <img src={media.url} alt={media.caption || `Media ${i + 1}`} className="w-full max-h-[500px] object-contain rounded-lg bg-gray-50" />
                                    )}
                                    {media.caption && (
                                        <p className="text-sm text-gray-500 mt-2 text-center italic">{media.caption}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Specifications */}
                {product.specifications?.length > 0 && (
                    <div className="border-t border-gray-100 p-4 md:p-6">
                        <h3 className="text-base font-bold text-gray-800 mb-3">Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {product.specifications.map((s, i) => (
                                <div key={i} className="flex gap-4 py-2 border-b border-gray-50">
                                    <span className="text-sm text-gray-500 w-1/3">{s.key}</span>
                                    <span className="text-sm text-gray-800 font-medium flex-1">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews */}
                <div className="border-t border-gray-100 p-4 md:p-6">
                    <h3 className="text-base font-bold text-gray-800 mb-4">Reviews & Ratings</h3>
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map((r) => (
                                <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                            {r.rating} <Star size={10} fill="white" />
                                        </span>
                                        <span className="text-sm font-medium text-gray-700">{r.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{r.comment}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
                    )}

                    {/* Review Form */}
                    <div className="mt-6 bg-gray-50 rounded p-4">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">Write a Review</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={reviewName}
                                onChange={(e) => setReviewName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#2874F0]"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Rating:</span>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} onClick={() => setReviewRating(n)}>
                                        <Star size={20} className={n <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Your review..."
                                rows={3}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#2874F0] resize-none"
                            />
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="bg-[#2874F0] text-white px-6 py-2 rounded-sm text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="mt-4 bg-white rounded-sm p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">You May Also Like</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {relatedProducts.slice(0, 5).map((p) => (
                            <ProductCard key={p._id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
