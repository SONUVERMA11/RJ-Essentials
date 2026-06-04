/**
 * Product Research Agent
 * ─────────────────────
 * Discovers trending products from Meesho, compares prices across Amazon & Flipkart,
 * and collects CLEAN images (never from Meesho — their images have watermarks).
 */

import puppeteer, { type Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { SCRAPING, OUTPUT_DIR } from './config.js';
import { log, logToFile, delay, getRandomUserAgent, slugify, writeJson, todayStr, ensureOutputDirs } from './utils.js';

const AGENT = 'product-research';

// ─── Types ───────────────────────────────────────────────────────────
export interface ResearchedProduct {
    name: string;
    slug: string;
    brand: string;
    category: string;
    meeshoPrice: number;
    meeshoLink: string;
    meeshoRating: number;
    meeshoReviewCount: number;
    // Clean images from Amazon/Flipkart (NOT Meesho)
    cleanImageUrls: { url: string; source: 'amazon' | 'flipkart' | 'brand-website' }[];
    // Cross-platform comparison
    amazonPrice: number | null;
    amazonLink: string;
    amazonImages: string[];
    flipkartPrice: number | null;
    flipkartLink: string;
    flipkartImages: string[];
    // Product details (from any source)
    description: string;
    highlights: string[];
    specifications: { key: string; value: string }[];
    // Scoring
    profitScore: number;
    demandScore: number;
    overallScore: number;
}

// ─── Stealth Page Setup ──────────────────────────────────────────────

async function setupStealthPage(browser: Browser) {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1366, height: 768 });

    // Remove webdriver flag to avoid bot detection
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        // Spoof plugins and languages
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'hi'] });
        // Spoof chrome property
        (window as any).chrome = { runtime: {} };
    });

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
    });

    return page;
}

// ─── Meesho Scraper ──────────────────────────────────────────────────

async function scrapeMeeshoCategory(
    browser: Browser,
    categoryUrl: string,
    maxProducts: number = 20
): Promise<Partial<ResearchedProduct>[]> {
    log(AGENT, 'INFO', `Scraping Meesho category: ${categoryUrl}`);

    // ── Strategy 1: Network interception (most reliable) ──
    const products = await scrapeMeeshoViaNetwork(browser, categoryUrl, maxProducts);
    if (products.length > 0) {
        log(AGENT, 'SUCCESS', `Found ${products.length} products via network interception`);
        return products;
    }

    // ── Strategy 2: DOM scraping with updated selectors ──
    log(AGENT, 'INFO', 'Network interception returned 0 products, trying DOM scraping...');
    const domProducts = await scrapeMeeshoViaDOM(browser, categoryUrl, maxProducts);
    if (domProducts.length > 0) {
        log(AGENT, 'SUCCESS', `Found ${domProducts.length} products via DOM scraping`);
        return domProducts;
    }

    // ── Strategy 3: Search-based fallback ──
    log(AGENT, 'INFO', 'DOM scraping returned 0 products, trying search-based fallback...');
    const searchTerm = extractSearchTermFromUrl(categoryUrl);
    if (searchTerm) {
        const searchProducts = await scrapeMeeshoViaSearch(browser, searchTerm, maxProducts);
        log(AGENT, 'SUCCESS', `Found ${searchProducts.length} products via search fallback`);
        return searchProducts;
    }

    log(AGENT, 'WARN', 'All Meesho scraping strategies failed — 0 products found');
    return [];
}

/** Extract a search term from a Meesho category URL */
function extractSearchTermFromUrl(url: string): string {
    try {
        const pathname = new URL(url).pathname;
        // e.g. /western-wear-women/pl/4aus → "western wear women"
        const segment = pathname.split('/').filter(Boolean)[0] || '';
        return segment.replace(/-/g, ' ').replace(/pl$/, '').trim();
    } catch {
        return '';
    }
}

