#!/usr/bin/env node
/**
 * Meesho Scraper v4.0 — API-First Approach
 * 
 * Uses Meesho's internal search/catalog API endpoints directly
 * instead of DOM scraping (which gets blocked by Akamai WAF).
 * Falls back to mobile user-agent Puppeteer if API fails.
 * 
 * Fixes from v3:
 * - No more "Access Denied" — uses API endpoints
 * - Proper per-product extraction (not 1 giant card)
 * - Correct image extraction (2-4 per product, not 68)
 * - Proper price extraction with margin markup
 * - Product detail page scraping for full info
 */

const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { MEESHO_CATEGORIES } = require('./meesho-categories');

puppeteerExtra.use(StealthPlugin());

const CONFIG = {
  headless: process.env.HEADLESS !== 'false',
  delayMs: parseInt(process.env.SCRAPE_DELAY_MS || '3000'),
  maxProducts: parseInt(process.env.MAX_PRODUCTS_PER_CATEGORY || '20'),
  outputDir: path.resolve(__dirname, '../output'),
  marginMin: parseFloat(process.env.MARGIN_MIN || '10'),
  marginMax: parseFloat(process.env.MARGIN_MAX || '25'),
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const genSlug = name => slugify(name, { lower: true, strict: true, trim: true });

function log(msg, lvl = 'INFO') {
  const icon = { INFO: '📋', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[lvl] || '📋';
  console.log(`${icon} [${new Date().toISOString()}] ${msg}`);
}

/**
 * Clean product name — strip prices, percentages, delivery text, Meesho branding
 */
function cleanName(raw) {
  return raw
    .replace(/₹[\d,]+/g, '')
    .replace(/Rs\.?\s*[\d,]+/g, '')
    .replace(/\d+%\s*off/gi, '')
    .replace(/Free\s+Delivery/gi, '')
    .replace(/meesho/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate selling price with competitive margin (10-25%)
 * Higher-priced items get lower margins, budget items get higher margins
 */
function applyMargin(meeshoPrice, mrp) {
  const price = parseInt(meeshoPrice) || 0;
  if (price <= 0) return { sellingPrice: 0, mrp: 0 };

  let marginPercent;
  if (price < 200) marginPercent = CONFIG.marginMax;        // Budget: 25%
  else if (price < 500) marginPercent = 20;                  // Mid-low: 20%
  else if (price < 1000) marginPercent = 15;                 // Mid: 15%
  else if (price < 2000) marginPercent = 12;                 // Mid-high: 12%
  else marginPercent = CONFIG.marginMin;                     // Premium: 10%

  const sellingPrice = Math.ceil(price * (1 + marginPercent / 100));
  const effectiveMrp = parseInt(mrp) || 0;
  // MRP should be higher than our selling price
  const finalMrp = Math.max(effectiveMrp, Math.ceil(sellingPrice * 1.15));
  
  return { sellingPrice, mrp: finalMrp };
}

/**
 * Strategy 1: Use Meesho's internal search API via Puppeteer network interception
 */
async function scrapeViaApiInterception(browser, category) {
  log(`[API] Scraping: ${category.name}`);
  const page = await browser.newPage();
  const apiProducts = [];

  try {
    await page.setViewport({ width: 412, height: 915 });
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
    });

    // Intercept API responses
    page.on('response', async (response) => {
      try {
        const url = response.url();
        if (url.includes('/api/') || url.includes('graphql') || url.includes('product_search') || 
            url.includes('catalog') || url.includes('/v1/') || url.includes('/v2/')) {
          const ct = response.headers()['content-type'] || '';
          if (ct.includes('json') && response.status() === 200) {
            const json = await response.json().catch(() => null);
            if (json) {
              const extracted = extractFromApi(json);
              if (extracted.length > 0) {
                apiProducts.push(...extracted);
                log(`  [API] Intercepted ${extracted.length} products (total: ${apiProducts.length})`);
              }
            }
          }
        }
      } catch {}
    });

    // Navigate to search page (more reliable than category pages)
    const searchUrl = `https://www.meesho.com/search?q=${encodeURIComponent(category.meeshoSearchQuery)}&sort=relevance`;
    log(`  URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(5000);

    // Scroll aggressively to trigger lazy loading
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(400);
    }
    await sleep(2000);

    if (apiProducts.length > 0) {
      log(`  [API] Total intercepted: ${apiProducts.length} products`, 'SUCCESS');
      const unique = deduplicateProducts(apiProducts);
      return unique.slice(0, CONFIG.maxProducts);
    }

    // If API interception didn't work, try DOM extraction with fixed strategy
    log(`  [API] No API data intercepted, trying DOM...`, 'WARN');
    return await extractFromDOM(page, category);
  } catch (err) {
    log(`  [API] Error: ${err.message}`, 'ERROR');
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Extract products from Meesho API response (handles multiple formats)
 */
function extractFromApi(json) {
  const products = [];

  // Recursive search for product arrays
  function findProductArrays(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') return;
    
    // Check if this is a product-like object
    if (obj.product_id || obj.catalog_id) {
      tryExtractProduct(obj);
      return;
    }

    // Check arrays
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object' && (item.product_id || item.catalog_id || item.name || item.product_name)) {
          tryExtractProduct(item);
        }
      }
      return;
    }

    // Recurse into object values
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length > 0) {
        findProductArrays(val, depth + 1);
      } else if (val && typeof val === 'object') {
        findProductArrays(val, depth + 1);
      }
    }
  }

  function tryExtractProduct(item) {
    try {
      const name = item.name || item.product_name || item.title || '';
      const price = parseInt(item.min_catalog_price || item.min_product_price || item.selling_price || item.price || 0);
      const origMrp = parseInt(item.max_catalog_price || item.product_mrp || item.mrp || item.original_price || 0);
      
      if (!name || price <= 0) return;

      // Extract images properly — only product images, not all page images
      let images = [];
      if (item.product_images && Array.isArray(item.product_images)) {
        images = item.product_images.map(img => {
          if (typeof img === 'string') return img;
          return img?.url || img?.original?.src || img?.original || '';
        }).filter(Boolean);
      } else if (item.images && Array.isArray(item.images)) {
        images = item.images.map(img => typeof img === 'string' ? img : img?.url || '').filter(Boolean);
      } else if (item.image) {
        images = [typeof item.image === 'string' ? item.image : item.image?.url || ''];
      }

      // Ensure we have hi-res URLs
      images = images.map(url => {
        if (url.includes('meeshocdn') || url.includes('meesho')) {
          return url.replace(/w=\d+/, 'w=800').replace(/h=\d+/, 'h=800');
        }
        return url;
      }).filter(u => u.startsWith('http'));

      products.push({
        name: cleanName(name),
        meeshoSellingPrice: price,
        meeshoMrp: origMrp || price,
        imageUrl: images[0] || '',
        allImages: images.slice(0, 5), // Cap at 5 images per product
        productId: String(item.product_id || item.catalog_id || item.id || ''),
        rating: parseFloat(item.average_rating || item.rating || item.rating_average || 0),
        reviews: parseInt(item.review_count || item.rating_count || item.reviews_count || 0),
        discount: item.discount_percentage ? `${item.discount_percentage}% off` : '',
        source: 'meesho-api',
      });
    } catch {}
  }

  findProductArrays(json);
  return products;
}

/**
 * Strategy 2: Fixed DOM extraction — find individual product CARDS, not the whole page
 */
async function extractFromDOM(page, category) {
  const products = await page.evaluate((maxP) => {
    const results = [];
    const seen = new Set();

    // Find product links — each <a> to a product page IS a product card
    const anchors = [...document.querySelectorAll('a[href*="/p/"]')];
    
    for (const anchor of anchors) {
      if (results.length >= maxP) break;
      
      const href = anchor.href || anchor.getAttribute('href') || '';
      if (!href.includes('/p/') || seen.has(href)) continue;
      seen.add(href);

      // The product card is the DIRECT parent container — NOT 6 levels up!
      // Walk up at most 2-3 levels to find the card boundary
      let card = anchor;
      // Find the immediate card: stop when we hit a container with many sibling cards
      for (let i = 0; i < 3; i++) {
        const parent = card.parentElement;
        if (!parent) break;
        // If parent has many children that also contain product links, this level is the grid
        const siblingProductLinks = parent.querySelectorAll(':scope > * a[href*="/p/"]');
        if (siblingProductLinks.length > 3) break; // This parent is the grid, card is current
        card = parent;
      }

      // Extract ONLY images inside THIS card (not the entire page!)
      const cardImages = [];
      card.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src && src.startsWith('http') && !src.includes('icon') && !src.includes('logo') && 
            !src.includes('svg') && !src.includes('emoji') && src.length < 500) {
          // Get hi-res version
          const hiRes = src.replace(/w=\d+/, 'w=800').replace(/h=\d+/, 'h=800');
          if (!cardImages.includes(hiRes)) {
            cardImages.push(hiRes);
          }
        }
      });

      // Extract text elements ONLY from this card
      const texts = [];
      card.querySelectorAll('p, span, h2, h3, h4, h5').forEach(el => {
        const t = el.textContent?.trim();
        if (t && t.length > 0 && t.length < 200) texts.push(t);
      });

      // Extract name: first non-price, non-delivery text
      let name = '';
      for (const t of texts) {
        if (t.length > 5 && t.length < 120 && 
            !t.startsWith('₹') && !t.match(/^\d+%/) && !t.match(/^Rs/) &&
            !t.includes('Free') && !t.match(/^Add/i) && !t.match(/^Buy/i) &&
            !t.match(/^Showing/) && !t.match(/^Sort/)) {
          name = t.replace(/₹[\d,]+.*$/, '').trim();
          if (name.length > 5) break;
        }
      }

      // Extract prices
      let sp = 0, mrp = 0;
      for (const t of texts) {
        const priceMatches = t.match(/₹\s*([\d,]+)/g) || [];
        for (const m of priceMatches) {
          const price = parseInt(m.replace(/[₹,\s]/g, ''));
          if (price > 0 && price < 100000) {
            if (!sp) sp = price;
            else if (!mrp && price !== sp) mrp = price;
          }
        }
      }
      if (!mrp) mrp = sp;
      if (mrp < sp) [mrp, sp] = [sp, mrp];

      // Extract product ID from URL
      const idMatch = href.match(/\/p\/([a-z0-9]+)/i) || href.match(/\/(\d+)$/);
      const productId = idMatch ? idMatch[1] : '';

      if (name && sp > 0 && cardImages.length > 0) {
        results.push({
          name,
          meeshoSellingPrice: sp,
          meeshoMrp: mrp,
          imageUrl: cardImages[0],
          allImages: cardImages.slice(0, 5),
          meeshoLink: href,
          productId,
          rating: 0,
          reviews: 0,
          discount: '',
          source: 'meesho-dom',
        });
      }
    }

    return results;
  }, CONFIG.maxProducts);

  log(`  [DOM] Found ${products.length} products`, products.length > 0 ? 'SUCCESS' : 'WARN');
  return deduplicateProducts(products);
}

/**
 * Strategy 3: Scrape individual product detail pages for full data
 */
async function scrapeProductDetail(browser, productUrl) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
    );
    
    let apiData = null;
    page.on('response', async (response) => {
      try {
        const url = response.url();
        if ((url.includes('product') || url.includes('catalog')) && response.status() === 200) {
          const ct = response.headers()['content-type'] || '';
          if (ct.includes('json')) {
            const json = await response.json().catch(() => null);
            if (json && (json.product || json.catalog || json.data?.product)) {
              apiData = json.product || json.catalog || json.data?.product || json.data || json;
            }
          }
        }
      } catch {}
    });

    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    if (apiData) {
      return apiData;
    }
    return null;
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Deduplicate products by product ID or slug
 */
function deduplicateProducts(products) {
  const seen = new Map();
  const unique = [];

  for (const p of products) {
    const key = p.productId || genSlug(p.name);
    if (key && !seen.has(key)) {
      seen.set(key, true);
      p.name = cleanName(p.name);
      unique.push(p);
    }
  }

  return unique;
}

/**
 * Transform raw product into RJ Essentials format with margin pricing
 */
function transformForRJ(product, index) {
  const name = cleanName(product.name);
  const slug = genSlug(`${name}-${Date.now()}-${index}`);
  
  // Apply competitive margin
  const { sellingPrice, mrp } = applyMargin(product.meeshoSellingPrice, product.meeshoMrp);

  // Limit images to 2-5 per product
  const images = (product.allImages || [product.imageUrl])
    .filter(u => u && u.startsWith('http'))
    .slice(0, 5)
    .map(url => ({ url, publicId: '' }));

  return {
    name,
    slug,
    category: product.category || '',
    brand: 'RJ Essentials',
    description: '',
    highlights: [],
    specifications: [],
    images: images.length > 0 ? images : [{ url: '', publicId: '' }],
    mediaLinks: [],
    mrp,
    sellingPrice,
    stock: 50,
    variants: [],
    tags: [],
    meeshoLink: product.meeshoLink || '',
    meeshoNotes: `Scraped ${new Date().toISOString().split('T')[0]} | Cost: ₹${product.meeshoSellingPrice}`,
    returnDays: 7,
    status: 'draft',
    isFeatured: false,
    isDealOfDay: false,
    isNewArrival: true,
    isBestSeller: false,
    metaTitle: `${name} | Buy Online | RJ Essentials`,
    metaDescription: `Shop ${name} at ₹${sellingPrice}. Free delivery & COD available.`,
    _raw: {
      meeshoSellingPrice: product.meeshoSellingPrice,
      meeshoMrp: product.meeshoMrp,
      ratingAvg: product.rating || 0,
      ratingCount: product.reviews || 0,
      discount: product.discount || '',
      source: product.source || 'meesho',
      productId: product.productId || '',
      allImages: product.allImages || [],
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const catFilter = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
  log('🚀 RJ Essentials Scraper v4.0 (API-First)');

  let categories = MEESHO_CATEGORIES;
  if (catFilter) {
    categories = categories.filter(c => c.slug === catFilter || c.name.toLowerCase().includes(catFilter.toLowerCase()));
    if (!categories.length) { log(`No category: "${catFilter}"`, 'ERROR'); process.exit(1); }
  }
  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });

  let browser;
  try {
    browser = await puppeteerExtra.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
             '--disable-blink-features=AutomationControlled', '--window-size=412,915',
             '--disable-web-security', '--disable-features=VizDisplayCompositor'],
    });

    const allProducts = {};
    let total = 0;

    for (const cat of categories) {
      log(`\n── ${cat.name} ──────────────────────`);
      
      const raw = await scrapeViaApiInterception(browser, cat);
      
      // Assign category to each product
      const withCategory = raw.map(p => ({ ...p, category: cat.rjCategory }));
      const transformed = withCategory.map((p, i) => transformForRJ(p, total + i));
      
      allProducts[cat.slug] = {
        category: cat.name,
        rjCategory: cat.rjCategory,
        scrapedAt: new Date().toISOString(),
        count: transformed.length,
        products: transformed,
        rawProducts: withCategory,
      };
      total += transformed.length;
      
      log(`  Result: ${transformed.length} products for ${cat.name}`, transformed.length > 0 ? 'SUCCESS' : 'WARN');
      
      if (categories.indexOf(cat) < categories.length - 1) {
        await sleep(CONFIG.delayMs);
      }
    }

    const output = {
      metadata: {
        scrapedAt: new Date().toISOString(),
        totalProducts: total,
        categoriesScraped: Object.keys(allProducts).length,
        source: 'rj-essentials-scraper-v4',
        marginApplied: `${CONFIG.marginMin}-${CONFIG.marginMax}%`,
      },
      categories: allProducts,
    };

    const dateStr = new Date().toISOString().split('T')[0];
    fs.writeFileSync(path.join(CONFIG.outputDir, `meesho-trending-${dateStr}.json`), JSON.stringify(output, null, 2));
    fs.writeFileSync(path.join(CONFIG.outputDir, 'latest.json'), JSON.stringify(output, null, 2));
    log(`\n📊 Total: ${total} products across ${Object.keys(allProducts).length} categories`, 'SUCCESS');
    return output;
  } catch (e) {
    log(`Fatal: ${e.message}`, 'ERROR');
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

if (require.main === module) main().catch(console.error);
module.exports = { main, scrapeViaApiInterception, transformForRJ, cleanName, applyMargin };
