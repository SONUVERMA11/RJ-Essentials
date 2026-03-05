import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = req.nextUrl.searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        await connectDB();

        const order = await Order.findOne({
            orderId: orderId.toUpperCase(),
            'customer.email': session.user.email,
        }).lean();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            orderId: order.orderId,
            status: order.status,
            statusHistory: order.statusHistory || [],
            items: (order.items || []).map((i: { name: string; quantity: number; image: string }) => ({
                name: i.name,
                quantity: i.quantity,
                image: i.image,
            })),
            total: order.total,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
        });
    } catch (error) {
        console.error('Track user order error:', error);
        return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
    }
}
