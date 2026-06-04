import { API_URL, AGENT_API_KEY, CLOUDINARY, IMAGES } from './config.js';
import { log, retryWithBackoff, downloadImage } from './utils.js';
import { v2 as cloudinary } from 'cloudinary';

// ─── Configure Cloudinary ────────────────────────────────────────────
cloudinary.config({
    cloud_name: CLOUDINARY.cloudName,
    api_key: CLOUDINARY.apiKey,
    api_secret: CLOUDINARY.apiSecret,
});

// ─── Types ───────────────────────────────────────────────────────────
export interface Product {
    _id?: string;
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
    soldCount?: number;
    metaTitle: string;
    metaDescription: string;
    ratings?: { average: number; count: number };
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    _id?: string;
    name: string;
    slug: string;
    icon: string;
    image: string;
    order: number;
    isActive: boolean;
    parentCategory: string | null;
}

export interface Order {
    _id?: string;
    orderId: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
        };
    };
    items: {
        productId: string;
        name: string;
        slug: string;
        image: string;
        price: number;
        mrp: number;
        quantity: number;
        variant?: string;
        meeshoLink?: string;
    }[];
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
    status: string;
    statusHistory: { status: string; date: string; note?: string }[];
    trackingNumber: string;
    meeshoOrderId: string;
    adminNotes: string;
    couponCode: string;
    couponDiscount: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}

export interface PaginatedResponse<T> {
    products?: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// ─── Auth Headers ────────────────────────────────────────────────────
function authHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGENT_API_KEY}`,
    };
}

// ─── Generic API Call ────────────────────────────────────────────────
async function apiCall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown
): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = {
        method,
        headers: authHeaders(),
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API ${method} ${endpoint} failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
}

// ─── Products API ────────────────────────────────────────────────────
export async function getProducts(params: Record<string, string> = {}): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams({ status: 'all', ...params });
    return apiCall<PaginatedResponse<Product>>(`/products?${searchParams.toString()}`);
}

export async function getProductById(id: string): Promise<Product> {
    return apiCall<Product>(`/products/${id}`);
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
    return retryWithBackoff(() => apiCall<Product>('/products', 'POST', product));
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return retryWithBackoff(() => apiCall<Product>(`/products/${id}`, 'PUT', updates));
}

// ─── Categories API ──────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
    return apiCall<Category[]>('/categories');
}

export async function createCategory(category: Partial<Category>): Promise<Category> {
    return retryWithBackoff(() => apiCall<Category>('/categories', 'POST', category));
}

// ─── Orders API ──────────────────────────────────────────────────────
export async function getOrders(params: Record<string, string> = {}): Promise<{ orders: Order[]; pagination: { total: number } }> {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/orders?${searchParams.toString()}`);
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    return retryWithBackoff(() => apiCall<Order>(`/orders/${id}`, 'PUT', updates));
}

// ─── Banners API ─────────────────────────────────────────────────────
export interface Banner {
    _id?: string;
    image: string;
    publicId: string;
    link: string;
    title: string;
    order: number;
    isActive: boolean;
    type: 'hero' | 'strip';
    createdAt?: string;
}

export async function getBanners(): Promise<Banner[]> {
    return apiCall<Banner[]>('/banners');
}

export async function createBanner(banner: Partial<Banner>): Promise<Banner> {
    return retryWithBackoff(() => apiCall<Banner>('/banners', 'POST', banner));
}

export async function updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
    return retryWithBackoff(() => apiCall<Banner>(`/banners/${id}`, 'PUT', updates));
}

export async function deleteBanner(id: string): Promise<void> {
    return apiCall(`/banners/${id}`, 'DELETE');
}

// ─── Sections API ────────────────────────────────────────────────────
export interface Section {
    _id?: string;
    title: string;
    type: 'featured' | 'deal-of-day' | 'new-arrivals' | 'best-sellers' | 'category-picks' | 'custom';
    layout: 'grid' | 'carousel';
    productIds: string[];
    category: string;
    order: number;
    isActive: boolean;
    createdAt?: string;
}

export async function getSections(): Promise<Section[]> {
    return apiCall<Section[]>('/sections');
}

export async function createSection(section: Partial<Section>): Promise<Section> {
    return retryWithBackoff(() => apiCall<Section>('/sections', 'POST', section));
}

export async function updateSection(id: string, updates: Partial<Section>): Promise<Section> {
    return retryWithBackoff(() => apiCall<Section>(`/sections/${id}`, 'PUT', updates));
}

// ─── Settings API ────────────────────────────────────────────────────
export async function getSettings(): Promise<Record<string, string>> {
    return apiCall<Record<string, string>>('/settings');
}

export async function updateSettings(settings: Record<string, string>): Promise<void> {
    return retryWithBackoff(() => apiCall('/settings', 'PUT', settings));
}

// ─── Analytics API ───────────────────────────────────────────────────
export async function getAnalytics(params: Record<string, string> = {}): Promise<unknown> {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/analytics?${searchParams.toString()}`);
}

// ─── Image Upload ────────────────────────────────────────────────────

/**
 * Upload an image buffer directly to Cloudinary (bypasses the web API for efficiency).
 */
export async function uploadImageBuffer(
    buffer: Buffer,
    folder: string = IMAGES.cloudinaryFolder
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
        cloudinary.uploader.upload(
            base64,
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            },
            (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary upload failed: ${error.message}`));
                } else if (result) {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        width: result.width,
                        height: result.height,
                    });
                } else {
                    reject(new Error('Cloudinary upload returned no result'));
                }
            }
        );
    });
}

/**
 * Upload an image from a URL: downloads it first, then uploads to Cloudinary.
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    folder?: string
): Promise<CloudinaryUploadResult> {
    log('api-client', 'INFO', `Downloading image: ${imageUrl}`);
    const buffer = await downloadImage(imageUrl);
    log('api-client', 'INFO', `Uploading to Cloudinary (${Math.round(buffer.length / 1024)}KB)...`);
    return uploadImageBuffer(buffer, folder);
}

// ─── Test Connection ─────────────────────────────────────────────────
export async function testConnection(): Promise<boolean> {
    try {
        const categories = await getCategories();
        log('api-client', 'SUCCESS', `Connected! Found ${categories.length} categories.`);
        return true;
    } catch (error) {
        log('api-client', 'ERROR', `Connection failed: ${(error as Error).message}`);
        return false;
    }
}
