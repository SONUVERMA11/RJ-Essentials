import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/models/Banner';

export async function GET() {
    try {
        await dbConnect();
        const banners = await Banner.find().sort({ order: 1 }).lean();
        return NextResponse.json(banners);
    } catch (error) {
        console.error('Banners GET error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const banner = await Banner.create(body);
        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        console.error('Banners POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
