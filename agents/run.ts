/**
 * RJ ESSENTIALS — One-Click Agent Runner
 * ────────────────────────────────────────
 * Single command to run the entire agent pipeline:
 *
 *   npx tsx agents/run.ts
 *
 * Agents run in order, each passing data to the next via the shared pipeline state.
 * If any input is needed (like a Meesho URL), the user is prompted interactively.
 */

import readline from 'readline';
import path from 'path';
import { validateConfig } from './config.js';
import { log, logToFile, ensureOutputDirs, writeJson, todayStr } from './utils.js';
import { testConnection, getProducts, type Product } from './api-client.js';
import { createEmptyPipeline, markStepComplete, addError, type PipelineState } from './pipeline.js';
import { runInventoryPricing } from './inventory-pricing.js';
import { runOrderManagement } from './order-management.js';
import { runAnalytics } from './analytics-reporting.js';
import { runSocialMediaMarketing } from './social-media-marketing.js';
import { runWebsiteManager } from './website-manager.js';
import { OUTPUT_DIR } from './config.js';

const AGENT = 'runner';

// ─── Interactive readline prompt ─────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

function askYesNo(question: string, defaultYes: boolean = true): Promise<boolean> {
    return new Promise((resolve) => {
        const hint = defaultYes ? '[Y/n]' : '[y/N]';
        rl.question(`${question} ${hint}: `, (answer) => {
            const a = answer.trim().toLowerCase();
            if (a === '') resolve(defaultYes);
            else resolve(a === 'y' || a === 'yes');
        });
    });
}

function askChoice(question: string, choices: string[]): Promise<number> {
    return new Promise((resolve) => {
        console.log(`\n${question}`);
        choices.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
        rl.question(`\nChoice [1-${choices.length}]: `, (answer) => {
            const num = parseInt(answer.trim());
            if (num >= 1 && num <= choices.length) resolve(num - 1);
            else resolve(0); // default to first
        });
    });
}

// ─── Progress Display ────────────────────────────────────────────────

function showBanner() {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🤖  RJ ESSENTIALS — Agent Command Center              ║
║                                                          ║
║   Automated store management at your fingertips          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);
}

function showStep(step: number, total: number, name: string, status: 'running' | 'done' | 'skipped' | 'error') {
    const icons = { running: '⏳', done: '✅', skipped: '⏭️', error: '❌' };
    const bar = '█'.repeat(step) + '░'.repeat(total - step);
    console.log(`\n${icons[status]} [${step}/${total}] ${bar} ${name}`);
}

function showSummary(state: PipelineState) {
    const elapsed = ((Date.now() - new Date(state.startedAt).getTime()) / 1000).toFixed(1);

    console.log(`
╔══════════════════════════════════════════════════════════╗
║                    📊 PIPELINE SUMMARY                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║`);

    if (state.inventory.ran) {
        console.log(`║  📦 Inventory:  ${state.inventory.healthyCount} healthy, ${state.inventory.outOfStock.length} out-of-stock, ${state.inventory.lowStock.length} low`);
    }
    if (state.orders.ran) {
        console.log(`║  🛒 Orders:     ${state.orders.pendingCount} pending, ₹${state.orders.todayRevenue} today revenue`);
    }
    if (state.analytics.ran) {
        console.log(`║  📈 Analytics:  ₹${state.analytics.totalRevenue} total revenue`);
        if (state.analytics.topProducts.length > 0) {
            console.log(`║  🏆 Top:        ${state.analytics.topProducts[0].name}`);
        }
    }
    if (state.marketing.ran) {
        console.log(`║  📱 Marketing:  ${state.marketing.generated} content packages generated`);
    }
    if (state.website.ran) {
        console.log(`║  🌐 Website:    ${state.website.sectionsUpdated} sections, ${state.website.bannersUpdated} banners updated`);
    }
    if (state.listing.ran) {
        console.log(`║  📝 Listings:   ${state.listing.created} created, ${state.listing.failed} failed`);
    }
    if (state.research.ran) {
        console.log(`║  🔍 Research:   ${state.research.productsFound} products found, ${state.research.queuedForListing} queued`);
    }

    console.log(`║                                                          ║`);
    console.log(`║  ⏱️ Total time: ${elapsed}s`);
    if (state.errors.length > 0) {
        console.log(`║  ⚠️ Errors: ${state.errors.length}`);
        state.errors.forEach((e) => console.log(`║    → [${e.agent}] ${e.error}`));
    }
    console.log(`║  ✅ Steps completed: ${state.completedSteps.length}`);
    console.log(`║                                                          ║`);
    console.log(`╚══════════════════════════════════════════════════════════╝`);
}

