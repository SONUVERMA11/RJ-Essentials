import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting, { DEFAULT_SETTINGS } from '@/models/Setting';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
    try {
        await dbConnect();
        const settings = await Setting.find().lean();
        const result: Record<string, string> = { ...DEFAULT_SETTINGS };
        settings.forEach((s) => { result[s.key] = s.value; });
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const body = await req.json();

        const updates = Object.entries(body).map(([key, value]) => ({
            updateOne: {
                filter: { key },
                update: { key, value: value as string },
                upsert: true,
            },
        }));

        await Setting.bulkWrite(updates);
        return NextResponse.json({ message: 'Settings updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
