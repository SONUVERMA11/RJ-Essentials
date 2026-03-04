'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ShoppingCart, Zap, Share2, MapPin, ChevronRight, ChevronLeft, Shield, RotateCcw, Truck, Play, X, ZoomIn, Tag, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useRecentlyViewedStore } from '@/lib/store/recently-viewed';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import ProductCard from '@/components/store/ProductCard';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductDetailProps {
    product: {
        _id: string; name: string; slug: string; category: string; brand: string;
        description: string; highlights: string[];
        specifications: { key: string; value: string }[];
        images: { url: string }[]; mrp: number; sellingPrice: number; stock: number;
        variants: { type: string; options: string[] }[];
        ratings: { average: number; count: number }; returnDays: number; soldCount: number;
        mediaLinks?: { type: string; url: string; caption: string }[];
    };
    relatedProducts: Array<{
        _id: string; name: string; slug: string; images: { url: string }[];
        mrp: number; sellingPrice: number; ratings: { average: number; count: number }; stock: number;
    }>;
    reviews: Array<{ _id: string; name: string; rating: number; comment: string; createdAt: string }>;
}

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
    const [showOffers, setShowOffers] = useState(false);
    const [showAllDetails, setShowAllDetails] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(0);
    const [zoomScale, setZoomScale] = useState(1);
    const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [liked, setLiked] = useState(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const swipeDirectionLocked = useRef<'h' | 'v' | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const thumbnailStripRef = useRef<HTMLDivElement>(null);

    const discount = calculateDiscount(product.mrp, product.sellingPrice);
    const isOutOfStock = product.stock <= 0;

    // Estimated delivery date (5 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const deliveryStr = deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    useEffect(() => {
        addRecentlyViewed({
            productId: product._id, name: product.name, slug: product.slug,
            image: product.images?.[0]?.url || '', price: product.sellingPrice, mrp: product.mrp,
        });
    }, [product._id]);

    useEffect(() => {
        document.body.style.overflow = fullscreenOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [fullscreenOpen]);

    // Auto-scroll thumbnails to keep active one visible
    useEffect(() => {
        if (thumbnailStripRef.current) {
            const strip = thumbnailStripRef.current;
            const activeThumb = strip.children[selectedImage] as HTMLElement;
            if (activeThumb) {
                const stripRect = strip.getBoundingClientRect();
                const thumbRect = activeThumb.getBoundingClientRect();
                const offset = thumbRect.left - stripRect.left - (stripRect.width / 2) + (thumbRect.width / 2);
                strip.scrollBy({ left: offset, behavior: 'smooth' });
            }
        }
    }, [selectedImage]);

    const handleAddToCart = () => {
        if (isOutOfStock) return;
        addItem({
            productId: product._id, name: product.name, slug: product.slug,
            image: product.images?.[0]?.url || '', price: product.sellingPrice,
            mrp: product.mrp, quantity, variant: selectedVariant, stock: product.stock,
        });
        toast.success('Added to cart!');
    };

    const handleBuyNow = () => { handleAddToCart(); router.push('/cart'); };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) navigator.share({ title: product.name, url });
        else { navigator.clipboard.writeText(url); toast.success('Link copied!'); }
    };

    const handleSubmitReview = async () => {
        if (!reviewName.trim() || !reviewComment.trim()) { toast.error('Please fill all fields'); return; }
        setSubmittingReview(true);
        try {
            await fetch('/api/reviews', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product._id, name: reviewName, rating: reviewRating, comment: reviewComment }),
            });
            toast.success('Review submitted!'); setReviewName(''); setReviewComment('');
        } catch { toast.error('Failed to submit'); }
        setSubmittingReview(false);
    };

    // Image navigation
    const nextImage = () => setSelectedImage((p) => (p + 1) % product.images.length);
    const prevImage = () => setSelectedImage((p) => (p - 1 + product.images.length) % product.images.length);

    // Drag-controlled touch handlers — image follows finger in real-time
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        swipeDirectionLocked.current = null;
        setIsSwiping(true);
        setDragOffset(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;

        // Lock direction on first significant movement
        if (!swipeDirectionLocked.current) {
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                swipeDirectionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
            }
            return;
        }

        // Only handle horizontal swipes
        if (swipeDirectionLocked.current === 'v') return;

        e.preventDefault(); // Prevent vertical scroll during horizontal swipe

        // Clamp drag at edges with rubber-band resistance
        let clampedDx = dx;
        if ((selectedImage === 0 && dx > 0) || (selectedImage === product.images.length - 1 && dx < 0)) {
            clampedDx = dx * 0.3; // Rubber band effect
        }
        setDragOffset(clampedDx);
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;
        setIsSwiping(false);

        const containerWidth = sliderRef.current?.offsetWidth || 400;
        const threshold = containerWidth * 0.25; // 25% drag = change image

        if (dragOffset < -threshold && selectedImage < product.images.length - 1) {
            setSelectedImage(selectedImage + 1);
        } else if (dragOffset > threshold && selectedImage > 0) {
            setSelectedImage(selectedImage - 1);
        }
        setDragOffset(0);
    };

    const openFullscreen = (i: number) => { setFullscreenImage(i); setFullscreenOpen(true); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); };
    const toggleZoom = () => { if (zoomScale > 1) { setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); } else setZoomScale(2.5); };

    const fsTouchStartX = useRef(0); const fsTouchEndX = useRef(0);
    const handleFsSwipe = (dir: number) => { setFullscreenImage((p) => (p + dir + product.images.length) % product.images.length); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); };

    return (
        <>
            <div className="max-w-7xl mx-auto pb-32 md:pb-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground px-4 py-2 overflow-x-auto whitespace-nowrap">
                    <Link href="/" className="hover:text-[#2874F0] transition-colors">Home</Link>
                    <ChevronRight size={12} />
                    <Link href={`/category/${product.category?.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="hover:text-[#2874F0] transition-colors">{product.category}</Link>
                    <ChevronRight size={12} />
                    <span className="text-foreground truncate">{product.name}</span>
                </div>

                <div className="md:grid md:grid-cols-2 md:gap-0">
                    {/* ===== LEFT: IMAGE SECTION ===== */}
                    <div className="md:sticky md:top-[130px] md:self-start">
                        {/* Main Image with Drag-Controlled Slide */}
                        <div
                            ref={sliderRef}
                            className="relative aspect-square bg-muted/20 cursor-pointer group overflow-hidden rounded-2xl touch-pan-y"
                            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                            onClick={() => !dragOffset && openFullscreen(selectedImage)}
                        >
                            {/* Sliding image track — follows finger during drag, snaps on release */}
                            <div
                                className={`flex h-full ${isSwiping ? '' : 'transition-transform duration-300 ease-out'}`}
                                style={{
                                    transform: `translateX(calc(-${selectedImage * 100}% + ${dragOffset}px))`,
                                    willChange: isSwiping ? 'transform' : 'auto',
                                }}
                            >
                                {product.images?.map((img, i) => (
                                    <div key={i} className="w-full h-full flex-shrink-0 flex items-center justify-center">
                                        {img.url ? (
                                            <img src={img.url} alt={`${product.name} - ${i + 1}`}
                                                className="max-h-full max-w-full object-contain select-none" draggable={false} />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <span className="text-6xl">📦</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Like button */}
                            <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                                className="absolute top-3 right-3 w-9 h-9 bg-card rounded-full flex items-center justify-center shadow-lg border border-border z-10">
                                <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} />
                            </button>

                            {/* Share button */}
                            <button onClick={(e) => { e.stopPropagation(); handleShare(); }}
                                className="absolute top-3 right-14 w-9 h-9 bg-card rounded-full flex items-center justify-center shadow-lg border border-border z-10">
                                <Share2 size={16} className="text-muted-foreground" />
                            </button>

                            {/* Arrows (desktop) */}
                            {product.images?.length > 1 && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <ChevronLeft size={20} className="text-foreground" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <ChevronRight size={20} className="text-foreground" />
                                    </button>
                                </>
                            )}

                            {/* Counter badge */}
                            {product.images?.length > 1 && (
                                <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full z-10">
                                    {selectedImage + 1}/{product.images.length}
                                </span>
                            )}

                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-20">
                                    <span className="bg-red-600 text-white px-4 py-2 rounded font-bold">OUT OF STOCK</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip (replaces dots) */}
                        {product.images?.length > 1 && (
                            <div className="mt-3 px-2">
                                <div
                                    ref={thumbnailStripRef}
                                    className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {product.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(i)}
                                            className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === selectedImage
                                                ? 'border-[#2874F0] shadow-md shadow-[#2874F0]/20 scale-105'
                                                : 'border-border opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`${product.name} thumbnail ${i + 1}`}
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== RIGHT: DETAILS ===== */}
                    <div className="bg-card md:relative">
                        {/* Variants (Color / Size etc) */}
                        {product.variants?.length > 0 && product.variants.map((v, vi) => (
                            <div key={vi} className="px-4 py-3 border-b border-border">
                                <p className="text-xs text-muted-foreground mb-2">Select {v.type}: <span className="font-semibold text-foreground">{selectedVariant || v.options[0]}</span></p>
                                <div className="flex gap-2 flex-wrap">
                                    {v.options?.map((opt) => (
                                        <button key={opt} onClick={() => setSelectedVariant(opt)}
                                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${(selectedVariant || v.options[0]) === opt
                                                ? 'border-[#2874F0] text-[#2874F0] bg-[#2874F0]/10'
                                                : 'border-border text-muted-foreground'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Brand + Title */}
                        <div className="px-4 pt-3 pb-2">
                            {product.brand && <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>}
                            <h1 className="text-sm md:text-base font-normal text-foreground/80 leading-snug">{product.name}</h1>

                            {/* Rating */}
                            {product.ratings.count > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                        {product.ratings.average.toFixed(1)} <Star size={10} fill="white" />
                                    </span>
                                    <span className="text-xs text-muted-foreground">({product.ratings.count.toLocaleString()} reviews)</span>
                                    {product.soldCount > 0 && <span className="text-xs text-muted-foreground">• {product.soldCount}+ sold</span>}
                                </div>
                            )}

                            {/* Hot Deal badge */}
                            {discount >= 30 && (
                                <span className="inline-block mt-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">Hot Deal</span>
                            )}
                        </div>

                        {/* Price Section */}
                        <div className="px-4 py-3 border-t border-border">
                            <div className="flex items-baseline gap-2">
                                {discount > 0 && <span className="text-[#388E3C] text-lg font-bold">↓{discount}%</span>}
                                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.mrp)}</span>
                                <span className="text-2xl font-bold text-foreground">{formatPrice(product.sellingPrice)}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">inclusive of all taxes</p>
                        </div>

                        {/* Offers */}
                        <div className="px-4 py-3 border-t border-border">
                            <button onClick={() => setShowOffers(!showOffers)}
                                className="flex items-center justify-between w-full text-left">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-[#388E3C]" />
                                    <span className="text-sm font-medium text-foreground">Apply offers for maximum savings</span>
                                </div>
                                {showOffers ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                            </button>
                            {showOffers && (
                                <div className="mt-3 space-y-2">
                                    {['₹50 off on first order', '10% Cashback on UPI payments', 'Free delivery on orders above ₹499'].map((offer, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
                                            <div className="w-8 h-8 bg-[#2874F0]/10 rounded-full flex items-center justify-center shrink-0">
                                                <Tag size={14} className="text-[#2874F0]" />
                                            </div>
                                            <span className="text-xs text-foreground/80 flex-1">{offer}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delivery Details */}
                        <div className="px-4 py-3 border-t border-border">
                            <h3 className="text-sm font-bold text-foreground mb-3">Delivery details</h3>
                            <div className="flex gap-2 mb-3">
                                <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 bg-transparent">
                                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter pincode" className="flex-1 py-2 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
                                </div>
                                <button onClick={() => { if (pincode.length === 6) setPincodeResult(`Delivery by ${deliveryStr}`); else setPincodeResult('Enter valid pincode'); }}
                                    className="px-4 py-2 text-[#2874F0] font-bold text-sm rounded-lg">Check</button>
                            </div>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-start gap-2.5">
                                    <Truck size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium text-foreground">Delivery by {deliveryStr}</p>
                                        <p className="text-xs text-muted-foreground">Order in 12hrs to get it sooner</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Shield size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-muted-foreground">Fulfilled by <span className="text-[#2874F0] font-medium">RJ Essentials</span></p>
                                </div>
                                {pincodeResult && <p className="text-xs text-[#388E3C] pl-7">{pincodeResult}</p>}
                            </div>

                            {/* Trust badges */}
                            <div className="flex gap-4 mt-4 pt-3 border-t border-border">
                                {[
                                    { icon: RotateCcw, label: `${product.returnDays || 7}-Day\nReturn` },
                                    { icon: Shield, label: 'Cash on\nDelivery' },
                                    { icon: Truck, label: "RJ\nAssured" },
                                ].map((b, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <b.icon size={18} className="text-muted-foreground" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-center font-medium whitespace-pre-line leading-tight">{b.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Similar Products */}
                        {relatedProducts.length > 0 && (
                            <div className="py-3 border-t border-border">
                                <h3 className="text-sm font-bold text-foreground px-4 mb-3">Similar Products</h3>
                                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                                    {relatedProducts.slice(0, 8).map((p) => (
                                        <Link key={p._id} href={`/product/${p.slug}`}
                                            className="shrink-0 w-32 bg-muted/30 rounded-xl overflow-hidden border border-border hover:border-[#2874F0]/30 transition-colors">
                                            <div className="aspect-square bg-muted/20 flex items-center justify-center p-2">
                                                {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-3xl">📦</span>}
                                            </div>
                                            <div className="p-2">
                                                <p className="text-[11px] text-foreground/80 line-clamp-2 leading-tight">{p.name}</p>
                                                <p className="text-xs font-bold text-foreground mt-1">{formatPrice(p.sellingPrice)}</p>
                                                {p.mrp > p.sellingPrice && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(p.mrp)}</p>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product Highlights */}
                        {product.highlights?.length > 0 && (
                            <div className="px-4 py-3 border-t border-border">
                                <h3 className="text-sm font-bold text-foreground mb-3">Product highlights</h3>
                                <ul className="space-y-1.5">
                                    {product.highlights.map((h, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <span className="text-[#2874F0] mt-0.5">•</span><span>{h}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Specifications */}
                        {product.specifications?.length > 0 && (
                            <div className="px-4 py-3 border-t border-border">
                                <h3 className="text-sm font-bold text-foreground mb-3">Specifications</h3>
                                <div className="space-y-0">
                                    {product.specifications.map((s, i) => (
                                        <div key={i} className="flex py-2 border-b border-border/50 last:border-0">
                                            <span className="text-xs text-muted-foreground w-2/5">{s.key}</span>
                                            <span className="text-xs text-foreground font-medium flex-1">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Details (Description) */}
                        {product.description && (
                            <div className="px-4 py-3 border-t border-border">
                                <button onClick={() => setShowAllDetails(!showAllDetails)} className="flex items-center justify-between w-full">
                                    <h3 className="text-sm font-bold text-foreground">All details</h3>
                                    {showAllDetails ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                                </button>
                                {showAllDetails && (
                                    <div className="mt-3 text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
                                )}
                            </div>
                        )}

                        {/* Media & Videos */}
                        {product.mediaLinks && product.mediaLinks.length > 0 && (
                            <div className="px-4 py-3 border-t border-border">
                                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Play size={14} className="text-[#2874F0]" /> Media & Videos
                                </h3>
                                <div className="space-y-3">
                                    {product.mediaLinks.map((media, i) => (
                                        <div key={i}>
                                            {media.type === 'video' ? (
                                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                    <iframe src={media.url.includes('youtube.com/watch') ? media.url.replace('watch?v=', 'embed/') : media.url.includes('youtu.be/') ? media.url.replace('youtu.be/', 'www.youtube.com/embed/') : media.url}
                                                        title={media.caption || `Video ${i + 1}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                                                </div>
                                            ) : (<img src={media.url} alt={media.caption || ''} className="w-full max-h-[400px] object-contain rounded-lg bg-muted" />)}
                                            {media.caption && <p className="text-[11px] text-muted-foreground mt-1 text-center italic">{media.caption}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="px-4 py-3 border-t border-border">
                            <h3 className="text-sm font-bold text-foreground mb-3">Reviews & Ratings</h3>
                            {reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {reviews.map((r) => (
                                        <div key={r._id} className="border-b border-border/50 pb-3 last:border-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                                    {r.rating} <Star size={8} fill="white" />
                                                </span>
                                                <span className="text-xs font-medium text-foreground">{r.name}</span>
                                                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{r.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>)}

                            {/* Review Form */}
                            <div className="mt-4 bg-muted/50 rounded-lg p-3">
                                <h4 className="text-xs font-bold text-foreground mb-2">Write a Review</h4>
                                <div className="space-y-2">
                                    <input type="text" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your Name"
                                        className="w-full border border-border bg-transparent text-foreground rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2874F0]" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground mr-1">Rating:</span>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button key={n} onClick={() => setReviewRating(n)}>
                                                <Star size={16} className={n <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Your review..." rows={2}
                                        className="w-full border border-border bg-transparent text-foreground rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2874F0] resize-none" />
                                    <button onClick={handleSubmitReview} disabled={submittingReview}
                                        className="bg-[#2874F0] text-white px-5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Buttons — Sticky at bottom of right column */}
                        <div className="hidden md:flex gap-3 p-4 border-t border-border bg-card/95 backdrop-blur-lg sticky bottom-0 z-30 shadow-[0_-2px_20px_rgba(0,0,0,0.1)]">
                            <button onClick={handleAddToCart} disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#2874F0] text-white py-3.5 rounded-lg font-bold text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors">
                                <ShoppingCart size={18} /> Add to Cart
                            </button>
                            <button onClick={handleBuyNow} disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#FB641B] text-white py-3.5 rounded-lg font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors">
                                <Zap size={18} /> Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/30 shadow-[0_-2px_20px_rgba(0,0,0,0.15)]">
                <div className="flex gap-3 p-3 px-4 justify-center">
                    <button onClick={handleAddToCart} disabled={isOutOfStock}
                        className="flex items-center justify-center gap-2 py-3 px-6 text-white font-bold text-sm rounded-full active:scale-95 disabled:opacity-50 transition-all shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #2874F0, #6C63FF)' }}>
                        <ShoppingCart size={16} /> ADD TO CART
                    </button>
                    <button onClick={handleBuyNow} disabled={isOutOfStock}
                        className="flex items-center justify-center gap-2 py-3 px-6 text-white font-bold text-sm rounded-full active:scale-95 disabled:opacity-50 transition-all shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #FB641B, #FF2D55)' }}>
                        <Zap size={16} /> BUY NOW
                    </button>
                </div>
            </div>

            {/* Fullscreen Viewer */}
            {
                fullscreenOpen && (
                    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-white text-sm">{fullscreenImage + 1}/{product.images.length}</span>
                            <div className="flex gap-2">
                                <button onClick={toggleZoom} className="text-white p-2"><ZoomIn size={20} /></button>
                                <button onClick={() => { setFullscreenOpen(false); setZoomScale(1); }} className="text-white p-2"><X size={22} /></button>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center overflow-hidden select-none"
                            onTouchStart={(e) => { if (zoomScale <= 1) fsTouchStartX.current = e.touches[0].clientX; }}
                            onTouchMove={(e) => { if (zoomScale <= 1) fsTouchEndX.current = e.touches[0].clientX; }}
                            onTouchEnd={() => { if (zoomScale <= 1) { const d = fsTouchStartX.current - fsTouchEndX.current; if (Math.abs(d) > 50) handleFsSwipe(d > 0 ? 1 : -1); } }}
                            onMouseDown={(e) => { if (zoomScale > 1) { setIsDragging(true); setDragStart({ x: e.clientX - zoomOffset.x, y: e.clientY - zoomOffset.y }); } }}
                            onMouseMove={(e) => { if (isDragging && zoomScale > 1) setZoomOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
                            onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
                            onDoubleClick={toggleZoom} style={{ cursor: zoomScale > 1 ? 'grab' : 'default' }}>
                            {product.images?.[fullscreenImage]?.url && (
                                <img src={product.images[fullscreenImage].url} alt={product.name}
                                    className="max-h-full max-w-full object-contain transition-transform duration-200"
                                    style={{ transform: `scale(${zoomScale}) translate(${zoomOffset.x / zoomScale}px, ${zoomOffset.y / zoomScale}px)` }} draggable={false} />
                            )}
                        </div>
                        {product.images.length > 1 && (
                            <>
                                <button onClick={() => handleFsSwipe(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full p-3"><ChevronLeft size={24} /></button>
                                <button onClick={() => handleFsSwipe(1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full p-3"><ChevronRight size={24} /></button>
                                <div className="flex justify-center gap-2 py-4">
                                    {product.images.map((_, i) => (
                                        <button key={i} onClick={() => { setFullscreenImage(i); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); }}
                                            className={`w-2 h-2 rounded-full ${i === fullscreenImage ? 'bg-white w-4' : 'bg-white/40'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )
            }
        </>
    );
}