/** Strategy 1: Intercept Meesho API network calls to capture product JSON */
async function scrapeMeeshoViaNetwork(
    browser: Browser,
    categoryUrl: string,
    maxProducts: number
): Promise<Partial<ResearchedProduct>[]> {
    const page = await setupStealthPage(browser);
    const capturedProducts: Partial<ResearchedProduct>[] = [];

    try {
        // Intercept API responses that contain product data
        await page.setRequestInterception(true);
        const apiResponses: any[] = [];

        page.on('request', (req) => {
            req.continue();
        });

        page.on('response', async (res) => {
            try {
                const url = res.url();
                // Meesho loads products via internal API calls
                if (
                    (url.includes('/api/v1/products') ||
                     url.includes('/api/v2/products') ||
                     url.includes('/api/') && url.includes('product') ||
                     url.includes('catalog') ||
                     url.includes('search')) &&
                    res.headers()['content-type']?.includes('application/json')
                ) {
                    const json = await res.json().catch(() => null);
                    if (json) apiResponses.push(json);
                }
            } catch { /* ignore non-JSON responses */ }
        });

        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });
        await delay(3000, 5000);

        // Scroll to trigger more API calls
        for (let i = 0; i < 4; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await delay(2000, 3000);
        }

        // Parse captured API responses
        for (const json of apiResponses) {
            const productList = json?.catalogs || json?.products || json?.data?.catalogs || json?.data?.products || json?.data || [];
            if (!Array.isArray(productList)) continue;

            for (const item of productList) {
                if (capturedProducts.length >= maxProducts) break;
                const name = item.name || item.product_name || item.title || '';
                const price = item.min_catalog_price || item.price || item.selling_price || item.min_product_price || 0;
                const link = item.url || item.slug || item.product_id || '';
                const rating = item.average_rating || item.rating || 0;
                const reviewCount = item.review_count || item.reviews_count || 0;

                if (!name || !price) continue;

                const productLink = link.startsWith('http')
                    ? link
                    : `https://www.meesho.com/${link.startsWith('/') ? link.slice(1) : link}`;

                capturedProducts.push({
                    name,
                    meeshoPrice: typeof price === 'number' ? price : parseInt(String(price).replace(/[^\d]/g, '')) || 0,
                    meeshoLink: productLink,
                    meeshoRating: parseFloat(String(rating)) || 0,
                    meeshoReviewCount: parseInt(String(reviewCount)) || 0,
                    slug: slugify(name),
                    cleanImageUrls: [],
                });
            }
        }

        return capturedProducts;
    } catch (error) {
        log(AGENT, 'WARN', `Network interception failed: ${(error as Error).message}`);
        return [];
    } finally {
        await page.close();
    }
}

/** Strategy 2: DOM scraping with updated Meesho selectors */
async function scrapeMeeshoViaDOM(
    browser: Browser,
    url: string,
    maxProducts: number
): Promise<Partial<ResearchedProduct>[]> {
    const page = await setupStealthPage(browser);

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });

        // Wait for product cards to render (Meesho is a React SPA)
        await page.waitForSelector('a[href*="/p/"]', { timeout: 15000 }).catch(() => {
            log(AGENT, 'WARN', 'Timed out waiting for product cards in DOM');
        });

        await delay(2000, 3000);

        // Scroll to load more products
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await delay(1500, 2500);
        }

        const html = await page.content();
        const $ = cheerio.load(html);
        const products: Partial<ResearchedProduct>[] = [];

        // Updated selectors for current Meesho styled-components DOM
        // Product cards are <a> tags with href containing "/p/"
        $('a[href*="/p/"]').each((_i, el) => {
            if (products.length >= maxProducts) return;

            const $card = $(el);
            const link = $card.attr('href') || '';

            // Skip non-product links (e.g. nav links, footer links)
            if (!link.match(/\/p\/[a-zA-Z0-9]+/)) return;

            // Product name — styled-components class with "ProductTitle" or "Title"
            const name = $card.find('p[class*="ProductTitle"], p[class*="StyledDesktopProductTitle"]').first().text().trim()
                || $card.find('p').filter((_i, p) => {
                    const text = $(p).text().trim();
                    return text.length > 10 && text.length < 200;
                }).first().text().trim();

            // Price — h5 or span with price-related class
            const priceEl = $card.find('h5[class*="ProductPrice"], h5[class*="StyledDesktopProductPrice"]').first().text()
                || $card.find('h5').first().text();
            const priceText = priceEl.replace(/[^\d]/g, '');

            // Rating
            const ratingText = $card.find('span[class*="rating"], span[class*="Rating"]').first().text()
                || $card.find('span').filter((_i, s) => /^\d\.\d$/.test($(s).text().trim())).first().text();

            // Review count
            const reviewText = $card.find('span').filter((_i, s) => /\d+\s*reviews?/i.test($(s).text())).first().text();
            const reviewCount = parseInt(reviewText.replace(/[^\d]/g, '')) || 0;

            if (!name || !priceText) return;

            products.push({
                name,
                meeshoPrice: parseInt(priceText) || 0,
                meeshoLink: link.startsWith('http') ? link : `https://www.meesho.com${link}`,
                meeshoRating: parseFloat(ratingText) || 0,
                meeshoReviewCount: reviewCount,
                slug: slugify(name),
                // DO NOT collect Meesho images — they have watermarks!
                cleanImageUrls: [],
            });
        });

        return products;
    } catch (error) {
        log(AGENT, 'WARN', `DOM scraping failed: ${(error as Error).message}`);
        return [];
    } finally {
        await page.close();
    }
}

