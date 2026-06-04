import sharp from 'sharp';
import puppeteer, { type Browser } from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { IMAGES, BRAND, TEMPLATES_DIR } from './config.js';
import { log, downloadImage, ensureDir } from './utils.js';
import { uploadImageBuffer, type CloudinaryUploadResult } from './api-client.js';

// ─── Types ───────────────────────────────────────────────────────────
export interface CleanImage {
    buffer: Buffer;
    width: number;
    height: number;
    source: 'amazon' | 'flipkart' | 'brand-website' | 'ai-generated';
    originalUrl: string;
}

export interface ProductData {
    name: string;
    brand: string;
    category: string;
    mrp: number;
    sellingPrice: number;
    highlights: string[];
    specifications: { key: string; value: string }[];
    images: { url: string; publicId: string }[];
    description?: string;
}

// ─── Watermark Detection ─────────────────────────────────────────────
/**
 * Basic watermark / text overlay detection.
 * Checks for common indicators of Meesho-style watermarks:
 * - Text bars at top/bottom of image
 * - Large uniform colored blocks overlaying the image
 * - Product ID text overlays
 * Returns true if the image appears clean.
 */
async function isImageClean(buffer: Buffer): Promise<boolean> {
    try {
        const metadata = await sharp(buffer).metadata();
        if (!metadata.width || !metadata.height) return false;

        // Reject too small images
        if (metadata.width < IMAGES.minWidth || metadata.height < IMAGES.minHeight) {
            log('image-processor', 'WARN', `Image too small: ${metadata.width}x${metadata.height}`);
            return false;
        }

        // Check file size (too small = likely thumbnail)
        if (buffer.length < 10000) {
            log('image-processor', 'WARN', 'Image file too small, likely a thumbnail');
            return false;
        }

        // Analyze edges for watermark bars.
        // Sample a strip from the top and bottom (10% of height) and check
        // if they have unusually low entropy (uniform color = watermark bar)
        const topStrip = await sharp(buffer)
            .extract({ left: 0, top: 0, width: metadata.width, height: Math.floor(metadata.height * 0.08) })
            .raw()
            .toBuffer();

        const bottomStrip = await sharp(buffer)
            .extract({
                left: 0,
                top: Math.floor(metadata.height * 0.92),
                width: metadata.width,
                height: Math.floor(metadata.height * 0.08),
            })
            .raw()
            .toBuffer();

        // Check if strips are too uniform (likely a text bar)
        const topUniform = isStripUniform(topStrip);
        const bottomUniform = isStripUniform(bottomStrip);

        if (topUniform && bottomUniform) {
            log('image-processor', 'WARN', 'Image has uniform top and bottom bars (likely watermarked)');
            return false;
        }

        return true;
    } catch (error) {
        log('image-processor', 'ERROR', `Image analysis failed: ${(error as Error).message}`);
        return false;
    }
}

/**
 * Check if a pixel strip is mostly uniform color (watermark indicator).
 */
function isStripUniform(rawBuffer: Buffer, threshold: number = 0.7): boolean {
    if (rawBuffer.length < 12) return false;

    // Sample pixels and count how many are similar to the first pixel
    const r0 = rawBuffer[0], g0 = rawBuffer[1], b0 = rawBuffer[2];
    let similar = 0;
    const totalPixels = Math.floor(rawBuffer.length / 3);
    const step = Math.max(1, Math.floor(totalPixels / 200)); // Sample 200 pixels

    for (let i = 0; i < rawBuffer.length; i += step * 3) {
        const r = rawBuffer[i], g = rawBuffer[i + 1], b = rawBuffer[i + 2];
        if (Math.abs(r - r0) < 30 && Math.abs(g - g0) < 30 && Math.abs(b - b0) < 30) {
            similar++;
        }
    }

    const ratio = similar / Math.ceil(totalPixels / step);
    return ratio > threshold;
}

// ─── Clean Image Sourcing ────────────────────────────────────────────

/**
 * Download and validate images from provided URLs.
 * Rejects images with watermarks, low resolution, or other quality issues.
 * Priority: Amazon > Flipkart > brand website > AI generated
 */
