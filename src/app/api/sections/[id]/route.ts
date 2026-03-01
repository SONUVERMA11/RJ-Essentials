import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Section from '@/models/Section';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const section = await Section.findByIdAndUpdate(id, body, { new: true });
        if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(section);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        await Section.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
