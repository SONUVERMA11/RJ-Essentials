/**
 * Analytics & Reporting Agent
 * ──────────────────────────
 * Generates business intelligence reports:
 * sales analytics, category performance, product insights, and recommendations.
 */

import path from 'path';
import fs from 'fs/promises';
import { OUTPUT_DIR, BRAND } from './config.js';
import { log, logToFile, writeJson, todayStr, ensureOutputDirs, formatPrice } from './utils.js';
import { getProducts, getOrders, getCategories, type Product, type Order, type Category } from './api-client.js';

const AGENT = 'analytics';

// ─── Types ───────────────────────────────────────────────────────────
interface AnalyticsReport {
    date: string;
    period: string;
    sales: {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        totalItemsSold: number;
    };
    topProducts: { name: string; slug: string; soldCount: number; revenue: number }[];
    worstProducts: { name: string; slug: string; soldCount: number; daysListed: number }[];
    categoryPerformance: { category: string; products: number; totalSold: number; revenue: number }[];
    customerInsights: {
        totalCustomers: number;
        topCities: { city: string; orders: number }[];
        topStates: { state: string; orders: number }[];
    };
    recommendations: string[];
}

// ─── Main Agent Workflow ─────────────────────────────────────────────

export async function runAnalytics(
    periodDays: number = 30,
    dryRun: boolean = false
): Promise<AnalyticsReport> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', `Starting analytics for last ${periodDays} days`);

    // Fetch data
    const allProducts: Product[] = [];
    let page = 1;
    while (true) {
        const res = await getProducts({ page: page.toString(), limit: '100', status: 'all' });
        if (res.products) allProducts.push(...res.products);
        if (!res.pagination || page >= res.pagination.pages) break;
        page++;
    }

    const { orders: allOrders } = await getOrders({ limit: '500' });
    const categories = await getCategories();

    log(AGENT, 'INFO', `Data loaded: ${allProducts.length} products, ${allOrders.length} orders, ${categories.length} categories`);

    // Filter orders within period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    const periodOrders = allOrders.filter((o) => o.createdAt && new Date(o.createdAt) >= cutoffDate);

    // ─── Sales Analytics ─────────────────────────────────────────
    const completedOrders = periodOrders.filter((o) => !['cancelled'].includes(o.status));
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    // ─── Top Products ────────────────────────────────────────────
    const productSales: Record<string, { name: string; slug: string; sold: number; revenue: number }> = {};
    for (const order of completedOrders) {
        for (const item of order.items) {
            const key = item.productId || item.slug;
            if (!productSales[key]) {
                productSales[key] = { name: item.name, slug: item.slug, sold: 0, revenue: 0 };
            }
            productSales[key].sold += item.quantity;
            productSales[key].revenue += item.price * item.quantity;
        }
    }

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((p) => ({ name: p.name, slug: p.slug, soldCount: p.sold, revenue: p.revenue }));

    // ─── Worst Products (listed long, sold least) ────────────────
    const worstProducts = allProducts
        .filter((p) => p.status === 'active')
        .map((p) => {
            const daysListed = p.createdAt ? Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
            return { name: p.name, slug: p.slug, soldCount: p.soldCount || 0, daysListed };
        })
        .filter((p) => p.daysListed > 14)
        .sort((a, b) => a.soldCount - b.soldCount)
        .slice(0, 10);

    // ─── Category Performance ────────────────────────────────────
    const catPerf: Record<string, { products: number; totalSold: number; revenue: number }> = {};
    for (const product of allProducts) {
        const cat = product.category || 'Uncategorized';
        if (!catPerf[cat]) catPerf[cat] = { products: 0, totalSold: 0, revenue: 0 };
        catPerf[cat].products++;
        catPerf[cat].totalSold += product.soldCount || 0;
    }
    for (const ps of Object.values(productSales)) {
        const product = allProducts.find((p) => p.slug === ps.slug);
        if (product) {
            const cat = product.category || 'Uncategorized';
            if (catPerf[cat]) catPerf[cat].revenue += ps.revenue;
        }
    }
    const categoryPerformance = Object.entries(catPerf)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

    // ─── Customer Insights ───────────────────────────────────────
    const cityCount: Record<string, number> = {};
    const stateCount: Record<string, number> = {};
    const uniquePhones = new Set<string>();

    for (const order of periodOrders) {
        uniquePhones.add(order.customer.phone);
        const city = order.customer.address.city;
        const state = order.customer.address.state;
        cityCount[city] = (cityCount[city] || 0) + 1;
        stateCount[state] = (stateCount[state] || 0) + 1;
    }

    const topCities = Object.entries(cityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([city, orders]) => ({ city, orders }));

    const topStates = Object.entries(stateCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([state, orders]) => ({ state, orders }));

    // ─── Recommendations ─────────────────────────────────────────
    const recommendations: string[] = [];

    if (worstProducts.length > 0) {
        recommendations.push(`📦 Consider removing or repricing ${worstProducts.length} slow-moving products (listed 14+ days, few sales)`);
    }
    if (topProducts.length > 0) {
        recommendations.push(`🔥 Promote top seller "${topProducts[0].name}" — ${topProducts[0].soldCount} sold, ${formatPrice(topProducts[0].revenue)} revenue`);
    }
    const zeroStockActive = allProducts.filter((p) => p.status === 'active' && p.stock === 0).length;
    if (zeroStockActive > 0) {
        recommendations.push(`⚠️ ${zeroStockActive} active products are out of stock — restock or mark as hidden`);
    }
    if (categoryPerformance.length > 0) {
        const topCat = categoryPerformance[0];
        recommendations.push(`📈 Best category: "${topCat.category}" with ${topCat.products} products and ${formatPrice(topCat.revenue)} revenue — add more products here`);
    }
    if (topCities.length > 0) {
        recommendations.push(`🌏 Top city: ${topCities[0].city} (${topCities[0].orders} orders) — consider targeted marketing`);
    }

    // ─── Build Report ────────────────────────────────────────────
    const report: AnalyticsReport = {
        date: todayStr(),
        period: `Last ${periodDays} days`,
        sales: {
            totalRevenue,
            totalOrders: completedOrders.length,
            averageOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0,
            totalItemsSold,
        },
        topProducts,
        worstProducts,
        categoryPerformance,
        customerInsights: {
            totalCustomers: uniquePhones.size,
            topCities,
            topStates,
        },
        recommendations,
    };

    if (!dryRun) {
        // Save JSON
        const jsonPath = path.join(OUTPUT_DIR, 'reports', `analytics-report-${todayStr()}.json`);
        await writeJson(jsonPath, report);

        // Save readable markdown
        const mdPath = path.join(OUTPUT_DIR, 'reports', `analytics-report-${todayStr()}.md`);
        const markdown = generateMarkdownReport(report);
        await fs.writeFile(mdPath, markdown, 'utf-8');

        log(AGENT, 'SUCCESS', `Reports saved: ${jsonPath}`);
    }

    // Console summary
    log(AGENT, 'SUCCESS', `\n── Analytics (${periodDays} days) ──\n  💰 Revenue: ${formatPrice(totalRevenue)}\n  📦 Orders: ${completedOrders.length}\n  🛒 Avg Order: ${formatPrice(report.sales.averageOrderValue)}\n  👥 Customers: ${uniquePhones.size}\n  🏆 Top Product: ${topProducts[0]?.name || 'N/A'}`);

    await logToFile(AGENT, 'SUCCESS', 'Analytics complete');
    return report;
}

