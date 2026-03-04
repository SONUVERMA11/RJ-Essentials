import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscount: number;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        type: { type: String, enum: ['percentage', 'fixed'], required: true },
        value: { type: Number, required: true },
        minOrderAmount: { type: Number, default: 0 },
        maxDiscount: { type: Number, default: 0 }, // 0 means no cap
        usageLimit: { type: Number, default: 0 }, // 0 means unlimited
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

CouponSchema.index({ code: 1 });

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
