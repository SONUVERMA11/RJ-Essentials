import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// POST: Validate and apply a coupon code
export async function POST(req: NextRequest) {
    try {
        // Rate limit coupon validations
        const rateLimited = checkRateLimit(`coupon:${getClientIp(req)}`, { maxRequests: 20, windowSeconds: 60 });
        if (rateLimited) return rateLimited;

        await dbConnect();
        const { code, orderTotal } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
        }

        if (new Date() > coupon.expiresAt) {
            return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
        }

        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
        }

        if (orderTotal && coupon.minOrderAmount > 0 && orderTotal < coupon.minOrderAmount) {
            return NextResponse.json(
                { error: `Minimum order amount is ₹${coupon.minOrderAmount}` },
                { status: 400 }
            );
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = Math.round((orderTotal || 0) * coupon.value / 100);
            if (coupon.maxDiscount > 0) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.value;
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discount,
            message: coupon.type === 'percentage'
                ? `${coupon.value}% off${coupon.maxDiscount > 0 ? ` (up to ₹${coupon.maxDiscount})` : ''}`
                : `₹${coupon.value} off`,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
    }
}
