import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Page from '@/models/Page';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await dbConnect();
        const { slug } = await params;
        let page = await Page.findOne({ slug }).lean();
        if (!page) {
            // Create default page
            page = await Page.create({ slug, title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '), content: '' });
        }
        return NextResponse.json(page);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { slug } = await params;
        const body = await req.json();
        const page = await Page.findOneAndUpdate({ slug }, body, { new: true, upsert: true });
        return NextResponse.json(page);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
