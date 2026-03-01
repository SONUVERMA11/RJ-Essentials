import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
    productId: string;
    name: string;
    rating: number;
    comment: string;
    isApproved: boolean;
    createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        productId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        isApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
