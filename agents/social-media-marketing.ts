/**
 * Social Media Marketing Agent
 * ────────────────────────────
 * Generates complete marketing packages with professional posters,
 * captions, and hashtags for Instagram, Facebook, and WhatsApp.
 */

import path from 'path';
import fs from 'fs/promises';
import { OUTPUT_DIR, BRAND } from './config.js';
import { log, logToFile, ensureDir, todayStr, ensureOutputDirs, formatPrice, calcDiscount, truncate } from './utils.js';
import { getProducts, type Product } from './api-client.js';
import {
    generateInstagramPost, generateInstagramStory,
    generateFacebookBanner, closeBrowser,
    type ProductData,
} from './image-processor.js';

import { uploadImageBuffer } from './api-client.js';
import {
    postProductToAllPlatforms, isMetaConfigured, isInstagramConfigured,
    type PostResult,
} from './social-poster.js';

const AGENT = 'social-media';

// ─── Caption Generation ─────────────────────────────────────────────

function generateInstagramCaption(product: Product): string {
    const discount = calcDiscount(product.mrp, product.sellingPrice);
    const highlights = product.highlights.slice(0, 3).map((h) => `✅ ${h}`).join('\n');

    return `🔥 ${product.name}

${product.brand ? `Brand: ${product.brand}\n` : ''}💰 Price: ${formatPrice(product.sellingPrice)} ${discount > 0 ? `(${discount}% OFF!)` : ''}
${product.mrp !== product.sellingPrice ? `~~MRP: ${formatPrice(product.mrp)}~~\n` : ''}
${highlights ? `\n${highlights}\n` : ''}
🛒 Shop Now — Link in Bio!
🚚 Free Delivery on orders above ₹499
💵 Cash on Delivery Available

📱 DM us or WhatsApp: +91 ${BRAND.whatsappNumber.slice(2)}
🌐 ${BRAND.websiteUrl}

${generateInstagramHashtags(product)}`;
}

function generateFacebookCaption(product: Product): string {
    const discount = calcDiscount(product.mrp, product.sellingPrice);
    const highlights = product.highlights.slice(0, 4).map((h) => `• ${h}`).join('\n');

    return `🛍️ ${product.name}

${product.description ? truncate(product.description, 200) + '\n\n' : ''}${product.brand ? `Brand: ${product.brand}\n` : ''}💰 Our Price: ${formatPrice(product.sellingPrice)} ${discount > 0 ? `| ${discount}% OFF MRP ${formatPrice(product.mrp)}` : ''}

${highlights ? `Key Features:\n${highlights}\n\n` : ''}🚚 Free Delivery on orders above ₹499
💵 Cash on Delivery Available across India
📱 Order via WhatsApp: +91 ${BRAND.whatsappNumber.slice(2)}

👉 Shop now: ${BRAND.websiteUrl}/product/${product.slug}

${generateFacebookHashtags(product)}`;
}

function generateWhatsAppCaption(product: Product): string {
    const discount = calcDiscount(product.mrp, product.sellingPrice);

    return `🛒 *${product.name}*
${product.brand ? `Brand: ${product.brand}\n` : ''}
💰 *Price: ${formatPrice(product.sellingPrice)}* ${discount > 0 ? `_(${discount}% OFF)_` : ''}
${product.mrp !== product.sellingPrice ? `MRP: ~${formatPrice(product.mrp)}~\n` : ''}
${product.highlights.slice(0, 3).map((h) => `✅ ${h}`).join('\n')}

🚚 Free Delivery above ₹499
💵 Cash on Delivery

Order now 👇
${BRAND.websiteUrl}/product/${product.slug}`;
}

// ─── Hashtag Generation ──────────────────────────────────────────────

function generateInstagramHashtags(product: Product): string {
    const base = ['#RJEssentials', '#ShopOnline', '#BestPrice', '#CashOnDelivery', '#FreeDelivery', '#OnlineShopping', '#India'];
    const category = product.category ? [`#${product.category.replace(/\s+/g, '')}`, `#${product.category.replace(/\s+/g, '')}Online`] : [];
    const brand = product.brand ? [`#${product.brand.replace(/\s+/g, '')}`] : [];
    const product_tags = product.tags.slice(0, 5).map((t) => `#${t.replace(/\s+/g, '')}`);
    const trending = ['#ShopNow', '#Trending', '#MustHave', '#DealOfTheDay', '#SaleAlert', '#BuyNow', '#QualityProducts'];

    return [...new Set([...base, ...category, ...brand, ...product_tags, ...trending])].slice(0, 30).join(' ');
}

