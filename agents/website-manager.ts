/**
 * Website Manager Agent
 * ────────────────────
 * Manages all visual components of the website:
 *  - Homepage sections (Featured, New Arrivals, Best Sellers, Deal of Day)
 *  - Hero banners (auto-generates from top products)
 *  - Announcement bar updates
 *  - SEO meta settings
 *
 * Uses data from the analytics and inventory agents (via pipeline state)
 * to make intelligent decisions about what to show on the homepage.
 */

import { log, logToFile, formatPrice, ensureOutputDirs } from './utils.js';
import {
    getProducts, getSections, updateSection, createSection,
    getBanners, createBanner, updateBanner, updateSettings,
    uploadImageBuffer,
    type Product, type Section, type Banner,
} from './api-client.js';
import { generateInstagramPost, closeBrowser, type ProductData } from './image-processor.js';
import { BRAND, IMAGES } from './config.js';
import type { PipelineState } from './pipeline.js';

const AGENT = 'website-manager';

// ─── Section Management ──────────────────────────────────────────────

async function syncSection(
    existingSections: Section[],
    type: Section['type'],
    title: string,
    productIds: string[],
    order: number
): Promise<boolean> {
    const existing = existingSections.find((s) => s.type === type);

    if (existing) {
        // Update existing section with new product IDs
        if (JSON.stringify(existing.productIds.sort()) !== JSON.stringify(productIds.sort())) {
            await updateSection(existing._id!, { productIds, isActive: productIds.length > 0 });
            log(AGENT, 'SUCCESS', `Updated section "${title}" with ${productIds.length} products`);
            return true;
        }
        log(AGENT, 'INFO', `Section "${title}" already up to date`);
        return false;
    } else if (productIds.length > 0) {
        // Create new section
        await createSection({
            title,
            type,
            layout: 'carousel',
            productIds,
            category: '',
            order,
            isActive: true,
        });
        log(AGENT, 'SUCCESS', `Created new section "${title}" with ${productIds.length} products`);
        return true;
    }
    return false;
}

async function updateHomepageSections(
    allProducts: Product[],
    state: PipelineState
): Promise<number> {
    const existingSections = await getSections();
    let updated = 0;

    const activeProducts = allProducts.filter((p) => p.status === 'active' && p.stock > 0);

    // 1. Featured Products — products marked as featured
    const featured = activeProducts.filter((p) => p.isFeatured).slice(0, 12);
    if (await syncSection(existingSections, 'featured', '⭐ Featured Products', featured.map((p) => p._id!), 1))
        updated++;

    // 2. New Arrivals — most recently created products
    const newArrivals = [...activeProducts]
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 12);
    if (await syncSection(existingSections, 'new-arrivals', '🆕 New Arrivals', newArrivals.map((p) => p._id!), 2))
        updated++;

    // 3. Best Sellers — products with highest soldCount OR marked as best seller
    const bestSellers = [...activeProducts]
        .filter((p) => p.isBestSeller || (p.soldCount && p.soldCount > 0))
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 12);
    // Also use top products from analytics if available
    if (bestSellers.length < 6 && state.analytics.ran) {
        for (const tp of state.analytics.topProducts) {
            if (!bestSellers.find((p) => p._id === tp.id) && bestSellers.length < 12) {
                const product = activeProducts.find((p) => p._id === tp.id);
                if (product) bestSellers.push(product);
            }
        }
    }
    if (await syncSection(existingSections, 'best-sellers', '🔥 Best Sellers', bestSellers.map((p) => p._id!), 3))
        updated++;

    // 4. Deal of the Day — products marked as deal
    const deals = activeProducts.filter((p) => p.isDealOfDay).slice(0, 6);
    if (await syncSection(existingSections, 'deal-of-day', '💥 Deal of the Day', deals.map((p) => p._id!), 4))
        updated++;

    return updated;
}

// ─── Banner Management ───────────────────────────────────────────────

async function updateHeroBanners(
    allProducts: Product[],
    state: PipelineState,
    dryRun: boolean
): Promise<number> {
    const existingBanners = await getBanners();
    const heroBanners = existingBanners.filter((b) => b.type === 'hero' && b.isActive);

    // If we already have 3+ active hero banners, don't add more
    if (heroBanners.length >= 3) {
        log(AGENT, 'INFO', `Already have ${heroBanners.length} hero banners — skipping generation`);
        return 0;
    }

    // Pick products for new banners: best sellers or deals
    const bannerCandidates = allProducts
        .filter((p) => p.status === 'active' && p.stock > 0 && p.images.length > 0)
        .filter((p) => p.isFeatured || p.isDealOfDay || (p.soldCount && p.soldCount > 5))
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 3 - heroBanners.length);

    if (bannerCandidates.length === 0) {
        log(AGENT, 'INFO', 'No suitable products for banner generation');
        return 0;
    }

    let created = 0;
    for (const product of bannerCandidates) {
        if (dryRun) {
            log(AGENT, 'INFO', `[DRY RUN] Would create banner for: ${product.name}`);
            created++;
            continue;
        }

        try {
            const productData: ProductData = {
                name: product.name,
                brand: product.brand,
                category: product.category,
                mrp: product.mrp,
                sellingPrice: product.sellingPrice,
                highlights: product.highlights,
                specifications: product.specifications,
                images: product.images,
            };

            // Generate a banner image (reuse Instagram post generator — 1080x1080 is good for hero)
            const bannerBuffer = await generateInstagramPost(productData, product.images[0]?.url);
            const uploaded = await uploadImageBuffer(bannerBuffer, `${IMAGES.cloudinaryFolder}/banners`);

            await createBanner({
                image: uploaded.url,
                publicId: uploaded.publicId,
                title: product.name,
                link: `/product/${product.slug}`,
                type: 'hero',
                order: heroBanners.length + created,
                isActive: true,
            });

            log(AGENT, 'SUCCESS', `Created hero banner for: ${product.name}`);
            created++;
        } catch (err) {
            log(AGENT, 'WARN', `Failed to create banner for ${product.name}: ${(err as Error).message}`);
        }
    }

    return created;
}

