import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { generateOrderId, getEstimatedDelivery } from '@/lib/utils';
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email';
import { requireAdmin, escapeRegex } from '@/lib/adminAuth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await dbConnect();
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const city = searchParams.get('city');
        const state = searchParams.get('state');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (status) filter.status = status;
        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.$or = [
                { orderId: { $regex: escapedSearch, $options: 'i' } },
                { 'customer.name': { $regex: escapedSearch, $options: 'i' } },
                { 'customer.phone': { $regex: escapedSearch, $options: 'i' } },
            ];
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (city) filter['customer.address.city'] = { $regex: escapeRegex(city), $options: 'i' };
        if (state) filter['customer.address.state'] = { $regex: escapeRegex(state), $options: 'i' };

        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        return NextResponse.json({
            orders,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Orders GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Require authenticated user to place orders
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Please sign in to place an order' }, { status: 401 });
        }

        // Rate limit: 5 orders per minute per IP
        const rateLimited = checkRateLimit(`orders:${getClientIp(req)}`, { maxRequests: 5, windowSeconds: 60 });
        if (rateLimited) return rateLimited;

        await dbConnect();
        const body = await req.json();

        // Whitelist allowed fields to prevent mass assignment
        const { customer, items, total, subtotal } = body;

        if (!customer || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Customer and items are required' }, { status: 400 });
        }

        // Input length validation
        if (items.length > 50) {
            return NextResponse.json({ error: 'Maximum 50 items per order' }, { status: 400 });
        }
        if (!customer.name || customer.name.trim().length > 100) {
            return NextResponse.json({ error: 'Valid name is required (max 100 chars)' }, { status: 400 });
        }
        if (!customer.phone || !/^\d{10}$/.test(customer.phone)) {
            return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
        }
        if (!customer.address?.line1 || customer.address.line1.trim().length > 200) {
            return NextResponse.json({ error: 'Valid address is required (max 200 chars)' }, { status: 400 });
        }
        if (!customer.address?.pincode || !/^\d{6}$/.test(customer.address.pincode)) {
            return NextResponse.json({ error: 'Valid 6-digit pincode is required' }, { status: 400 });
        }

        // Stock validation — check all items have sufficient stock
        const productIds = items.map((i: { productId: string }) => i.productId);
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map(products.map((p: { _id: { toString: () => string }; stock: number; name: string }) => [p._id.toString(), p]));

        for (const item of items) {
            const product = productMap.get(item.productId) as { stock: number; name: string } | undefined;
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.name || item.productId}` }, { status: 400 });
            }
            if (product.stock < item.quantity) {
                return NextResponse.json(
                    { error: `"${product.name}" is out of stock (only ${product.stock} available)` },
                    { status: 400 }
                );
            }
        }

        const orderId = generateOrderId(body.orderIdPrefix || 'RJE');

        const order = await Order.create({
            customer,
            items,
            total,
            subtotal,
            orderId,
            status: 'pending',
            statusHistory: [{ status: 'pending', date: new Date() }],
        });

        // Update sold count for each product
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { soldCount: item.quantity, stock: -item.quantity },
            });
        }

        // Send emails (non-blocking)
        const emailData = {
            orderId,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            items,
            total,
            address: `${customer.address.line1}, ${customer.address.line2 ? customer.address.line2 + ', ' : ''}${customer.address.city}, ${customer.address.state} - ${customer.address.pincode}`,
            estimatedDelivery: getEstimatedDelivery(5),
        };

        if (customer.email) {
            sendOrderConfirmation(emailData).catch(console.error);
        }
        sendAdminOrderNotification(emailData).catch(console.error);

        return NextResponse.json({ order, orderId }, { status: 201 });
    } catch (error) {
        console.error('Orders POST error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
