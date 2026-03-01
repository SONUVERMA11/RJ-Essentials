import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const category = await Category.findByIdAndUpdate(id, body, { new: true });
        if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(category);
    } catch (error) {
        console.error('Category PUT error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        await Category.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Category DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
