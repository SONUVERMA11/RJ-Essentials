/**
 * Order Management Agent
 * ──────────────────────
 * Assists with order processing, generates Meesho order lists,
 * WhatsApp messages, and daily order summaries.
 */

import path from 'path';
import { OUTPUT_DIR, BRAND } from './config.js';
import { log, logToFile, writeJson, todayStr, ensureOutputDirs, formatPrice } from './utils.js';
import { getOrders, type Order } from './api-client.js';

const AGENT = 'order-management';

// ─── Types ───────────────────────────────────────────────────────────
interface OrderSummary {
    date: string;
    totalOrders: number;
    pendingOrders: Order[];
    staleOrders: Order[];
    meeshoOrderList: { orderId: string; productName: string; quantity: number; meeshoLink: string }[];
    whatsappMessages: { orderId: string; customerPhone: string; message: string }[];
    statusBreakdown: Record<string, number>;
    revenue: { today: number; pending: number };
}

// ─── WhatsApp Message Templates ──────────────────────────────────────

function generateOrderConfirmationWhatsApp(order: Order): string {
    const items = order.items.map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price)}`).join('\n');

    return `🎉 *Order Confirmed!*

Hi ${order.customer.name},

Your order *${order.orderId}* has been received! Here's your summary:

${items}

💰 *Total: ${formatPrice(order.total)}* (Cash on Delivery)
🚚 Delivery to: ${order.customer.address.city}, ${order.customer.address.state}

Estimated delivery: 5-7 business days

Track your order: ${BRAND.websiteUrl}/track-order

Thank you for shopping with *${BRAND.name}*! 🛍️`;
}

function generateShippingUpdateWhatsApp(order: Order): string {
    return `📦 *Shipping Update*

Hi ${order.customer.name},

Your order *${order.orderId}* has been shipped! 🚚
${order.trackingNumber ? `\nTracking Number: *${order.trackingNumber}*` : ''}

Track here: ${BRAND.websiteUrl}/track-order

- Team *${BRAND.name}*`;
}

function generateStalOrderReminder(order: Order, hoursSinceUpdate: number): string {
    return `⚠️ *Order Needs Attention*

Order: ${order.orderId}
Customer: ${order.customer.name} (${order.customer.phone})
Status: ${order.status}
Last Updated: ${Math.round(hoursSinceUpdate)} hours ago
Total: ${formatPrice(order.total)}

Items: ${order.items.map((i) => i.name).join(', ')}`;
}

// ─── Main Agent Workflow ─────────────────────────────────────────────

export async function runOrderManagement(dryRun: boolean = false): Promise<OrderSummary> {
    await ensureOutputDirs();
    await logToFile(AGENT, 'INFO', 'Starting order management agent');

    // Fetch all recent orders
    const { orders: allOrders } = await getOrders({ limit: '200' });
    log(AGENT, 'INFO', `Fetched ${allOrders.length} orders`);

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const order of allOrders) {
        statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    // Step 1: Find pending orders
    const pendingOrders = allOrders.filter((o) => o.status === 'pending');
    log(AGENT, 'INFO', `${pendingOrders.length} pending orders`);

    // Step 2: Generate Meesho order list for bulk ordering
    const meeshoOrderList: { orderId: string; productName: string; quantity: number; meeshoLink: string }[] = [];
    for (const order of pendingOrders) {
        for (const item of order.items) {
            if (item.meeshoLink) {
                meeshoOrderList.push({
                    orderId: order.orderId,
                    productName: item.name,
                    quantity: item.quantity,
                    meeshoLink: item.meeshoLink,
                });
            }
        }
    }
    log(AGENT, 'INFO', `${meeshoOrderList.length} items to order from Meesho`);

    // Step 3: Generate WhatsApp messages for pending orders
    const whatsappMessages: { orderId: string; customerPhone: string; message: string }[] = [];
    for (const order of pendingOrders) {
        whatsappMessages.push({
            orderId: order.orderId,
            customerPhone: order.customer.phone,
            message: generateOrderConfirmationWhatsApp(order),
        });
    }

    // Step 4: Find stale orders (not updated in 48+ hours)
    const now = Date.now();
    const staleOrders: Order[] = [];
    for (const order of allOrders) {
        if (['delivered', 'cancelled'].includes(order.status)) continue;

        const lastUpdate = order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt!).getTime();
        const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);

        if (hoursSince > 48) {
            staleOrders.push(order);
        }
    }
    log(AGENT, 'WARN', `${staleOrders.length} orders not updated in 48+ hours`);

    // Step 5: Revenue calculations
    const todayDate = todayStr();
    const todayOrders = allOrders.filter((o) => o.createdAt?.startsWith(todayDate));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + o.total, 0);

    const summary: OrderSummary = {
        date: todayStr(),
        totalOrders: allOrders.length,
        pendingOrders,
        staleOrders,
        meeshoOrderList,
        whatsappMessages,
        statusBreakdown,
        revenue: { today: todayRevenue, pending: pendingRevenue },
    };

    if (!dryRun) {
        const reportPath = path.join(OUTPUT_DIR, 'reports', `order-summary-${todayStr()}.json`);
        await writeJson(reportPath, summary);
        log(AGENT, 'SUCCESS', `Report saved: ${reportPath}`);
    }

    // Console summary
    log(AGENT, 'SUCCESS', `\n── Order Summary ──\n  📋 Total Orders: ${allOrders.length}\n  ⏳ Pending: ${pendingOrders.length}\n  ⚠️ Stale (48h+): ${staleOrders.length}\n  🛒 Meesho Items: ${meeshoOrderList.length}\n  💰 Today's Revenue: ${formatPrice(todayRevenue)}\n  💰 Pending Revenue: ${formatPrice(pendingRevenue)}\n  📊 Status: ${Object.entries(statusBreakdown).map(([k, v]) => `${k}=${v}`).join(', ')}`);

    await logToFile(AGENT, 'SUCCESS', 'Order management complete');
    return summary;
}

// ─── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1]?.includes('order-management')) {
    const dryRun = process.argv.includes('--dry-run');
    runOrderManagement(dryRun)
        .then(() => process.exit(0))
        .catch((err) => {
            log(AGENT, 'ERROR', `Fatal: ${err.message}`);
            process.exit(1);
        });
}
