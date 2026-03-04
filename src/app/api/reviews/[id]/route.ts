import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/adminAuth';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const review = await Review.findByIdAndUpdate(id, body, { new: true });
        if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Recalculate product ratings
        const reviews = await Review.find({ productId: review.productId, isApproved: true });
        const avg = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        await Product.findByIdAndUpdate(review.productId, {
            ratings: { average: Math.round(avg * 10) / 10, count: reviews.length },
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('Review PUT error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { id } = await params;
        const review = await Review.findByIdAndDelete(id);
        if (review) {
            const reviews = await Review.find({ productId: review.productId, isApproved: true });
            const avg = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
            await Product.findByIdAndUpdate(review.productId, {
                ratings: { average: Math.round(avg * 10) / 10, count: reviews.length },
            });
        }
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Review DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
