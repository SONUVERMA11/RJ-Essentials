import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISection extends Document {
    title: string;
    type: 'featured' | 'deal-of-day' | 'new-arrivals' | 'best-sellers' | 'category-picks' | 'custom';
    layout: 'grid' | 'carousel';
    productIds: string[];
    category: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
}

const SectionSchema = new Schema<ISection>(
    {
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ['featured', 'deal-of-day', 'new-arrivals', 'best-sellers', 'category-picks', 'custom'],
            default: 'custom',
        },
        layout: { type: String, enum: ['grid', 'carousel'], default: 'carousel' },
        productIds: [{ type: String }],
        category: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Section: Model<ISection> = mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);

export default Section;
