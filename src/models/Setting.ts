import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
    key: string;
    value: string;
    updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
    {
        key: { type: String, required: true, unique: true },
        value: { type: String, default: '' },
    },
    { timestamps: true }
);

const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

// Default settings
export const DEFAULT_SETTINGS: Record<string, string> = {
    storeName: 'RJ ESSENTIALS',
    tagline: 'Quality at Your Doorstep',
    logo: '',
    favicon: '',
    contactPhone: '',
    contactEmail: '',
    whatsappNumber: '',
    instagram: '',
    facebook: '',
    youtube: '',
    freeDeliveryAbove: '499',
    deliveryCharge: '49',
    codMessage: 'Pay when your order arrives at your doorstep',
    returnDays: '7',
    orderIdPrefix: 'RJE',
    adminEmail: '',
    gaId: '',
    announcementText: '🚚 Free Delivery on orders above ₹499',
    announcementColor: '#2874F0',
    announcementActive: 'true',
    maintenanceMode: 'false',
    metaTitle: 'RJ ESSENTIALS - Quality at Your Doorstep',
    metaDescription: 'Shop quality products at affordable prices. Cash on Delivery available across India.',
    ogImage: '',
    robotsTxt: 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml',
};

export default Setting;