/** Strategy 3: Use Meesho search instead of direct category navigation */
async function scrapeMeeshoViaSearch(
    browser: Browser,
    searchTerm: string,
    maxProducts: number
): Promise<Partial<ResearchedProduct>[]> {
    log(AGENT, 'INFO', `Trying Meesho search for: "${searchTerm}"`);
    const searchUrl = `https://www.meesho.com/search?q=${encodeURIComponent(searchTerm)}`;
    // Re-use the DOM scraper on the search results page
    return scrapeMeeshoViaDOM(browser, searchUrl, maxProducts);
}

// ─── Amazon Search & Image Collection ────────────────────────────────

async function searchAmazon(
    browser: Browser,
    productName: string
): Promise<{ price: number | null; link: string; images: string[]; highlights: string[]; specs: { key: string; value: string }[] }> {
    const page = await setupStealthPage(browser);

    try {
        const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });
        await delay();

        const html = await page.content();
        const $ = cheerio.load(html);

        // Get first result
        const firstResult = $('[data-component-type="s-search-result"]').first();
        const link = firstResult.find('a.a-link-normal[href*="/dp/"]').attr('href') || '';
        const priceText = firstResult.find('.a-price .a-offscreen').first().text().replace(/[^\d]/g, '');
        const fullLink = link ? `https://www.amazon.in${link.split('?')[0]}` : '';

        if (!fullLink) {
            return { price: null, link: '', images: [], highlights: [], specs: [] };
        }

        // Visit product page for clean images and details
        await page.goto(fullLink, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });
        await delay();

        const productHtml = await page.content();
        const $prod = cheerio.load(productHtml);

        // Collect CLEAN Amazon images (these are watermark-free!)
        const images: string[] = [];
        $prod('#imgTagWrapperId img, #imageBlock img, .imgTagWrapper img').each((_, el) => {
            const src = $prod(el).attr('data-old-hires') || $prod(el).attr('src') || '';
            if (src && src.includes('images-amazon.com') && !src.includes('sprite') && src.length > 50) {
                // Get high-res version
                const hiRes = src.replace(/\._[A-Z]+[0-9]+_\./, '._SL1500_.');
                images.push(hiRes);
            }
        });

        // Collect highlights
        const highlights: string[] = [];
        $prod('#feature-bullets li, [data-feature-name="featurebullets"] li').each((_, el) => {
            const text = $prod(el).text().trim();
            if (text && text.length > 5 && text.length < 200) highlights.push(text);
        });

        // Collect specs
        const specs: { key: string; value: string }[] = [];
        $prod('#productDetails_techSpec_section_1 tr, .prodDetTable tr, #technicalSpecifications_section_1 tr').each((_, el) => {
            const key = $prod(el).find('th, td:first-child').text().trim();
            const value = $prod(el).find('td:last-child').text().trim();
            if (key && value && key !== value) specs.push({ key, value });
        });

        return {
            price: parseInt(priceText) || null,
            link: fullLink,
            images: [...new Set(images)].slice(0, 6),
            highlights: highlights.slice(0, 8),
            specs: specs.slice(0, 15),
        };
    } catch (error) {
        log(AGENT, 'WARN', `Amazon search failed for "${productName}": ${(error as Error).message}`);
        return { price: null, link: '', images: [], highlights: [], specs: [] };
    } finally {
        await page.close();
    }
}

