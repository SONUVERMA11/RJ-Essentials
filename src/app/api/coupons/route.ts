import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/adminAuth';

// GET: Admin — list all coupons
export async function GET() {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(coupons);
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST: Admin — create a coupon
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const body = await req.json();

        const coupon = await Coupon.create({
            code: body.code,
            type: body.type,
            value: body.value,
            minOrderAmount: body.minOrderAmount || 0,
            maxDiscount: body.maxDiscount || 0,
            usageLimit: body.usageLimit || 0,
            isActive: body.isActive !== false,
            expiresAt: body.expiresAt,
        });

        return NextResponse.json(coupon, { status: 201 });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
}