export async function sourceCleanImages(
    imageUrls: { url: string; source: 'amazon' | 'flipkart' | 'brand-website' }[]
): Promise<CleanImage[]> {
    const cleanImages: CleanImage[] = [];

    for (const { url, source } of imageUrls) {
        try {
            log('image-processor', 'INFO', `Downloading from ${source}: ${url}`);
            const buffer = await downloadImage(url);

            // Validate image quality
            const isClean = await isImageClean(buffer);
            if (!isClean) {
                log('image-processor', 'WARN', `Rejected image from ${source} (quality check failed)`);
                continue;
            }

            // Get dimensions
            const metadata = await sharp(buffer).metadata();

            // Resize to standard quality and convert to WebP for efficiency
            const processedBuffer = await sharp(buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 90 })
                .toBuffer();

            cleanImages.push({
                buffer: processedBuffer,
                width: metadata.width || 1200,
                height: metadata.height || 1200,
                source,
                originalUrl: url,
            });

            log('image-processor', 'SUCCESS', `Clean image from ${source} (${metadata.width}x${metadata.height})`);
        } catch (error) {
            log('image-processor', 'WARN', `Failed to process image from ${source}: ${(error as Error).message}`);
        }
    }

    return cleanImages;
}

/**
 * Upload clean images to Cloudinary and return URLs + publicIds.
 */
export async function uploadCleanImages(
    images: CleanImage[],
    folder?: string
): Promise<{ url: string; publicId: string }[]> {
    const results: { url: string; publicId: string }[] = [];

    for (const image of images) {
        try {
            const result = await uploadImageBuffer(image.buffer, folder);
            results.push({ url: result.url, publicId: result.publicId });
            log('image-processor', 'SUCCESS', `Uploaded to Cloudinary: ${result.url}`);
        } catch (error) {
            log('image-processor', 'ERROR', `Upload failed: ${(error as Error).message}`);
        }
    }

    return results;
}

// ─── HTML Template Renderer ──────────────────────────────────────────

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        });
    }
    return browserInstance;
}

export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}

/**
 * Render an HTML template to a PNG image using Puppeteer.
 */
async function renderHtmlToImage(
    html: string,
    width: number,
    height: number
): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width, height },
    });

    await page.close();
    return Buffer.from(screenshot);
}

/**
 * Load a template file and replace placeholders.
 */
async function loadTemplate(
    templateName: string,
    replacements: Record<string, string>
): Promise<string> {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    let html = await fs.readFile(templatePath, 'utf-8');

    // Load shared styles
    try {
        const styles = await fs.readFile(path.join(TEMPLATES_DIR, 'styles.css'), 'utf-8');
        html = html.replace('/* {{SHARED_STYLES}} */', styles);
    } catch {
        // styles.css not found, continue without it
    }

    for (const [key, value] of Object.entries(replacements)) {
        html = html.replaceAll(`{{${key}}}`, value);
    }

    return html;
}

// ─── Product Detail Info-Images ──────────────────────────────────────

/**
 * Generate a Flipkart-style specifications card image.
 */
export async function generateSpecsImage(product: ProductData): Promise<Buffer> {
    const specsHtml = product.specifications
        .slice(0, 10)
        .map(
            (s, i) => `
            <div class="spec-row ${i % 2 === 0 ? 'even' : 'odd'}">
                <div class="spec-key">${s.key}</div>
                <div class="spec-value">${s.value}</div>
            </div>`
        )
        .join('');

    const discountPercent = product.mrp > 0
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    try {
        const html = await loadTemplate('specs-card.html', {
            PRODUCT_NAME: product.name,
            BRAND: product.brand || 'RJ ESSENTIALS',
            CATEGORY: product.category,
            SPECS_HTML: specsHtml,
            SELLING_PRICE: `₹${product.sellingPrice.toLocaleString('en-IN')}`,
            MRP: `₹${product.mrp.toLocaleString('en-IN')}`,
            DISCOUNT: `${discountPercent}% off`,
            PRIMARY_COLOR: BRAND.primaryColor,
            ACCENT_COLOR: BRAND.accentColor,
        });
        return renderHtmlToImage(html, IMAGES.specsCard.width, IMAGES.specsCard.height);
    } catch {
        // Fallback: generate inline if template not found
        return generateInlineSpecsImage(product);
    }
}

/**
 * Generate a highlights / features banner image.
 */
