/**
 * Inventory & Pricing Agent
 * ─────────────────────────
 * Monitors stock levels, checks competitor prices,
 * and generates daily inventory health reports.
 */

import path from 'path';
import puppeteer, { type Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { OUTPUT_DIR, PRICING, SCRAPING } from './config.js';
import { log, logToFile, delay, getRandomUserAgent, writeJson, todayStr, ensureOutputDirs, formatPrice } from './utils.js';
import { getProducts, type Product } from './api-client.js';

const AGENT = 'inventory-pricing';

// ─── Types ───────────────────────────────────────────────────────────
interface StockAlert {
    productId: string;
    name: string;
    slug: string;
    currentStock: number;
    level: 'critical' | 'low' | 'out-of-stock';
}

interface PriceChange {
    productId: string;
    name: string;
    slug: string;
    ourPrice: number;
    meeshoLink: string;
    oldSourcePrice: number;
    newSourcePrice: number;
    suggestedPrice: number;
    priceDiff: number;
}

interface InventoryReport {
    date: string;
    totalProducts: number;
    activeProducts: number;
    outOfStock: StockAlert[];
    criticalStock: StockAlert[];
    lowStock: StockAlert[];
    priceChanges: PriceChange[];
    summary: {
        healthyStock: number;
        lowStockCount: number;
        outOfStockCount: number;
        priceChangesCount: number;
    };
}

// ─── Check Current Meesho Price ──────────────────────────────────────
async function checkMeeshoPrice(browser: Browser, meeshoLink: string): Promise<number | null> {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());

    try {
        await page.goto(meeshoLink, { waitUntil: 'domcontentloaded', timeout: SCRAPING.timeout });
        await delay(1500, 3000);

        const html = await page.content();
        const $ = cheerio.load(html);

        const priceText = $('[class*="price"], [class*="Price"]').first().text().replace(/[^\d]/g, '');
        return parseInt(priceText) || null;
    } catch {
        return null;
    } finally {
        await page.close();
    }
}

// ─── Main Agent Workflow ─────────────────────────────────────────────
export async function runInventoryPricing(
    checkPrices: boolean = true,
    dryRun: boolean = false
): Promise<InventoryReport> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', 'Starting inventory & pricing check');

    // Fetch all products
    const allProducts: Product[] = [];
    let page = 1;
    while (true) {
        const response = await getProducts({ page: page.toString(), limit: '100', status: 'all' });
        if (response.products) allProducts.push(...response.products);
        if (!response.pagination || page >= response.pagination.pages) break;
        page++;
    }

    log(AGENT, 'INFO', `Fetched ${allProducts.length} total products`);

    // Step 1: Stock level analysis
    const outOfStock: StockAlert[] = [];
    const criticalStock: StockAlert[] = [];
    const lowStock: StockAlert[] = [];

    for (const product of allProducts) {
        if (product.status !== 'active') continue;

        const alert: StockAlert = {
            productId: product._id || '',
            name: product.name,
            slug: product.slug,
            currentStock: product.stock,
            level: 'low',
        };

        if (product.stock === 0) {
            alert.level = 'out-of-stock';
            outOfStock.push(alert);
        } else if (product.stock <= 3) {
            alert.level = 'critical';
            criticalStock.push(alert);
        } else if (product.stock <= 10) {
            alert.level = 'low';
            lowStock.push(alert);
        }
    }

    log(AGENT, 'INFO', `Stock: ${outOfStock.length} out-of-stock, ${criticalStock.length} critical, ${lowStock.length} low`);

    // Step 2: Price monitoring (optional, uses browser)
    const priceChanges: PriceChange[] = [];

    if (checkPrices) {
        const productsWithMeesho = allProducts.filter((p) => p.meeshoLink && p.status === 'active');
        log(AGENT, 'INFO', `Checking prices for ${productsWithMeesho.length} products with Meesho links`);

        if (productsWithMeesho.length > 0 && !dryRun) {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            try {
                for (const product of productsWithMeesho.slice(0, 20)) {
                    try {
                        const currentMeeshoPrice = await checkMeeshoPrice(browser, product.meeshoLink);

                        if (currentMeeshoPrice) {
                            const meeshoNotesMatch = product.meeshoNotes.match(/₹(\d+)/);
                            const oldSourcePrice = meeshoNotesMatch ? parseInt(meeshoNotesMatch[1]) : 0;

                            if (oldSourcePrice && Math.abs(currentMeeshoPrice - oldSourcePrice) > 5) {
                                const suggestedPrice = Math.round(currentMeeshoPrice * (1 + PRICING.defaultMarkupPercent / 100));

                                priceChanges.push({
                                    productId: product._id || '',
                                    name: product.name,
                                    slug: product.slug,
                                    ourPrice: product.sellingPrice,
                                    meeshoLink: product.meeshoLink,
                                    oldSourcePrice,
                                    newSourcePrice: currentMeeshoPrice,
                                    suggestedPrice,
                                    priceDiff: currentMeeshoPrice - oldSourcePrice,
                                });

                                log(AGENT, 'WARN', `Price change: ${product.name} — Meesho ₹${oldSourcePrice} → ₹${currentMeeshoPrice}`);
                            }
                        }
                    } catch {
                        // Skip silently
                    }
                    await delay();
                }
            } finally {
                await browser.close();
            }
        }
    }

    // Step 3: Generate report
    const activeProducts = allProducts.filter((p) => p.status === 'active').length;
    const report: InventoryReport = {
        date: todayStr(),
        totalProducts: allProducts.length,
        activeProducts,
        outOfStock,
        criticalStock,
        lowStock,
        priceChanges,
        summary: {
            healthyStock: activeProducts - outOfStock.length - criticalStock.length - lowStock.length,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            priceChangesCount: priceChanges.length,
        },
    };

    if (!dryRun) {
        const reportPath = path.join(OUTPUT_DIR, 'reports', `inventory-report-${todayStr()}.json`);
        await writeJson(reportPath, report);
        log(AGENT, 'SUCCESS', `Report saved: ${reportPath}`);
    }

    // Console summary
    log(AGENT, 'SUCCESS', `\n── Inventory Health ──\n  📦 Total Products: ${allProducts.length}\n  ✅ Healthy Stock: ${report.summary.healthyStock}\n  ⚠️ Low Stock: ${report.summary.lowStockCount}\n  🔴 Out of Stock: ${report.summary.outOfStockCount}\n  💰 Price Changes: ${report.summary.priceChangesCount}`);

    await logToFile(AGENT, 'SUCCESS', `Inventory check complete`);
    return report;
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('inventory-pricing')) {
    const checkPrices = !process.argv.includes('--no-prices');
    const dryRun = process.argv.includes('--dry-run');

    runInventoryPricing(checkPrices, dryRun)
        .then(() => process.exit(0))
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
