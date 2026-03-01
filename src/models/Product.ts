import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    slug: string;
    category: string;
    brand: string;
    description: string;
    highlights: string[];
    specifications: { key: string; value: string }[];
    images: { url: string; publicId: string }[];
    mediaLinks: { type: 'image' | 'video'; url: string; caption: string }[];
    mrp: number;
    sellingPrice: number;
    stock: number;
    variants: { type: string; options: string[] }[];
    tags: string[];
    meeshoLink: string;
    meeshoNotes: string;
    returnDays: number;
    status: 'active' | 'draft' | 'hidden';
    isFeatured: boolean;
    isDealOfDay: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    soldCount: number;
    metaTitle: string;
    metaDescription: string;
    ratings: { average: number; count: number };
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        category: { type: String, required: true, index: true },
        brand: { type: String, default: '' },
        description: { type: String, default: '' },
        highlights: [{ type: String }],
        specifications: [{ key: String, value: String }],
        images: [{ url: String, publicId: String }],
        mediaLinks: [{ type: { type: String, enum: ['image', 'video'], default: 'image' }, url: String, caption: String }],
        mrp: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        variants: [{ type: { type: String }, options: [String] }],
        tags: [{ type: String }],
        meeshoLink: { type: String, default: '' },
        meeshoNotes: { type: String, default: '' },
        returnDays: { type: Number, default: 7 },
        status: { type: String, enum: ['active', 'draft', 'hidden'], default: 'active', index: true },
        isFeatured: { type: Boolean, default: false },
        isDealOfDay: { type: Boolean, default: false },
        isNewArrival: { type: Boolean, default: false },
        isBestSeller: { type: Boolean, default: false },
        soldCount: { type: Number, default: 0 },
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        ratings: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

ProductSchema.index({ name: 'text', tags: 'text', brand: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
