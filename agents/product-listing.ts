/**
 * Product Listing Agent
 * ────────────────────
 * Takes products from the research queue, downloads clean images,
 * generates info-graphics, and creates listings on RJ Essentials.
 */

import path from 'path';
import { OUTPUT_DIR, PRICING, IMAGES } from './config.js';
import { log, logToFile, readJson, writeJson, slugify, roundPrice, calcDiscount, todayStr, ensureOutputDirs, truncate } from './utils.js';
import { createProduct, uploadImageBuffer, type Product } from './api-client.js';
import {
    sourceCleanImages, uploadCleanImages,
    generateSpecsImage, generateHighlightsImage, generateComparisonImage,
    closeBrowser, type ProductData,
} from './image-processor.js';
import type { ResearchedProduct } from './product-research.js';

const AGENT = 'product-listing';

// ─── Price Calculation ───────────────────────────────────────────────

function calculatePricing(sourcePrice: number): { mrp: number; sellingPrice: number } {
    // MRP = source price with healthy markup
    const mrp = roundPrice(sourcePrice * (1 + PRICING.defaultMarkupPercent / 100 + 0.15), 9);
    // Selling price = source price with minimum margin
    const sellingPrice = roundPrice(sourcePrice * (1 + PRICING.defaultMarkupPercent / 100), 9);
    return { mrp, sellingPrice };
}

// ─── SEO Content Generation ──────────────────────────────────────────

function generateSeoContent(product: ResearchedProduct): {
    metaTitle: string;
    metaDescription: string;
    description: string;
    tags: string[];
} {
    const name = product.name;
    const brand = product.brand || '';

    const metaTitle = truncate(`${name} - Buy at Best Price | RJ ESSENTIALS`, 60);
    const metaDescription = truncate(
        `Buy ${name}${brand ? ` by ${brand}` : ''} at best price with Cash on Delivery. ${product.highlights[0] || ''} Shop now at RJ ESSENTIALS.`,
        160
    );

    // Rich description
    const highlightsList = product.highlights.length > 0
        ? '\n\n**Key Features:**\n' + product.highlights.map((h) => `• ${h}`).join('\n')
        : '';

    const description = `${name}${brand ? ` by ${brand}` : ''}. ${product.highlights[0] || 'Premium quality product available at best price.'}${highlightsList}\n\n**Why buy from RJ ESSENTIALS?**\n• Cash on Delivery Available\n• Free Delivery on orders above ₹499\n• Easy Returns\n• Quality Guaranteed`;

    // Tags for search
    const tags = [
        ...name.toLowerCase().split(' ').filter((w) => w.length > 2),
        brand.toLowerCase(),
        product.category.toLowerCase(),
        'rj essentials',
        'best price',
        'cod',
    ].filter(Boolean);

    return { metaTitle, metaDescription, description, tags: [...new Set(tags)].slice(0, 15) };
}

// ─── Main Agent Workflow ─────────────────────────────────────────────

