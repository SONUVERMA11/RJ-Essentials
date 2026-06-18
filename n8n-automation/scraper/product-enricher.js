#!/usr/bin/env node
/**
 * Product Enricher Pipeline v2
 * 
 * Takes raw scraped products and enriches them with:
 * 1. AI-generated descriptions & SEO tags (Gemini)
 * 2. Multi-platform images (Google, Amazon, Flipkart)
 * 3. Cloudinary-hosted images with proper sizing
 * 4. Complete Meesho branding removal
 * 5. Professional specifications and highlights
 * 6. Competitive pricing with margin applied
 */

const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { enrichProduct, cleanProductName } = require('./ai-description');
const { findProductImages } = require('./image-sourcer');
const { uploadProductImages } = require('./cloudinary-upload');

puppeteerExtra.use(StealthPlugin());

const sleep = ms => new Promise(r => setTimeout(r, ms));
const genSlug = name => slugify(name, { lower: true, strict: true, trim: true });

function log(msg, lvl = 'INFO') {
  const icon = { INFO: '🔧', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅', STEP: '▶️' }[lvl] || '🔧';
  console.log(`${icon} [Enricher] ${msg}`);
}

/**
 * Process a single product through the full enrichment pipeline
 */
async function processProduct(browser, rawProduct, index, options = {}) {
  const { skipImages = false, skipAI = false } = options;
  const cleanName = cleanProductName(rawProduct.name);
  
  log(`[${index + 1}] Processing: ${cleanName.substring(0, 50)}...`, 'STEP');

  // Step 1: AI enrichment (description, tags, highlights, specs)
  let enriched;
  if (skipAI) {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';
    enriched = await enrichProduct(rawProduct);
    process.env.GEMINI_API_KEY = origKey;
  } else {
    enriched = await enrichProduct(rawProduct);
    await sleep(1000);
  }

  // Step 2: Collect existing images from scrape
  let existingImages = [];
  if (rawProduct.images && Array.isArray(rawProduct.images)) {
    existingImages = rawProduct.images.map(img => img.url || img).filter(u => u && u.startsWith('http'));
  } else if (rawProduct._raw?.allImages) {
    existingImages = rawProduct._raw.allImages.filter(u => u && u.startsWith('http'));
  } else if (rawProduct.imageUrl) {
    existingImages = [rawProduct.imageUrl];
  }

  // Step 3: Source additional images from other platforms if needed
  let imageUrls = [...existingImages];
  if (!skipImages && browser && imageUrls.length < 3) {
    try {
      const foundImages = await findProductImages(
        browser,
        cleanName,
        rawProduct.category,
        imageUrls[0] || '',
        3 - imageUrls.length // Only find what we need
      );
      if (foundImages.length > 0) {
        // Add new images, avoiding duplicates
        for (const img of foundImages) {
          if (!imageUrls.includes(img)) imageUrls.push(img);
        }
      }
    } catch (err) {
      log(`  Image sourcing failed: ${err.message}`, 'WARN');
    }
  }

  // Cap at 5 images
  imageUrls = imageUrls.slice(0, 5);

  // Step 4: Upload to Cloudinary
  const productSlug = genSlug(`${cleanName}-${Date.now()}-${index}`);
  let images = [];
  
  if (imageUrls.length > 0) {
    try {
      const uploaded = await uploadProductImages(
        imageUrls.filter(u => u && u.startsWith('http')),
        productSlug
      );
      images = uploaded.map(img => ({
        url: img.url,
        publicId: img.publicId || '',
      }));
    } catch (err) {
      log(`  Cloudinary upload failed: ${err.message}`, 'WARN');
    }
  }

  // Fallback: use original URLs if Cloudinary failed
  if (images.length === 0) {
    images = imageUrls
      .filter(u => u && u.startsWith('http'))
      .slice(0, 5)
      .map(url => ({ url, publicId: '' }));
  }

  // Step 5: Use pricing from scraper (already has margin applied)
  const sellingPrice = rawProduct.sellingPrice || rawProduct.meeshoSellingPrice || 0;
  const mrp = rawProduct.mrp || rawProduct.meeshoMrp || sellingPrice;

  // Step 6: Compose final product
  const finalProduct = {
    name: enriched.name || cleanName,
    slug: productSlug,
    category: rawProduct.category || 'General',
    brand: 'RJ Essentials',
    description: enriched.description,
    highlights: enriched.highlights,
    specifications: enriched.specifications,
    images: images.length > 0 ? images : [{ url: '', publicId: '' }],
    mediaLinks: [],
    mrp,
    sellingPrice,
    stock: 50,
    variants: [],
    tags: enriched.tags,
    meeshoLink: rawProduct.meeshoLink || '',
    meeshoNotes: `Enriched ${new Date().toISOString().split('T')[0]} | ${images.length} images | Cost: ₹${rawProduct._raw?.meeshoSellingPrice || '?'}`,
    returnDays: 7,
    status: 'draft',
    isFeatured: false,
    isDealOfDay: false,
    isNewArrival: true,
    isBestSeller: false,
    metaTitle: enriched.metaTitle,
    metaDescription: enriched.metaDescription,
  };

  log(`  ✅ ${cleanName.substring(0, 40)} — ₹${sellingPrice} | ${images.length} imgs | ${enriched.tags.length} tags`, 'SUCCESS');
  return finalProduct;
}

/**
 * Process all products from a scraped data file
 */
async function processAll(inputPath, options = {}) {
  const { skipImages = false, skipAI = false, limit = 0 } = options;
  
  if (!fs.existsSync(inputPath)) {
    log(`Input file not found: ${inputPath}`, 'ERROR');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  log(`📂 Loaded ${data.metadata.totalProducts} products from ${data.metadata.categoriesScraped} categories`);

  let browser;
  try {
    if (!skipImages) {
      browser = await puppeteerExtra.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
               '--disable-blink-features=AutomationControlled', '--window-size=1440,900'],
      });
    }

    const enrichedCategories = {};
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const [slug, catData] of Object.entries(data.categories)) {
      log(`\n── ${catData.category} (${catData.count} products) ──`);
      
      const enrichedProducts = [];
      // Use transformed products (which have margin pricing already applied)
      const products = catData.products || [];

      for (let i = 0; i < products.length; i++) {
        if (limit > 0 && totalProcessed >= limit) break;

        try {
          const product = await processProduct(browser, products[i], totalProcessed, { skipImages, skipAI });
          enrichedProducts.push(product);
          totalSuccess++;
        } catch (err) {
          log(`  Failed: ${err.message}`, 'ERROR');
          totalFailed++;
        }
        totalProcessed++;
        await sleep(500);
      }

      enrichedCategories[slug] = {
        category: catData.category,
        rjCategory: catData.rjCategory,
        enrichedAt: new Date().toISOString(),
        count: enrichedProducts.length,
        products: enrichedProducts,
      };

      if (limit > 0 && totalProcessed >= limit) break;
    }

    // Save enriched output
    const outputDir = path.resolve(__dirname, '../output');
    const output = {
      metadata: {
        enrichedAt: new Date().toISOString(),
        totalProducts: totalSuccess,
        totalFailed,
        categoriesProcessed: Object.keys(enrichedCategories).length,
        source: 'rj-essentials-enriched-v2',
        options: { skipImages, skipAI, limit },
      },
      categories: enrichedCategories,
    };

    const enrichedPath = path.join(outputDir, `enriched-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(enrichedPath, JSON.stringify(output, null, 2));
    fs.writeFileSync(path.join(outputDir, 'enriched-latest.json'), JSON.stringify(output, null, 2));

    log(`\n📊 Enrichment complete: ${totalSuccess} success, ${totalFailed} failed`, 'SUCCESS');
    log(`📁 Saved to: ${enrichedPath}`);
    
    return output;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Enrich a single product (for Telegram/webhook triggers)
 */
async function enrichSingleProduct(productData, options = {}) {
  let browser;
  try {
    if (!options.skipImages) {
      browser = await puppeteerExtra.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return await processProduct(browser, productData, 0, options);
  } finally {
    if (browser) await browser.close();
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  const inputPath = fileIdx !== -1
    ? path.resolve(args[fileIdx + 1])
    : path.resolve(__dirname, '../output/latest.json');
  
  const skipImages = args.includes('--skip-images');
  const skipAI = args.includes('--skip-ai');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 0;

  log('🚀 RJ Essentials Product Enricher v2.0');
  log(`   Input: ${inputPath}`);
  log(`   Skip Images: ${skipImages}`);
  log(`   Skip AI: ${skipAI}`);
  log(`   Limit: ${limit || 'none'}`);
  
  await processAll(inputPath, { skipImages, skipAI, limit });
}

if (require.main === module) {
  main().catch(err => {
    log(`Fatal: ${err.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { processAll, processProduct, enrichSingleProduct };
