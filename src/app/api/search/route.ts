import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q || q.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        const products = await Product.find({
            status: 'active',
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
            ],
        })
            .select('name slug images sellingPrice category')
            .limit(8)
            .lean();

        return NextResponse.json({
            suggestions: products.map((p) => ({
                name: p.name,
                slug: p.slug,
                image: p.images?.[0]?.url || '',
                price: p.sellingPrice,
                category: p.category,
            })),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