export async function runProductListing(dryRun: boolean = false): Promise<{ success: number; failed: number; skipped: number }> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', 'Starting product listing agent');

    const queuePath = path.join(OUTPUT_DIR, 'product-queue.json');
    let queue: ResearchedProduct[];

    try {
        queue = await readJson<ResearchedProduct[]>(queuePath);
    } catch {
        log(AGENT, 'ERROR', `No product queue found at ${queuePath}. Run the research agent first.`);
        return { success: 0, failed: 0, skipped: 0 };
    }

    log(AGENT, 'INFO', `${queue.length} products in queue`);

    let success = 0, failed = 0, skipped = 0;
    const results: { name: string; status: string; productId?: string; error?: string }[] = [];

    for (const researchedProduct of queue) {
        try {
            log(AGENT, 'INFO', `Processing: ${researchedProduct.name}`);

            // Skip if no clean images available
            if (researchedProduct.cleanImageUrls.length === 0) {
                log(AGENT, 'WARN', `Skipping "${researchedProduct.name}" — no clean images available`);
                results.push({ name: researchedProduct.name, status: 'skipped', error: 'No clean images' });
                skipped++;
                continue;
            }

            if (dryRun) {
                log(AGENT, 'INFO', `[DRY RUN] Would create: ${researchedProduct.name}`);
                results.push({ name: researchedProduct.name, status: 'dry-run' });
                success++;
                continue;
            }

            // Step 1: Source & validate clean images
            log(AGENT, 'INFO', `Downloading clean images for "${researchedProduct.name}"...`);
            const cleanImages = await sourceCleanImages(researchedProduct.cleanImageUrls);

            if (cleanImages.length === 0) {
                log(AGENT, 'WARN', `No clean images passed validation for "${researchedProduct.name}"`);
                results.push({ name: researchedProduct.name, status: 'skipped', error: 'Images failed validation' });
                skipped++;
                continue;
            }

            // Step 2: Upload clean images to Cloudinary
            const uploadedImages = await uploadCleanImages(cleanImages);
            log(AGENT, 'SUCCESS', `${uploadedImages.length} images uploaded for "${researchedProduct.name}"`);

            // Step 3: Generate product detail info-graphics
            const pricing = calculatePricing(researchedProduct.meeshoPrice);
            const productData: ProductData = {
                name: researchedProduct.name,
                brand: researchedProduct.brand,
                category: researchedProduct.category,
                mrp: pricing.mrp,
                sellingPrice: pricing.sellingPrice,
                highlights: researchedProduct.highlights,
                specifications: researchedProduct.specifications,
                images: uploadedImages,
            };

            const mediaLinks: { type: 'image'; url: string; caption: string }[] = [];

            // Generate specs card if we have specifications
            if (researchedProduct.specifications.length > 0) {
                try {
                    const specsBuffer = await generateSpecsImage(productData);
                    const specsUpload = await uploadImageBuffer(specsBuffer, `${IMAGES.cloudinaryFolder}/detail`);
                    mediaLinks.push({ type: 'image', url: specsUpload.url, caption: 'Specifications' });
                    log(AGENT, 'SUCCESS', 'Specs info-graphic generated');
                } catch (err) {
                    log(AGENT, 'WARN', `Specs image generation failed: ${(err as Error).message}`);
                }
            }

            // Generate highlights card if we have highlights
            if (researchedProduct.highlights.length > 0) {
                try {
                    const highlightsBuffer = await generateHighlightsImage(productData);
                    const highlightsUpload = await uploadImageBuffer(highlightsBuffer, `${IMAGES.cloudinaryFolder}/detail`);
                    mediaLinks.push({ type: 'image', url: highlightsUpload.url, caption: 'Key Features' });
                    log(AGENT, 'SUCCESS', 'Highlights info-graphic generated');
                } catch (err) {
                    log(AGENT, 'WARN', `Highlights image generation failed: ${(err as Error).message}`);
                }
            }

            // Generate comparison card
            try {
                const compBuffer = await generateComparisonImage(
                    productData,
                    researchedProduct.amazonPrice || undefined,
                    researchedProduct.amazonPrice ? 'Amazon' : undefined
                );
                const compUpload = await uploadImageBuffer(compBuffer, `${IMAGES.cloudinaryFolder}/detail`);
                mediaLinks.push({ type: 'image', url: compUpload.url, caption: 'Price Comparison' });
                log(AGENT, 'SUCCESS', 'Comparison card generated');
            } catch (err) {
                log(AGENT, 'WARN', `Comparison image generation failed: ${(err as Error).message}`);
            }

            // Step 4: Generate SEO content
            const seo = generateSeoContent(researchedProduct);

            // Step 5: Create product via API
            const newProduct: Partial<Product> = {
                name: researchedProduct.name,
                slug: researchedProduct.slug || slugify(researchedProduct.name),
                category: researchedProduct.category || '',
                brand: researchedProduct.brand || '',
                description: seo.description,
                highlights: researchedProduct.highlights,
                specifications: researchedProduct.specifications,
                images: uploadedImages,
                mediaLinks,
                mrp: pricing.mrp,
                sellingPrice: pricing.sellingPrice,
                stock: 50, // Default stock
                variants: [],
                tags: seo.tags,
                meeshoLink: researchedProduct.meeshoLink,
                meeshoNotes: `Meesho Price: ₹${researchedProduct.meeshoPrice}`,
                returnDays: 7,
                status: 'draft', // Start as draft for admin review
                isFeatured: false,
                isDealOfDay: false,
                isNewArrival: true,
                isBestSeller: false,
                metaTitle: seo.metaTitle,
                metaDescription: seo.metaDescription,
            };

            const created = await createProduct(newProduct);
            log(AGENT, 'SUCCESS', `Product created: "${researchedProduct.name}" (ID: ${created._id})`);
            results.push({ name: researchedProduct.name, status: 'created', productId: created._id });
            success++;
        } catch (error) {
            log(AGENT, 'ERROR', `Failed to list "${researchedProduct.name}": ${(error as Error).message}`);
            results.push({ name: researchedProduct.name, status: 'failed', error: (error as Error).message });
            failed++;
        }
    }

    // Save results log
    const resultsPath = path.join(OUTPUT_DIR, 'reports', `listing-results-${todayStr()}.json`);
    await writeJson(resultsPath, { date: todayStr(), results, summary: { success, failed, skipped } });

    await closeBrowser();
    await logToFile(AGENT, 'SUCCESS', `Listing complete. Created: ${success}, Failed: ${failed}, Skipped: ${skipped}`);
    return { success, failed, skipped };
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('product-listing')) {
    const dryRun = process.argv.includes('--dry-run');
    runProductListing(dryRun)
        .then((r) => {
            log(AGENT, 'SUCCESS', `Done! Created: ${r.success}, Failed: ${r.failed}, Skipped: ${r.skipped}`);
            process.exit(0);
        })
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
