import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { orderId, phone } = await req.json();

        if (!orderId || !phone) {
            return NextResponse.json({ error: 'Order ID and phone number are required' }, { status: 400 });
        }

        const order = await Order.findOne({
            orderId: orderId.toUpperCase(),
            'customer.phone': phone,
        }).lean();

        if (!order) {
            return NextResponse.json({ error: 'No order found with this ID and phone number' }, { status: 404 });
        }

        return NextResponse.json({
            orderId: order.orderId,
            status: order.status,
            statusHistory: order.statusHistory,
            items: order.items.map(i => ({ name: i.name, quantity: i.quantity, image: i.image })),
            total: order.total,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
        });
    } catch (error) {
        console.error('Track order error:', error);
        return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
    }
}
