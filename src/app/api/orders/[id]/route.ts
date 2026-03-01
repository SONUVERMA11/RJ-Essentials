import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendStatusUpdateEmail } from '@/lib/email';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const order = id.match(/^[0-9a-fA-F]{24}$/)
            ? await Order.findById(id).lean()
            : await Order.findOne({ orderId: id }).lean();

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Order GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // If status is being updated, add to status history
        if (body.status && body.status !== order.status) {
            order.statusHistory.push({
                status: body.status,
                date: new Date(),
                note: body.statusNote || '',
            });

            // Send status update email
            if (order.customer.email) {
                sendStatusUpdateEmail(
                    order.customer.email,
                    order.customer.name,
                    order.orderId,
                    body.status
                ).catch(console.error);
            }
        }

        Object.assign(order, body);
        await order.save();

        return NextResponse.json(order);
    } catch (error) {
        console.error('Order PUT error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
