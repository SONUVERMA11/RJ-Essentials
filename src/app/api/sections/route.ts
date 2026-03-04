import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Section from '@/models/Section';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
    try {
        await dbConnect();
        const sections = await Section.find().sort({ order: 1 }).lean();
        return NextResponse.json(sections);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const body = await req.json();
        const section = await Section.create(body);
        return NextResponse.json(section, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