// ─── Flipkart Search & Image Collection ──────────────────────────────

async function searchFlipkart(
    browser: Browser,
    productName: string
): Promise<{ price: number | null; link: string; images: string[] }> {
    const page = await setupStealthPage(browser);

    try {
        const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });
        await delay();

        const html = await page.content();
        const $ = cheerio.load(html);

        // Get first result
        const firstLink = $('a[href*="/p/"]').first().attr('href') || '';
        const fullLink = firstLink ? `https://www.flipkart.com${firstLink}` : '';

        if (!fullLink) {
            return { price: null, link: '', images: [] };
        }

        // Visit product page
        await page.goto(fullLink, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });
        await delay();

        const productHtml = await page.content();
        const $prod = cheerio.load(productHtml);

        const priceText = $prod('[class*="Nx9bqj"], [class*="selling-price"], ._30jeq3').first().text().replace(/[^\d]/g, '');

        // Collect CLEAN Flipkart images
        const images: string[] = [];
        $prod('img[src*="rukminim"], img[data-src*="rukminim"]').each((_, el) => {
            const src = $prod(el).attr('src') || $prod(el).attr('data-src') || '';
            if (src && src.includes('rukminim') && !src.includes('128/128')) {
                // Get high-res version
                const hiRes = src.replace(/\/\d+\/\d+\//g, '/832/832/');
                images.push(hiRes);
            }
        });

        return {
            price: parseInt(priceText) || null,
            link: fullLink,
            images: [...new Set(images)].slice(0, 6),
        };
    } catch (error) {
        log(AGENT, 'WARN', `Flipkart search failed for "${productName}": ${(error as Error).message}`);
        return { price: null, link: '', images: [] };
    } finally {
        await page.close();
    }
}

// ─── Product Scoring ─────────────────────────────────────────────────

function scoreProduct(product: ResearchedProduct): ResearchedProduct {
    // Profit score: based on price difference potential
    let profitScore = 0;
    const sourcePrice = product.meeshoPrice;
    if (product.amazonPrice && product.amazonPrice > sourcePrice * 1.3) profitScore += 40;
    else if (product.amazonPrice && product.amazonPrice > sourcePrice * 1.2) profitScore += 30;
    else profitScore += 15;

    // Demand score: based on ratings and image availability
    let demandScore = 0;
    if (product.meeshoRating >= 4.0) demandScore += 30;
    else if (product.meeshoRating >= 3.5) demandScore += 20;
    else demandScore += 10;

    if (product.meeshoReviewCount > 1000) demandScore += 20;
    else if (product.meeshoReviewCount > 100) demandScore += 10;

    // Image availability bonus (clean images are essential)
    if (product.cleanImageUrls.length >= 3) demandScore += 20;
    else if (product.cleanImageUrls.length >= 1) demandScore += 10;

    const overallScore = profitScore + demandScore;

    return {
        ...product,
        profitScore,
        demandScore,
        overallScore,
    };
}

// ─── Main Agent Workflow ─────────────────────────────────────────────

