import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBanner extends Document {
    image: string;
    publicId: string;
    link: string;
    title: string;
    order: number;
    isActive: boolean;
    type: 'hero' | 'strip';
    createdAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        image: { type: String, required: true },
        publicId: { type: String, default: '' },
        link: { type: String, default: '' },
        title: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        type: { type: String, enum: ['hero', 'strip'], default: 'hero' },
    },
    { timestamps: true }
);

const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
