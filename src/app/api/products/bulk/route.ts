import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Bulk operations on products
 * 
 * POST /api/products/bulk
 * Body: { action: string, ids: string[], data?: object }
 * 
 * Actions:
 *  - "activate"       → Set status to 'active'
 *  - "deactivate"     → Set status to 'hidden'
 *  - "draft"          → Set status to 'draft'
 *  - "delete"         → Delete all selected products
 *  - "feature"        → Set isFeatured = true
 *  - "unfeature"      → Set isFeatured = false
 *  - "deal"           → Set isDealOfDay = true
 *  - "undeal"         → Set isDealOfDay = false
 *  - "bestseller"     → Set isBestSeller = true
 *  - "unbestseller"   → Set isBestSeller = false
 *  - "newarrival"     → Set isNewArrival = true
 *  - "unnewarrival"   → Set isNewArrival = false
 *  - "update"         → Apply custom data to all selected
 *  - "setCategory"    → Set category to data.category
 *  - "setStock"       → Set stock to data.stock
 */
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdmin(req);
        if (authError) return authError;

        await dbConnect();
        const body = await req.json();
        const { action, ids, data } = body;

        if (!action || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Missing action or ids' },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case 'activate':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { status: 'active' } }
                );
                break;

            case 'deactivate':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { status: 'hidden' } }
                );
                break;

            case 'draft':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { status: 'draft' } }
                );
                break;

            case 'delete':
                result = await Product.deleteMany({ _id: { $in: ids } });
                return NextResponse.json({
                    message: `Deleted ${result.deletedCount} products`,
                    count: result.deletedCount,
                });

            case 'feature':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isFeatured: true } }
                );
                break;

            case 'unfeature':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isFeatured: false } }
                );
                break;

            case 'deal':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isDealOfDay: true } }
                );
                break;

            case 'undeal':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isDealOfDay: false } }
                );
                break;

            case 'bestseller':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isBestSeller: true } }
                );
                break;

            case 'unbestseller':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isBestSeller: false } }
                );
                break;

            case 'newarrival':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isNewArrival: true } }
                );
                break;

            case 'unnewarrival':
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { isNewArrival: false } }
                );
                break;

            case 'setCategory':
                if (!data?.category) {
                    return NextResponse.json({ error: 'Missing category' }, { status: 400 });
                }
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { category: data.category } }
                );
                break;

            case 'setStock':
                if (data?.stock === undefined) {
                    return NextResponse.json({ error: 'Missing stock value' }, { status: 400 });
                }
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: { stock: parseInt(data.stock) } }
                );
                break;

            case 'update':
                if (!data || Object.keys(data).length === 0) {
                    return NextResponse.json({ error: 'Missing update data' }, { status: 400 });
                }
                // Only allow safe fields
                const safeFields: Record<string, unknown> = {};
                const allowed = ['status', 'category', 'brand', 'stock', 'isFeatured', 'isDealOfDay', 'isNewArrival', 'isBestSeller', 'returnDays'];
                for (const key of allowed) {
                    if (data[key] !== undefined) safeFields[key] = data[key];
                }
                result = await Product.updateMany(
                    { _id: { $in: ids } },
                    { $set: safeFields }
                );
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            message: `${action} applied to ${result.modifiedCount} products`,
            count: result.modifiedCount,
        });
    } catch (error) {
        console.error('Bulk action error:', error);
        return NextResponse.json(
            { error: 'Bulk action failed' },
            { status: 500 }
        );
    }
}
