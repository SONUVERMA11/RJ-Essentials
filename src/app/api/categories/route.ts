import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
    try {
        await dbConnect();
        const categories = await Category.find().sort({ order: 1 }).lean();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Categories GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const category = await Category.create(body);
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Categories POST error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