function generateFacebookHashtags(product: Product): string {
    const tags = ['#RJEssentials', '#ShopOnline', '#BestDeals', '#CashOnDelivery'];
    if (product.category) tags.push(`#${product.category.replace(/\s+/g, '')}`);
    if (product.brand) tags.push(`#${product.brand.replace(/\s+/g, '')}`);
    return tags.slice(0, 10).join(' ');
}

// ─── Main Agent Workflow ─────────────────────────────────────────────

export async function runSocialMediaMarketing(
    filter: 'featured' | 'new-arrivals' | 'deal-of-day' | 'all' = 'new-arrivals',
    maxProducts: number = 5,
    dryRun: boolean = false
): Promise<{ generated: number; failed: number; posted: { instagram: number; facebook: number } }> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', `Starting social media marketing. Filter: ${filter}`);

    // Check social media configuration
    const metaReady = isMetaConfigured();
    const igReady = isInstagramConfigured();
    if (!metaReady) {
        log(AGENT, 'WARN', '⚠️ META_PAGE_ACCESS_TOKEN / META_PAGE_ID not set — will generate content locally only.');
        log(AGENT, 'WARN', '   To enable automatic posting, add these to .env.local:');
        log(AGENT, 'WARN', '   META_PAGE_ACCESS_TOKEN=your_token');
        log(AGENT, 'WARN', '   META_PAGE_ID=your_page_id');
        log(AGENT, 'WARN', '   INSTAGRAM_ACCOUNT_ID=your_ig_business_account_id');
    } else {
        log(AGENT, 'SUCCESS', `Social posting enabled: Facebook=${metaReady} Instagram=${igReady}`);
    }

    // Fetch products
    const params: Record<string, string> = { limit: maxProducts.toString() };
    if (filter === 'featured') params.featured = 'true';
    else if (filter === 'new-arrivals') params.newArrival = 'true';
    else if (filter === 'deal-of-day') params.dealOfDay = 'true';

    const response = await getProducts(params);
    const products = response.products || [];

    if (products.length === 0) {
        log(AGENT, 'WARN', 'No products found matching filter');
        return { generated: 0, failed: 0, posted: { instagram: 0, facebook: 0 } };
    }

    log(AGENT, 'INFO', `Processing ${products.length} products for social media content`);

    const dateDir = path.join(OUTPUT_DIR, 'social-content', todayStr());
    await ensureDir(dateDir);

    let generated = 0, failed = 0;
    const posted = { instagram: 0, facebook: 0 };

    for (const product of products) {
        try {
            log(AGENT, 'INFO', `Generating content for: ${product.name}`);

            const productDir = path.join(dateDir, product.slug || 'unnamed');
            await ensureDir(productDir);

            const productImageUrl = product.images[0]?.url || '';
            const productData: ProductData = {
                name: product.name,
                brand: product.brand,
                category: product.category,
                mrp: product.mrp,
                sellingPrice: product.sellingPrice,
                highlights: product.highlights,
                specifications: product.specifications,
                images: product.images,
                description: product.description,
            };

            if (dryRun) {
                log(AGENT, 'INFO', `[DRY RUN] Would generate content for: ${product.name}`);
                generated++;
                continue;
            }

            // Generate poster images
            let igPostBuffer: Buffer | null = null;
            try {
                igPostBuffer = await generateInstagramPost(productData, productImageUrl);
                await fs.writeFile(path.join(productDir, 'instagram-post.png'), igPostBuffer);
                log(AGENT, 'SUCCESS', '  → Instagram post poster generated');
            } catch (err) {
                log(AGENT, 'WARN', `  → Instagram post failed: ${(err as Error).message}`);
            }

            try {
                const igStory = await generateInstagramStory(productData, productImageUrl);
                await fs.writeFile(path.join(productDir, 'instagram-story.png'), igStory);
                log(AGENT, 'SUCCESS', '  → Instagram story poster generated');
            } catch (err) {
                log(AGENT, 'WARN', `  → Instagram story failed: ${(err as Error).message}`);
            }

            let fbBannerBuffer: Buffer | null = null;
            try {
                fbBannerBuffer = await generateFacebookBanner(productData, productImageUrl);
                await fs.writeFile(path.join(productDir, 'facebook-banner.png'), fbBannerBuffer);
                log(AGENT, 'SUCCESS', '  → Facebook banner generated');
            } catch (err) {
                log(AGENT, 'WARN', `  → Facebook banner failed: ${(err as Error).message}`);
            }

            // Generate captions
            const igCaption = generateInstagramCaption(product);
            await fs.writeFile(path.join(productDir, 'caption-instagram.txt'), igCaption, 'utf-8');

            const fbCaption = generateFacebookCaption(product);
            await fs.writeFile(path.join(productDir, 'caption-facebook.txt'), fbCaption, 'utf-8');

            const waCaption = generateWhatsAppCaption(product);
            await fs.writeFile(path.join(productDir, 'caption-whatsapp.txt'), waCaption, 'utf-8');

            // ═══ ACTUAL POSTING TO SOCIAL MEDIA ═══════════════════════
            if (metaReady && (igPostBuffer || fbBannerBuffer)) {
                log(AGENT, 'INFO', '  📤 Posting to social media platforms...');

                // Upload the best image to Cloudinary to get a public URL
                const posterBuffer = igPostBuffer || fbBannerBuffer!;
                let publicImageUrl = '';
                try {
                    const uploaded = await uploadImageBuffer(posterBuffer, 'rj-essentials/social-posts');
                    publicImageUrl = uploaded.url;
                    log(AGENT, 'SUCCESS', `  → Uploaded poster to Cloudinary: ${publicImageUrl}`);
                } catch (err) {
                    log(AGENT, 'WARN', `  → Poster upload failed: ${(err as Error).message}`);
                }

                if (publicImageUrl) {
                    const results = await postProductToAllPlatforms(publicImageUrl, igCaption, fbCaption);

                    for (const result of results) {
                        if (result.success) {
                            if (result.platform === 'instagram') posted.instagram++;
                            if (result.platform === 'facebook') posted.facebook++;
                            log(AGENT, 'SUCCESS', `  ✅ Posted to ${result.platform}! ID: ${result.postId}`);
                        } else {
                            log(AGENT, 'WARN', `  ⚠️ ${result.platform} post failed: ${result.error}`);
                        }
                    }

                    // Save posting results to metadata
                    await fs.writeFile(
                        path.join(productDir, 'post-results.json'),
                        JSON.stringify(results, null, 2),
                        'utf-8'
                    );
                }
            }

            // Save metadata
            await fs.writeFile(
                path.join(productDir, 'metadata.json'),
                JSON.stringify({
                    productName: product.name,
                    productSlug: product.slug,
                    productUrl: `${BRAND.websiteUrl}/product/${product.slug}`,
                    generatedAt: new Date().toISOString(),
                    filter,
                    posted: metaReady ? posted : 'not-configured',
                }, null, 2),
                'utf-8'
            );

            log(AGENT, 'SUCCESS', `Content package saved: ${productDir}`);
            generated++;
        } catch (error) {
            log(AGENT, 'ERROR', `Failed for "${product.name}": ${(error as Error).message}`);
            failed++;
        }
    }

    await closeBrowser();
    const postSummary = metaReady
        ? ` | Posted: IG=${posted.instagram} FB=${posted.facebook}`
        : ' | Posting: NOT CONFIGURED (add META_PAGE_ACCESS_TOKEN to .env.local)';
    await logToFile(AGENT, 'SUCCESS', `Marketing content generated. Success: ${generated}, Failed: ${failed}${postSummary}`);
    log(AGENT, 'SUCCESS', `📁 Content saved to: ${dateDir}`);
    if (metaReady) log(AGENT, 'SUCCESS', `📤 Posted: ${posted.instagram} to Instagram, ${posted.facebook} to Facebook`);
    return { generated, failed, posted };
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('social-media')) {
    const filter = (process.argv[2] || 'new-arrivals') as 'featured' | 'new-arrivals' | 'deal-of-day' | 'all';
    const max = parseInt(process.argv[3] || '5');
    const dryRun = process.argv.includes('--dry-run');

    runSocialMediaMarketing(filter, max, dryRun)
        .then((r) => {
            log(AGENT, 'SUCCESS', `Done! Generated: ${r.generated}, Failed: ${r.failed}`);
            process.exit(0);
        })
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
