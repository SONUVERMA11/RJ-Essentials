import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'month';

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const [
            totalOrders,
            pendingOrders,
            todayOrders,
            weekOrders,
            monthOrders,
            revenueResult,
            todayRevenueResult,
            ordersByStatus,
            dailyOrders,
            topProducts,
            topCities,
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } }),
            Order.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }),
            Order.countDocuments({ createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }),
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
            Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                        revenue: { $sum: '$total' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Order.aggregate([
                { $unwind: '$items' },
                { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
            ]),
            Order.aggregate([
                { $group: { _id: '$customer.address.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
        ]);

        return NextResponse.json({
            overview: {
                totalOrders,
                pendingOrders,
                todayOrders,
                weekOrders,
                monthOrders,
                totalRevenue: revenueResult[0]?.total || 0,
                todayRevenue: todayRevenueResult[0]?.total || 0,
            },
            ordersByStatus,
            dailyOrders,
            topProducts,
            topCities,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
