import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

// ─── Base URLs ───────────────────────────────────────────────────────
export const BASE_URL = process.env.AGENT_BASE_URL || 'https://rj-essentials.vercel.app';
export const API_URL = `${BASE_URL}/api`;

// ─── Auth ────────────────────────────────────────────────────────────
export const AGENT_API_KEY = process.env.AGENT_API_KEY || '';

// ─── Cloudinary (direct upload, bypasses web API) ────────────────────
export const CLOUDINARY = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
};

// ─── MongoDB (direct DB access for analytics) ────────────────────────
export const MONGODB_URI = process.env.MONGODB_URI || '';

// ─── Directories ─────────────────────────────────────────────────────
export const AGENTS_DIR = __dirname;
export const OUTPUT_DIR = path.join(__dirname, 'output');
export const TEMPLATES_DIR = path.join(__dirname, 'templates');
export const LOGS_DIR = path.join(OUTPUT_DIR, 'logs');
export const SOCIAL_CONTENT_DIR = path.join(OUTPUT_DIR, 'social-content');
export const REPORTS_DIR = path.join(OUTPUT_DIR, 'reports');

// ─── Scraping Settings ──────────────────────────────────────────────
export const SCRAPING = {
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    ],
    minDelay: 2000,   // ms between requests
    maxDelay: 5000,
    maxRetries: 3,
    timeout: 30000,   // request timeout
};

// ─── Image Settings ──────────────────────────────────────────────────
export const IMAGES = {
    minWidth: 800,
    minHeight: 800,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    cloudinaryFolder: 'rj-essentials',
    // Product detail image dimensions
    specsCard: { width: 1200, height: 800 },
    highlightsCard: { width: 1200, height: 800 },
    comparisonCard: { width: 1200, height: 600 },
    // Social media dimensions
    instagramPost: { width: 1080, height: 1080 },
    instagramStory: { width: 1080, height: 1920 },
    facebookBanner: { width: 1200, height: 630 },
    whatsappStatus: { width: 1080, height: 1080 },
};

// ─── Pricing Strategy ────────────────────────────────────────────────
export const PRICING = {
    defaultMarkupPercent: 25,      // 25% markup over source price
    minMarginPercent: 15,          // never go below 15% margin
    roundToNearest: 9,             // price ending (e.g., ₹499, ₹999)
    freeDeliveryAbove: 499,
    deliveryCharge: 49,
};

// ─── Brand ───────────────────────────────────────────────────────────
export const BRAND = {
    name: 'RJ ESSENTIALS',
    tagline: 'Quality at Your Doorstep',
    primaryColor: '#2874F0',
    secondaryColor: '#FF6E40',
    accentColor: '#388E3C',
    bgDark: '#0D1117',
    bgLight: '#FFFFFF',
    font: 'Inter, Arial, sans-serif',
    fontBold: 'Inter, Arial, sans-serif',
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918287386760',
    websiteUrl: BASE_URL,
};

// ─── Image Source Priority ───────────────────────────────────────────
// Meesho images are NEVER used — they contain watermarks and product IDs
export const IMAGE_SOURCES = ['amazon', 'flipkart', 'brand-website', 'ai-generated'] as const;
export type ImageSource = (typeof IMAGE_SOURCES)[number];

// ─── Validate Config ─────────────────────────────────────────────────
export function validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!AGENT_API_KEY) errors.push('AGENT_API_KEY is not set in .env.local');
    if (!CLOUDINARY.cloudName) errors.push('CLOUDINARY_CLOUD_NAME is not set');
    if (!CLOUDINARY.apiKey) errors.push('CLOUDINARY_API_KEY is not set');
    if (!MONGODB_URI) errors.push('MONGODB_URI is not set');
    return { valid: errors.length === 0, errors };
}
