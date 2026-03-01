import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    mrp: number;
    quantity: number;
    variant?: string;
    meeshoLink?: string;
}

export interface IOrder extends Document {
    orderId: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
        };
    };
    items: IOrderItem[];
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
    status: string;
    statusHistory: { status: string; date: Date; note?: string }[];
    trackingNumber: string;
    meeshoOrderId: string;
    adminNotes: string;
    couponCode: string;
    couponDiscount: number;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        orderId: { type: String, required: true, unique: true },
        customer: {
            name: { type: String, required: true },
            phone: { type: String, required: true },
            email: { type: String, default: '' },
            address: {
                line1: { type: String, required: true },
                line2: { type: String, default: '' },
                city: { type: String, required: true },
                state: { type: String, required: true },
                pincode: { type: String, required: true },
            },
        },
        items: [
            {
                productId: String,
                name: String,
                slug: String,
                image: String,
                price: Number,
                mrp: Number,
                quantity: Number,
                variant: String,
                meeshoLink: String,
            },
        ],
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        deliveryCharge: { type: Number, default: 0 },
        total: { type: Number, required: true },
        status: { type: String, default: 'pending', index: true },
        statusHistory: [{ status: String, date: { type: Date, default: Date.now }, note: String }],
        trackingNumber: { type: String, default: '' },
        meeshoOrderId: { type: String, default: '' },
        adminNotes: { type: String, default: '' },
        couponCode: { type: String, default: '' },
        couponDiscount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
