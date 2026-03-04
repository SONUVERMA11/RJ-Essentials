import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            Message.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Message.countDocuments(),
        ]);

        return NextResponse.json({ messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // Whitelist allowed fields to prevent mass assignment
        const { name, email, phone, subject, message } = body;

        if (!name || !message) {
            return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
        }

        const newMessage = await Message.create({
            name: name.trim(),
            email: email?.trim().toLowerCase(),
            phone: phone?.trim(),
            subject: subject?.trim(),
            message: message.trim(),
        });
        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
