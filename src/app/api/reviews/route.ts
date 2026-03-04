import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const approved = searchParams.get('approved');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (productId) filter.productId = productId;
        if (approved !== null && approved !== undefined) filter.isApproved = approved === 'true';

        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Review.countDocuments(filter),
        ]);

        return NextResponse.json({ reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error('Reviews GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 10 reviews per minute per IP
        const rateLimited = checkRateLimit(`reviews:${getClientIp(req)}`, { maxRequests: 10, windowSeconds: 60 });
        if (rateLimited) return rateLimited;

        await dbConnect();
        const body = await req.json();

        // Whitelist fields — force isApproved to false to prevent self-approval
        const { productId, name, rating, comment } = body;

        if (!productId || !name || !rating) {
            return NextResponse.json({ error: 'productId, name, and rating are required' }, { status: 400 });
        }

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        const review = await Review.create({
            productId,
            name: name.trim().slice(0, 100),
            rating,
            comment: (comment || '').trim().slice(0, 2000),
            isApproved: false,
        });

        // Update product ratings
        const reviews = await Review.find({ productId: body.productId, isApproved: true });
        if (reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            await Product.findByIdAndUpdate(body.productId, {
                ratings: { average: Math.round(avg * 10) / 10, count: reviews.length },
            });
        }

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        console.error('Reviews POST error:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