// ─── Announcement Bar ────────────────────────────────────────────────

async function updateAnnouncementBar(state: PipelineState, dryRun: boolean): Promise<boolean> {
    // Build an intelligent announcement based on current state
    const parts: string[] = [];

    if (state.orders.ran && state.orders.pendingCount > 0) {
        parts.push(`📦 ${state.orders.pendingCount} orders being processed`);
    }

    if (state.inventory.ran && state.inventory.outOfStock.length > 0) {
        // If many items are out of stock, don't show that. Show positive messages
    }

    // Default: show free delivery message
    if (parts.length === 0) {
        parts.push('🚚 Free Delivery on orders above ₹499');
    }

    // If analytics shows a top product, highlight it
    if (state.analytics.ran && state.analytics.topProducts.length > 0) {
        parts.push(`🔥 Trending: ${state.analytics.topProducts[0].name}`);
    }

    parts.push(`💵 Cash on Delivery Available`);

    const announcementText = parts.join(' | ');

    if (!dryRun) {
        await updateSettings({
            announcementText,
            announcementActive: 'true',
            announcementColor: BRAND.primaryColor,
        });
        log(AGENT, 'SUCCESS', `Updated announcement: "${announcementText}"`);
    } else {
        log(AGENT, 'INFO', `[DRY RUN] Would update announcement: "${announcementText}"`);
    }

    return true;
}

// ─── Main Agent Workflow ─────────────────────────────────────────────

export async function runWebsiteManager(
    state: PipelineState,
    dryRun: boolean = false
): Promise<PipelineState> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', 'Starting website manager agent');

    // Load all active products if not already in pipeline
    if (state.allProducts.length === 0) {
        const allProducts: Product[] = [];
        let page = 1;
        while (true) {
            const res = await getProducts({ page: page.toString(), limit: '100', status: 'all' });
            if (res.products) allProducts.push(...res.products);
            if (!res.pagination || page >= res.pagination.pages) break;
            page++;
        }
        state.allProducts = allProducts;
    }

    log(AGENT, 'INFO', `Working with ${state.allProducts.length} products`);

    // Step 1: Update homepage sections
    try {
        if (!dryRun) {
            state.website.sectionsUpdated = await updateHomepageSections(state.allProducts, state);
        } else {
            log(AGENT, 'INFO', '[DRY RUN] Would update homepage sections');
        }
    } catch (err) {
        log(AGENT, 'ERROR', `Section update failed: ${(err as Error).message}`);
    }

    // Step 2: Update hero banners
    try {
        state.website.bannersUpdated = await updateHeroBanners(state.allProducts, state, dryRun);
    } catch (err) {
        log(AGENT, 'ERROR', `Banner update failed: ${(err as Error).message}`);
    }

    // Step 3: Update announcement bar
    try {
        state.website.announcementUpdated = await updateAnnouncementBar(state, dryRun);
        state.website.settingsUpdated.push('announcementText');
    } catch (err) {
        log(AGENT, 'ERROR', `Announcement update failed: ${(err as Error).message}`);
    }

    // Step 4: Update SEO meta from analytics
    if (state.analytics.ran && !dryRun) {
        try {
            const topCat = state.analytics.topCategory;
            const metaDescription = `Shop ${topCat ? topCat + ', ' : ''}and more at best prices. Cash on Delivery available across India. Free delivery on orders above ₹499.`;
            await updateSettings({ metaDescription });
            state.website.settingsUpdated.push('metaDescription');
            log(AGENT, 'SUCCESS', 'Updated SEO meta description');
        } catch (err) {
            log(AGENT, 'WARN', `SEO update failed: ${(err as Error).message}`);
        }
    }

    state.website.ran = true;
    await closeBrowser();

    log(AGENT, 'SUCCESS', `\n── Website Manager ──\n  📑 Sections Updated: ${state.website.sectionsUpdated}\n  🖼️ Banners Updated: ${state.website.bannersUpdated}\n  📢 Announcement: ${state.website.announcementUpdated ? 'Updated' : 'Skipped'}\n  ⚙️ Settings: ${state.website.settingsUpdated.join(', ') || 'None'}`);

    await logToFile(AGENT, 'SUCCESS', 'Website manager complete');
    return state;
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('website-manager')) {
    const { createEmptyPipeline } = await import('./pipeline.js');
    const dryRun = process.argv.includes('--dry-run');
    const state = createEmptyPipeline();

    runWebsiteManager(state, dryRun)
        .then(() => process.exit(0))
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