// ─── Markdown Report Generator ───────────────────────────────────────

function generateMarkdownReport(report: AnalyticsReport): string {
    return `# ${BRAND.name} — Analytics Report
*${report.period} (Generated: ${report.date})*

## Sales Overview
| Metric | Value |
|---|---|
| Total Revenue | ${formatPrice(report.sales.totalRevenue)} |
| Total Orders | ${report.sales.totalOrders} |
| Avg Order Value | ${formatPrice(report.sales.averageOrderValue)} |
| Items Sold | ${report.sales.totalItemsSold} |

## Top 10 Products
| # | Product | Sold | Revenue |
|---|---|---|---|
${report.topProducts.map((p, i) => `| ${i + 1} | ${p.name} | ${p.soldCount} | ${formatPrice(p.revenue)} |`).join('\n')}

## Category Performance
| Category | Products | Sold | Revenue |
|---|---|---|---|
${report.categoryPerformance.map((c) => `| ${c.category} | ${c.products} | ${c.totalSold} | ${formatPrice(c.revenue)} |`).join('\n')}

## Customer Insights
- **Total Customers**: ${report.customerInsights.totalCustomers}
- **Top Cities**: ${report.customerInsights.topCities.map((c) => `${c.city} (${c.orders})`).join(', ')}
- **Top States**: ${report.customerInsights.topStates.map((s) => `${s.state} (${s.orders})`).join(', ')}

## Recommendations
${report.recommendations.map((r) => `- ${r}`).join('\n')}

## Slow-Moving Products
${report.worstProducts.map((p) => `- **${p.name}** — ${p.soldCount} sold in ${p.daysListed} days`).join('\n')}
`;
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('analytics')) {
    const days = parseInt(process.argv[2] || '30');
    const dryRun = process.argv.includes('--dry-run');

    runAnalytics(days, dryRun)
        .then(() => process.exit(0))
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
