import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAdmin } from '@/lib/adminAuth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const message = await Message.findByIdAndUpdate(id, body, { new: true });
        if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(message);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { id } = await params;
        await Message.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
