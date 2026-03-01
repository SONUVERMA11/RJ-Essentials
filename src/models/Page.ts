import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPage extends Document {
    slug: string;
    title: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
    {
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        content: { type: String, default: '' },
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
    },
    { timestamps: true }
);

const Page: Model<IPage> = mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);

export default Page;
