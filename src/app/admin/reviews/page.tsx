'use client';

import { useEffect, useState } from 'react';
import { Star, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Review { _id: string; productId: string; name: string; rating: number; comment: string; isApproved: boolean; createdAt: string; }

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchReviews = async () => {
        const params = new URLSearchParams();
        if (filter === 'pending') params.set('approved', 'false');
        if (filter === 'approved') params.set('approved', 'true');
        const res = await fetch(`/api/reviews?${params}`);
        const data = await res.json();
        setReviews(data.reviews || []);
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, [filter]);

    const handleApprove = async (id: string) => {
        await fetch(`/api/reviews/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isApproved: true }) });
        toast.success('Review approved');
        fetchReviews();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete?')) return;
        await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
        toast.success('Review deleted');
        fetchReviews();
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Reviews</h1>
            <div className="flex gap-2 mb-4">
                {['all', 'pending', 'approved'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${filter === f ? 'bg-[#2874F0] text-white' : 'bg-white text-gray-600 border'}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
                {loading ? <p className="text-gray-400">Loading...</p> :
                    reviews.length === 0 ? <p className="text-gray-400 bg-white rounded-lg p-8 text-center shadow-sm">No reviews found</p> :
                        reviews.map(r => (
                            <div key={r._id} className="bg-white rounded-lg p-4 shadow-sm flex gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                                            {r.rating} <Star size={10} fill="white" />
                                        </span>
                                        <span className="text-sm font-medium">{r.name}</span>
                                        {!r.isApproved && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>}
                                    </div>
                                    <p className="text-sm text-gray-600">{r.comment}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {!r.isApproved && (
                                        <button onClick={() => handleApprove(r._id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><Check size={16} /></button>
                                    )}
                                    <button onClick={() => handleDelete(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                }
            </div>
        </div>
    );
}