export async function runProductResearch(
    meeshoCategoryUrl: string,
    maxProducts: number = 10,
    dryRun: boolean = false
): Promise<ResearchedProduct[]> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', `Starting product research. Category: ${meeshoCategoryUrl}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--window-size=1366,768',
        ],
    });

    try {
        // Step 1: Scrape Meesho for product discovery
        const meeshoProducts = await scrapeMeeshoCategory(browser, meeshoCategoryUrl, maxProducts);
        log(AGENT, 'INFO', `Discovered ${meeshoProducts.length} products from Meesho`);

        const researchedProducts: ResearchedProduct[] = [];

        // Step 2: Cross-platform search for each product
        for (const product of meeshoProducts) {
            if (!product.name) continue;
            log(AGENT, 'INFO', `Researching: ${product.name}`);

            // Search Amazon (primary source for clean images)
            const amazonData = await searchAmazon(browser, product.name);
            await delay();

            // Search Flipkart (secondary source)
            const flipkartData = await searchFlipkart(browser, product.name);
            await delay();

            // Build clean image URLs (Amazon first, then Flipkart — NEVER Meesho)
            const cleanImageUrls: { url: string; source: 'amazon' | 'flipkart' }[] = [];
            for (const img of amazonData.images) {
                cleanImageUrls.push({ url: img, source: 'amazon' });
            }
            for (const img of flipkartData.images) {
                cleanImageUrls.push({ url: img, source: 'flipkart' });
            }

            const researched: ResearchedProduct = {
                name: product.name!,
                slug: product.slug || slugify(product.name!),
                brand: '',
                category: '',
                meeshoPrice: product.meeshoPrice || 0,
                meeshoLink: product.meeshoLink || '',
                meeshoRating: product.meeshoRating || 0,
                meeshoReviewCount: product.meeshoReviewCount || 0,
                cleanImageUrls,
                amazonPrice: amazonData.price,
                amazonLink: amazonData.link,
                amazonImages: amazonData.images,
                flipkartPrice: flipkartData.price,
                flipkartLink: flipkartData.link,
                flipkartImages: flipkartData.images,
                description: '',
                highlights: amazonData.highlights,
                specifications: amazonData.specs,
                profitScore: 0,
                demandScore: 0,
                overallScore: 0,
            };

            // Score the product
            const scored = scoreProduct(researched);
            researchedProducts.push(scored);

            log(AGENT, 'SUCCESS', `${product.name}: Score=${scored.overallScore}, Images=${cleanImageUrls.length}, Amazon=₹${amazonData.price || 'N/A'}, Flipkart=₹${flipkartData.price || 'N/A'}`);
        }

        // Step 3: Sort by overall score
        researchedProducts.sort((a, b) => b.overallScore - a.overallScore);

        // Step 4: Save reports
        if (!dryRun) {
            const reportPath = `${OUTPUT_DIR}/reports/research-report-${todayStr()}.json`;
            await writeJson(reportPath, {
                date: todayStr(),
                source: meeshoCategoryUrl,
                totalProducts: researchedProducts.length,
                products: researchedProducts,
            });
            log(AGENT, 'SUCCESS', `Research report saved: ${reportPath}`);

            // Save top products to queue for listing agent
            const topProducts = researchedProducts.filter((p) => p.overallScore >= 30 && p.cleanImageUrls.length > 0);
            const queuePath = `${OUTPUT_DIR}/product-queue.json`;
            await writeJson(queuePath, topProducts);
            log(AGENT, 'SUCCESS', `${topProducts.length} products queued for listing: ${queuePath}`);
        } else {
            log(AGENT, 'INFO', '[DRY RUN] Would save report and queue files');
            console.log(JSON.stringify(researchedProducts.slice(0, 3), null, 2));
        }

        await logToFile(AGENT, 'SUCCESS', `Research complete. ${researchedProducts.length} products analyzed.`);
        return researchedProducts;
    } finally {
        await browser.close();
    }
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('product-research')) {
    const url = process.argv[2] || 'https://www.meesho.com/mobile-accessories/pl/7bj';
    const max = parseInt(process.argv[3] || '10');
    const dryRun = process.argv.includes('--dry-run');

    runProductResearch(url, max, dryRun)
        .then((products) => {
            log(AGENT, 'SUCCESS', `Done! ${products.length} products researched.`);
            process.exit(0);
        })
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
