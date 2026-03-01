import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    isRead: boolean;
    isReplied: boolean;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        name: { type: String, required: true },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        subject: { type: String, default: '' },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        isReplied: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