// ─── Load All Products (shared) ──────────────────────────────────────

async function loadAllProducts(): Promise<Product[]> {
    const allProducts: Product[] = [];
    let page = 1;
    while (true) {
        const res = await getProducts({ page: page.toString(), limit: '100', status: 'all' });
        if (res.products) allProducts.push(...res.products);
        if (!res.pagination || page >= res.pagination.pages) break;
        page++;
    }
    return allProducts;
}

// ─── Pipeline Steps ──────────────────────────────────────────────────

async function runInventoryStep(state: PipelineState, dryRun: boolean): Promise<void> {
    try {
        const report = await runInventoryPricing(false, dryRun); // no price check for speed
        state.inventory.ran = true;
        state.inventory.outOfStock = report.outOfStock.map((a) => ({ name: a.name, id: a.productId }));
        state.inventory.lowStock = report.lowStock.map((a) => ({ name: a.name, id: a.productId, stock: a.currentStock }));
        state.inventory.priceChanges = report.priceChanges.map((p) => ({ name: p.name, oldPrice: p.oldSourcePrice, newPrice: p.newSourcePrice }));
        state.inventory.healthyCount = report.summary.healthyStock;
        markStepComplete(state, 'inventory');
    } catch (err) {
        addError(state, 'inventory', (err as Error).message);
    }
}

async function runOrdersStep(state: PipelineState, dryRun: boolean): Promise<void> {
    try {
        const summary = await runOrderManagement(dryRun);
        state.orders.ran = true;
        state.orders.totalOrders = summary.totalOrders;
        state.orders.pendingCount = summary.pendingOrders.length;
        state.orders.staleCount = summary.staleOrders.length;
        state.orders.todayRevenue = summary.revenue.today;
        state.orders.meeshoItemsCount = summary.meeshoOrderList.length;
        markStepComplete(state, 'orders');
    } catch (err) {
        addError(state, 'orders', (err as Error).message);
    }
}

async function runAnalyticsStep(state: PipelineState, days: number, dryRun: boolean): Promise<void> {
    try {
        const report = await runAnalytics(days, dryRun);
        state.analytics.ran = true;
        state.analytics.totalRevenue = report.sales.totalRevenue;
        state.analytics.topProducts = report.topProducts.map((p) => ({ name: p.name, id: '', soldCount: p.soldCount, revenue: p.revenue }));
        state.analytics.worstProducts = report.worstProducts.map((p) => ({ name: p.name, id: '' }));
        state.analytics.recommendations = report.recommendations;
        state.analytics.topCategory = report.categoryPerformance[0]?.category || '';
        markStepComplete(state, 'analytics');
    } catch (err) {
        addError(state, 'analytics', (err as Error).message);
    }
}

async function runMarketingStep(state: PipelineState, maxProducts: number, dryRun: boolean): Promise<void> {
    try {
        const result = await runSocialMediaMarketing('new-arrivals', maxProducts, dryRun);
        state.marketing.ran = true;
        state.marketing.generated = result.generated;
        state.marketing.failed = result.failed;
        state.marketing.contentDir = path.join(OUTPUT_DIR, 'social-content', todayStr());
        markStepComplete(state, 'marketing');
    } catch (err) {
        addError(state, 'marketing', (err as Error).message);
    }
}