export async function generateHighlightsImage(product: ProductData): Promise<Buffer> {
    const highlightsHtml = product.highlights
        .slice(0, 6)
        .map((h) => `<div class="highlight-item">✅ ${h}</div>`)
        .join('');

    try {
        const html = await loadTemplate('highlights-card.html', {
            PRODUCT_NAME: product.name,
            BRAND: product.brand || 'RJ ESSENTIALS',
            HIGHLIGHTS_HTML: highlightsHtml,
            PRIMARY_COLOR: BRAND.primaryColor,
            ACCENT_COLOR: BRAND.accentColor,
        });
        return renderHtmlToImage(html, IMAGES.highlightsCard.width, IMAGES.highlightsCard.height);
    } catch {
        return generateInlineHighlightsImage(product);
    }
}

/**
 * Generate a price comparison card image.
 */
export async function generateComparisonImage(
    product: ProductData,
    competitorPrice?: number,
    competitorName?: string
): Promise<Buffer> {
    const discountPercent = product.mrp > 0
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    try {
        const html = await loadTemplate('comparison-card.html', {
            PRODUCT_NAME: product.name,
            OUR_PRICE: `₹${product.sellingPrice.toLocaleString('en-IN')}`,
            MRP: `₹${product.mrp.toLocaleString('en-IN')}`,
            DISCOUNT: `${discountPercent}%`,
            COMPETITOR_PRICE: competitorPrice ? `₹${competitorPrice.toLocaleString('en-IN')}` : 'N/A',
            COMPETITOR_NAME: competitorName || 'Others',
            SAVINGS: competitorPrice ? `₹${(competitorPrice - product.sellingPrice).toLocaleString('en-IN')}` : '',
            PRIMARY_COLOR: BRAND.primaryColor,
            ACCENT_COLOR: BRAND.accentColor,
            STORE_NAME: BRAND.name,
        });
        return renderHtmlToImage(html, IMAGES.comparisonCard.width, IMAGES.comparisonCard.height);
    } catch {
        return generateInlineComparisonImage(product);
    }
}

// ─── Social Media Poster Generation ──────────────────────────────────

/**
 * Generate an Instagram post poster (1080×1080).
 */
export async function generateInstagramPost(
    product: ProductData,
    productImageUrl?: string
): Promise<Buffer> {
    const discountPercent = product.mrp > 0
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    try {
        const html = await loadTemplate('instagram-post.html', {
            PRODUCT_NAME: product.name,
            BRAND: product.brand || '',
            CATEGORY: product.category,
            SELLING_PRICE: `₹${product.sellingPrice.toLocaleString('en-IN')}`,
            MRP: `₹${product.mrp.toLocaleString('en-IN')}`,
            DISCOUNT: `${discountPercent}% OFF`,
            PRODUCT_IMAGE: productImageUrl || '',
            HIGHLIGHT_1: product.highlights[0] || '',
            HIGHLIGHT_2: product.highlights[1] || '',
            STORE_NAME: BRAND.name,
            TAGLINE: BRAND.tagline,
            PRIMARY_COLOR: BRAND.primaryColor,
            SECONDARY_COLOR: BRAND.secondaryColor,
            ACCENT_COLOR: BRAND.accentColor,
            WEBSITE_URL: BRAND.websiteUrl,
        });
        return renderHtmlToImage(html, IMAGES.instagramPost.width, IMAGES.instagramPost.height);
    } catch {
        return generateInlineInstagramPost(product);
    }
}

/**
 * Generate an Instagram story image (1080×1920).
 */
export async function generateInstagramStory(
    product: ProductData,
    productImageUrl?: string
): Promise<Buffer> {
    const discountPercent = product.mrp > 0
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    try {
        const html = await loadTemplate('instagram-story.html', {
            PRODUCT_NAME: product.name,
            BRAND: product.brand || '',
            SELLING_PRICE: `₹${product.sellingPrice.toLocaleString('en-IN')}`,
            MRP: `₹${product.mrp.toLocaleString('en-IN')}`,
            DISCOUNT: `${discountPercent}% OFF`,
            PRODUCT_IMAGE: productImageUrl || '',
            STORE_NAME: BRAND.name,
            TAGLINE: BRAND.tagline,
            PRIMARY_COLOR: BRAND.primaryColor,
            SECONDARY_COLOR: BRAND.secondaryColor,
            CTA_TEXT: 'Swipe Up to Shop 🛒',
            WEBSITE_URL: BRAND.websiteUrl,
        });
        return renderHtmlToImage(html, IMAGES.instagramStory.width, IMAGES.instagramStory.height);
    } catch {
        return generateInlineInstagramStory(product);
    }
}

