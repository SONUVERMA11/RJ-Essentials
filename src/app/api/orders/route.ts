import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { generateOrderId, getEstimatedDelivery } from '@/lib/utils';
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
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
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } },
            ];
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (city) filter['customer.address.city'] = { $regex: city, $options: 'i' };
        if (state) filter['customer.address.state'] = { $regex: state, $options: 'i' };

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
        await dbConnect();
        const body = await req.json();

        const orderId = generateOrderId(body.orderIdPrefix || 'RJE');

        const order = await Order.create({
            ...body,
            orderId,
            status: 'pending',
            statusHistory: [{ status: 'pending', date: new Date() }],
        });

        // Update sold count for each product
        for (const item of body.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { soldCount: item.quantity, stock: -item.quantity },
            });
        }

        // Send emails (non-blocking)
        const emailData = {
            orderId,
            customerName: body.customer.name,
            customerEmail: body.customer.email,
            customerPhone: body.customer.phone,
            items: body.items,
            total: body.total,
            address: `${body.customer.address.line1}, ${body.customer.address.line2 ? body.customer.address.line2 + ', ' : ''}${body.customer.address.city}, ${body.customer.address.state} - ${body.customer.address.pincode}`,
            estimatedDelivery: getEstimatedDelivery(5),
        };

        if (body.customer.email) {
            sendOrderConfirmation(emailData).catch(console.error);
        }
        sendAdminOrderNotification(emailData).catch(console.error);

        return NextResponse.json({ order, orderId }, { status: 201 });
    } catch (error) {
        console.error('Orders POST error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
