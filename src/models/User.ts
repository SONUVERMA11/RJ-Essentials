import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedAddress {
    label: string;
    name: string;
    phone: string;
    email?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    provider: 'credentials' | 'google';
    savedAddresses: ISavedAddress[];
    createdAt: Date;
    updatedAt: Date;
}

const SavedAddressSchema = new Schema({
    label: { type: String, default: 'Home' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
        savedAddresses: { type: [SavedAddressSchema], default: [] },
    },
    { timestamps: true }
);

UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