async function runWebsiteStep(state: PipelineState, dryRun: boolean): Promise<void> {
    try {
        await runWebsiteManager(state, dryRun);
        markStepComplete(state, 'website');
    } catch (err) {
        addError(state, 'website', (err as Error).message);
    }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
    showBanner();

    // Validate config
    const config = validateConfig();
    if (!config.valid) {
        console.log('❌ Configuration errors:');
        config.errors.forEach((e) => console.log(`   → ${e}`));
        console.log('\nPlease fix these in your .env.local file and try again.');
        rl.close();
        process.exit(1);
    }

    // Test API connection
    console.log('🔌 Testing API connection...');
    const connected = await testConnection();
    if (!connected) {
        console.log('❌ Cannot connect to your website API. Make sure the website is running.');
        const siteUrl = await ask('Enter your website URL (or press Enter for default): ');
        if (siteUrl) {
            console.log('💡 Update NEXT_PUBLIC_BASE_URL in .env.local and try again.');
        }
        rl.close();
        process.exit(1);
    }

    await ensureOutputDirs();
    const state = createEmptyPipeline();

    // Ask what to do
    const modeChoice = await askChoice('What would you like to do?', [
        '🚀 Full Daily Maintenance (recommended)',
        '🔍 Research + List New Products',
        '📱 Generate Marketing Content Only',
        '📦 Check Inventory Only',
        '🛒 Process Orders Only',
        '📊 Generate Analytics Report Only',
        '🌐 Update Website Sections/Banners Only',
    ]);

    const dryRun = await askYesNo('Run in dry-run mode (preview only, no changes)?', false);
    if (dryRun) console.log('\n🔸 DRY RUN MODE — no actual changes will be made\n');

    const totalSteps = modeChoice === 0 ? 5 : 1;

    try {
        switch (modeChoice) {
            case 0: // Full Daily Maintenance
            {
                // Load all products once (shared by all agents)
                console.log('\n📂 Loading product catalog...');
                state.allProducts = await loadAllProducts();
                console.log(`   Found ${state.allProducts.length} products\n`);

                showStep(1, totalSteps, 'Inventory & Pricing', 'running');
                await runInventoryStep(state, dryRun);
                showStep(1, totalSteps, 'Inventory & Pricing', state.inventory.ran ? 'done' : 'error');

                showStep(2, totalSteps, 'Order Management', 'running');
                await runOrdersStep(state, dryRun);
                showStep(2, totalSteps, 'Order Management', state.orders.ran ? 'done' : 'error');

                showStep(3, totalSteps, 'Analytics & Reporting', 'running');
                const analyticsDays = 30;
                await runAnalyticsStep(state, analyticsDays, dryRun);
                showStep(3, totalSteps, 'Analytics & Reporting', state.analytics.ran ? 'done' : 'error');

                showStep(4, totalSteps, 'Social Media Marketing', 'running');
                await runMarketingStep(state, 3, dryRun);
                showStep(4, totalSteps, 'Social Media Marketing', state.marketing.ran ? 'done' : 'error');

                showStep(5, totalSteps, 'Website Manager', 'running');
                await runWebsiteStep(state, dryRun);
                showStep(5, totalSteps, 'Website Manager', state.website.ran ? 'done' : 'error');

                break;
            }

            case 1: // Research + List
            {
                const meeshoUrl = await ask('Enter Meesho category URL: ');
                if (!meeshoUrl) {
                    console.log('❌ Meesho URL is required for research');
                    break;
                }
                const maxProducts = parseInt(await ask('Max products to research [10]: ') || '10');

                showStep(1, 2, 'Product Research', 'running');
                try {
                    const { runProductResearch } = await import('./product-research.js');
                    const products = await runProductResearch(meeshoUrl, maxProducts, dryRun);
                    state.research.ran = true;
                    state.research.productsFound = products.length;
                    state.research.topProducts = products.slice(0, 5).map((p) => ({
                        name: p.name, score: p.overallScore, meeshoPrice: p.meeshoPrice, cleanImages: p.cleanImageUrls.length,
                    }));
                    state.research.queuedForListing = products.filter((p) => p.overallScore >= 30 && p.cleanImageUrls.length > 0).length;
                    markStepComplete(state, 'research');
                    showStep(1, 2, 'Product Research', 'done');
                } catch (err) {
                    addError(state, 'research', (err as Error).message);
                    showStep(1, 2, 'Product Research', 'error');
                }

                if (state.research.queuedForListing > 0) {
                    const doListing = await askYesNo(`Found ${state.research.queuedForListing} products to list. Create listings now?`);
                    if (doListing) {
                        showStep(2, 2, 'Product Listing', 'running');
                        try {
                            const { runProductListing } = await import('./product-listing.js');
                            const result = await runProductListing(dryRun);
                            state.listing.ran = true;
                            state.listing.created = result.success;
                            state.listing.failed = result.failed;
                            state.listing.skipped = result.skipped;
                            markStepComplete(state, 'listing');
                            showStep(2, 2, 'Product Listing', 'done');
                        } catch (err) {
                            addError(state, 'listing', (err as Error).message);
                            showStep(2, 2, 'Product Listing', 'error');
                        }
                    }
                }
                break;
            }

            case 2: // Marketing only
            {
                const filter = await askChoice('Which products to create content for?', [
                    'New Arrivals',
                    'Featured Products',
                    'Deal of the Day',
                    'All Products',
                ]);
                const filters: ('new-arrivals' | 'featured' | 'deal-of-day' | 'all')[] = ['new-arrivals', 'featured', 'deal-of-day', 'all'];
                const maxMktg = parseInt(await ask('Max products [5]: ') || '5');

                showStep(1, 1, 'Social Media Marketing', 'running');
                await runMarketingStep(state, maxMktg, dryRun);
                showStep(1, 1, 'Social Media Marketing', state.marketing.ran ? 'done' : 'error');
                break;
            }

            case 3: // Inventory only
                showStep(1, 1, 'Inventory & Pricing', 'running');
                await runInventoryStep(state, dryRun);
                showStep(1, 1, 'Inventory & Pricing', state.inventory.ran ? 'done' : 'error');
                break;

            case 4: // Orders only
                showStep(1, 1, 'Order Management', 'running');
                await runOrdersStep(state, dryRun);
                showStep(1, 1, 'Order Management', state.orders.ran ? 'done' : 'error');
                break;

            case 5: // Analytics only
            {
                const days = parseInt(await ask('Report period in days [30]: ') || '30');
                showStep(1, 1, 'Analytics & Reporting', 'running');
                await runAnalyticsStep(state, days, dryRun);
                showStep(1, 1, 'Analytics & Reporting', state.analytics.ran ? 'done' : 'error');
                break;
            }

            case 6: // Website only
            {
                state.allProducts = await loadAllProducts();
                showStep(1, 1, 'Website Manager', 'running');
                await runWebsiteStep(state, dryRun);
                showStep(1, 1, 'Website Manager', state.website.ran ? 'done' : 'error');
                break;
            }
        }
    } catch (error) {
        log(AGENT, 'ERROR', `Fatal: ${(error as Error).message}`);
        addError(state, 'runner', (error as Error).message);
    }

    // Save pipeline state
    const statePath = path.join(OUTPUT_DIR, 'reports', `pipeline-state-${todayStr()}.json`);
    await writeJson(statePath, state);

    // Show summary
    showSummary(state);

    rl.close();
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error:', err.message);
    rl.close();
    process.exit(1);
});