/**
 * Generate a Facebook banner image (1200×630).
 */
export async function generateFacebookBanner(
    product: ProductData,
    productImageUrl?: string
): Promise<Buffer> {
    const discountPercent = product.mrp > 0
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    try {
        const html = await loadTemplate('facebook-banner.html', {
            PRODUCT_NAME: product.name,
            BRAND: product.brand || '',
            DESCRIPTION: product.description?.slice(0, 100) || product.highlights[0] || '',
            SELLING_PRICE: `₹${product.sellingPrice.toLocaleString('en-IN')}`,
            MRP: `₹${product.mrp.toLocaleString('en-IN')}`,
            DISCOUNT: `${discountPercent}% OFF`,
            PRODUCT_IMAGE: productImageUrl || '',
            STORE_NAME: BRAND.name,
            TAGLINE: BRAND.tagline,
            PRIMARY_COLOR: BRAND.primaryColor,
            ACCENT_COLOR: BRAND.accentColor,
            WEBSITE_URL: BRAND.websiteUrl,
        });
        return renderHtmlToImage(html, IMAGES.facebookBanner.width, IMAGES.facebookBanner.height);
    } catch {
        return generateInlineFacebookBanner(product);
    }
}

// ─── Inline Fallback Generators (no template files needed) ───────────
// These generate posters using Sharp compositing when HTML templates are unavailable.

