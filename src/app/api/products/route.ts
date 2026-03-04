import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');
        const status = searchParams.get('status') || 'active';
        const sort = searchParams.get('sort') || 'newest';
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const featured = searchParams.get('featured');
        const dealOfDay = searchParams.get('dealOfDay');
        const newArrival = searchParams.get('newArrival');
        const bestSeller = searchParams.get('bestSeller');
        const search = searchParams.get('search');
        const ids = searchParams.get('ids');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (status !== 'all') filter.status = status;
        if (category) filter.category = category;
        if (brand) filter.brand = brand;
        if (featured === 'true') filter.isFeatured = true;
        if (dealOfDay === 'true') filter.isDealOfDay = true;
        if (newArrival === 'true') filter.isNewArrival = true;
        if (bestSeller === 'true') filter.isBestSeller = true;
        if (minPrice || maxPrice) {
            filter.sellingPrice = {};
            if (minPrice) filter.sellingPrice.$gte = parseInt(minPrice);
            if (maxPrice) filter.sellingPrice.$lte = parseInt(maxPrice);
        }
        if (search) {
            filter.$text = { $search: search };
        }
        if (ids) {
            filter._id = { $in: ids.split(',') };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sortObj: any = { createdAt: -1 };
        switch (sort) {
            case 'price-low':
                sortObj = { sellingPrice: 1 };
                break;
            case 'price-high':
                sortObj = { sellingPrice: -1 };
                break;
            case 'popularity':
                sortObj = { soldCount: -1 };
                break;
            case 'rating':
                sortObj = { 'ratings.average': -1 };
                break;
            case 'newest':
            default:
                sortObj = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Product.countDocuments(filter),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Products GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const body = await req.json();
        const product = await Product.create(body);
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Products POST error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