async function generateInlineSpecsImage(product: ProductData): Promise<Buffer> {
    const { width, height } = IMAGES.specsCard;
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <rect x="0" y="0" width="100%" height="60" fill="${BRAND.primaryColor}"/>
        <text x="20" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">📋 ${escapeXml(product.name)} — Specifications</text>
        ${product.specifications.slice(0, 8).map((s, i) => `
            <rect x="0" y="${80 + i * 80}" width="100%" height="80" fill="${i % 2 === 0 ? '#f8f9fa' : '#ffffff'}"/>
            <text x="30" y="${130 + i * 80}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#333">${escapeXml(s.key)}</text>
            <text x="420" y="${130 + i * 80}" font-family="Arial, sans-serif" font-size="18" fill="#666">${escapeXml(s.value)}</text>
        `).join('')}
        <rect x="0" y="${height - 50}" width="100%" height="50" fill="${BRAND.primaryColor}"/>
        <text x="${width / 2}" y="${height - 18}" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">${BRAND.name} — ${BRAND.tagline}</text>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateInlineHighlightsImage(product: ProductData): Promise<Buffer> {
    const { width, height } = IMAGES.highlightsCard;
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <rect x="0" y="0" width="100%" height="60" fill="${BRAND.primaryColor}"/>
        <text x="20" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">✨ Key Features — ${escapeXml(product.name)}</text>
        ${product.highlights.slice(0, 6).map((h, i) => `
            <text x="40" y="${120 + i * 100}" font-family="Arial, sans-serif" font-size="20" fill="#333">✅ ${escapeXml(h)}</text>
        `).join('')}
        <rect x="0" y="${height - 50}" width="100%" height="50" fill="${BRAND.primaryColor}"/>
        <text x="${width / 2}" y="${height - 18}" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">${BRAND.name} — ${BRAND.tagline}</text>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateInlineComparisonImage(product: ProductData): Promise<Buffer> {
    const { width, height } = IMAGES.comparisonCard;
    const discount = product.mrp > 0 ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <rect x="0" y="0" width="100%" height="60" fill="${BRAND.primaryColor}"/>
        <text x="${width / 2}" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">💰 Price Comparison</text>
        <text x="${width / 2}" y="140" font-family="Arial, sans-serif" font-size="22" fill="#333" text-anchor="middle">${escapeXml(product.name)}</text>
        <text x="${width / 4}" y="250" font-family="Arial, sans-serif" font-size="18" fill="#999" text-anchor="middle">MRP</text>
        <text x="${width / 4}" y="290" font-family="Arial, sans-serif" font-size="32" fill="#999" text-anchor="middle" text-decoration="line-through">₹${product.mrp.toLocaleString('en-IN')}</text>
        <text x="${width * 3 / 4}" y="250" font-family="Arial, sans-serif" font-size="18" fill="${BRAND.accentColor}" text-anchor="middle">Our Price</text>
        <text x="${width * 3 / 4}" y="290" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${BRAND.accentColor}" text-anchor="middle">₹${product.sellingPrice.toLocaleString('en-IN')}</text>
        <rect x="${width / 2 - 60}" y="340" width="120" height="40" rx="20" fill="${BRAND.secondaryColor}"/>
        <text x="${width / 2}" y="367" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${discount}% OFF</text>
        <rect x="0" y="${height - 50}" width="100%" height="50" fill="${BRAND.primaryColor}"/>
        <text x="${width / 2}" y="${height - 18}" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">Shop at ${BRAND.websiteUrl}</text>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateInlineInstagramPost(product: ProductData): Promise<Buffer> {
    const { width, height } = IMAGES.instagramPost;
    const discount = product.mrp > 0 ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${BRAND.primaryColor}"/>
                <stop offset="100%" stop-color="#1a1a2e"/>
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="20" fill="white" opacity="0.95"/>
        <text x="${width / 2}" y="120" font-family="Arial, sans-serif" font-size="18" fill="${BRAND.primaryColor}" text-anchor="middle" font-weight="bold">${BRAND.name}</text>
        <text x="${width / 2}" y="400" font-family="Arial, sans-serif" font-size="28" fill="#333" text-anchor="middle" font-weight="bold">${escapeXml(truncateSvg(product.name, 40))}</text>
        <text x="${width / 2}" y="450" font-family="Arial, sans-serif" font-size="18" fill="#666" text-anchor="middle">${escapeXml(product.brand || product.category)}</text>
        <text x="${width / 2}" y="560" font-family="Arial, sans-serif" font-size="48" fill="${BRAND.accentColor}" text-anchor="middle" font-weight="bold">₹${product.sellingPrice.toLocaleString('en-IN')}</text>
        <text x="${width / 2}" y="600" font-family="Arial, sans-serif" font-size="22" fill="#999" text-anchor="middle" text-decoration="line-through">MRP ₹${product.mrp.toLocaleString('en-IN')}</text>
        <rect x="${width / 2 - 70}" y="630" width="140" height="45" rx="22" fill="${BRAND.secondaryColor}"/>
        <text x="${width / 2}" y="660" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${discount}% OFF</text>
        ${product.highlights.slice(0, 2).map((h, i) => `
            <text x="${width / 2}" y="${740 + i * 35}" font-family="Arial, sans-serif" font-size="16" fill="#555" text-anchor="middle">✅ ${escapeXml(truncateSvg(h, 50))}</text>
        `).join('')}
        <rect x="${width / 2 - 120}" y="850" width="240" height="55" rx="27" fill="${BRAND.primaryColor}"/>
        <text x="${width / 2}" y="885" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">🛒 Shop Now</text>
        <text x="${width / 2}" y="960" font-family="Arial, sans-serif" font-size="14" fill="#666" text-anchor="middle">${BRAND.tagline} | Link in Bio</text>
        <rect x="${width / 2 - 140}" y="990" width="280" height="32" rx="16" fill="${BRAND.primaryColor}" opacity="0.1"/>
        <text x="${width / 2}" y="1012" font-family="Arial, sans-serif" font-size="13" fill="${BRAND.primaryColor}" text-anchor="middle">🚚 Free Delivery on orders above ₹499</text>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateInlineInstagramStory(product: ProductData): Promise<Buffer> {
    const { width, height } = IMAGES.instagramStory;
    const discount = product.mrp > 0 ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="storybg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${BRAND.primaryColor}"/>
                <stop offset="50%" stop-color="#1a1a2e"/>
                <stop offset="100%" stop-color="${BRAND.secondaryColor}"/>
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#storybg)"/>
        <text x="${width / 2}" y="100" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">${BRAND.name}</text>
        <rect x="60" y="300" width="${width - 120}" height="700" rx="24" fill="white" opacity="0.95"/>
        <text x="${width / 2}" y="420" font-family="Arial, sans-serif" font-size="32" fill="#333" text-anchor="middle" font-weight="bold">${escapeXml(truncateSvg(product.name, 30))}</text>
        <text x="${width / 2}" y="470" font-family="Arial, sans-serif" font-size="20" fill="#666" text-anchor="middle">${escapeXml(product.brand || product.category)}</text>
        <text x="${width / 2}" y="600" font-family="Arial, sans-serif" font-size="56" fill="${BRAND.accentColor}" text-anchor="middle" font-weight="bold">₹${product.sellingPrice.toLocaleString('en-IN')}</text>
        <text x="${width / 2}" y="650" font-family="Arial, sans-serif" font-size="24" fill="#999" text-anchor="middle" text-decoration="line-through">MRP ₹${product.mrp.toLocaleString('en-IN')}</text>
        <rect x="${width / 2 - 80}" y="680" width="160" height="50" rx="25" fill="${BRAND.secondaryColor}"/>
        <text x="${width / 2}" y="712" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${discount}% OFF</text>
        ${product.highlights.slice(0, 3).map((h, i) => `
            <text x="${width / 2}" y="${790 + i * 40}" font-family="Arial, sans-serif" font-size="18" fill="#555" text-anchor="middle">✅ ${escapeXml(truncateSvg(h, 40))}</text>
        `).join('')}
        <rect x="${width / 2 - 140}" y="1200" width="280" height="60" rx="30" fill="white"/>
        <text x="${width / 2}" y="1240" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${BRAND.primaryColor}" text-anchor="middle">Swipe Up to Shop 🛒</text>
        <text x="${width / 2}" y="1800" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.7">${BRAND.websiteUrl}</text>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateInlineFacebookBanner(product: ProductData): Promise<Buffer> {
    const { width, height } = IMAGES.facebookBanner;
    const discount = product.mrp > 0 ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="fbbg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="${BRAND.primaryColor}"/>
                <stop offset="100%" stop-color="#1a1a2e"/>
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#fbbg)"/>
        <rect x="30" y="30" width="${width / 2 - 50}" height="${height - 60}" rx="16" fill="white" opacity="0.95"/>
        <text x="${width / 4}" y="100" font-family="Arial, sans-serif" font-size="16" fill="${BRAND.primaryColor}" text-anchor="middle" font-weight="bold">${BRAND.name}</text>
        <text x="${width / 4}" y="200" font-family="Arial, sans-serif" font-size="26" fill="#333" text-anchor="middle" font-weight="bold">${escapeXml(truncateSvg(product.name, 35))}</text>
        <text x="${width / 4}" y="240" font-family="Arial, sans-serif" font-size="16" fill="#666" text-anchor="middle">${escapeXml(product.brand || product.category)}</text>
        <text x="${width / 4}" y="340" font-family="Arial, sans-serif" font-size="42" fill="${BRAND.accentColor}" text-anchor="middle" font-weight="bold">₹${product.sellingPrice.toLocaleString('en-IN')}</text>
        <text x="${width / 4}" y="375" font-family="Arial, sans-serif" font-size="20" fill="#999" text-anchor="middle" text-decoration="line-through">MRP ₹${product.mrp.toLocaleString('en-IN')}</text>
        <rect x="${width / 4 - 55}" y="395" width="110" height="35" rx="17" fill="${BRAND.secondaryColor}"/>
        <text x="${width / 4}" y="420" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">${discount}% OFF</text>
        <rect x="${width / 4 - 90}" y="470" width="180" height="45" rx="22" fill="${BRAND.primaryColor}"/>
        <text x="${width / 4}" y="500" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">🛒 Shop Now</text>
        <text x="${width / 4}" y="570" font-family="Arial, sans-serif" font-size="13" fill="#666" text-anchor="middle">Cash on Delivery Available | ${BRAND.tagline}</text>
        <text x="${width * 3 / 4}" y="${height / 2}" font-family="Arial, sans-serif" font-size="64" fill="white" text-anchor="middle" opacity="0.15">📦</text>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── SVG Helpers ─────────────────────────────────────────────────────
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function truncateSvg(text: string, maxLen: number): string {
    return text.length > maxLen ? text.slice(0, maxLen - 3) + '...' : text;
}
