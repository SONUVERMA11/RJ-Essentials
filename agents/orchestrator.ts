/**
 * Agent Orchestrator
 * ─────────────────
 * Run individual agents or full workflows via CLI.
 *
 *   npx tsx agents/orchestrator.ts --agent=research --url=<meesho_url>
 *   npx tsx agents/orchestrator.ts --agent=listing [--dry-run]
 *   npx tsx agents/orchestrator.ts --agent=marketing [--filter=featured]
 *   npx tsx agents/orchestrator.ts --agent=inventory [--no-prices]
 *   npx tsx agents/orchestrator.ts --agent=orders
 *   npx tsx agents/orchestrator.ts --agent=analytics [--days=30]
 *   npx tsx agents/orchestrator.ts --all
 */

import { validateConfig } from './config.js';
import { log, logToFile, ensureOutputDirs, todayStr } from './utils.js';
import { testConnection } from './api-client.js';
import { runProductResearch } from './product-research.js';
import { runProductListing } from './product-listing.js';
import { runSocialMediaMarketing } from './social-media-marketing.js';
import { runInventoryPricing } from './inventory-pricing.js';
import { runOrderManagement } from './order-management.js';
import { runAnalytics } from './analytics-reporting.js';

const AGENT = 'orchestrator';

// ─── Parse CLI Arguments ─────────────────────────────────────────────
function getArg(name: string): string | undefined {
    const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : undefined;
}
function hasFlag(name: string): boolean {
    return process.argv.includes(`--${name}`);
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
    console.log(`
╔══════════════════════════════════════════════════╗
║       🤖  RJ ESSENTIALS AGENT ORCHESTRATOR      ║
║           Automation for your store              ║
╚══════════════════════════════════════════════════╝
    `);

    // Validate config
    const config = validateConfig();
    if (!config.valid) {
        log(AGENT, 'ERROR', 'Configuration errors:');
        for (const error of config.errors) {
            log(AGENT, 'ERROR', `  → ${error}`);
        }
        process.exit(1);
    }

    await ensureOutputDirs();

    // Test API connection
    log(AGENT, 'INFO', 'Testing API connection...');
    const connected = await testConnection();
    if (!connected) {
        log(AGENT, 'ERROR', 'Cannot connect to RJ Essentials API. Check your config.');
        process.exit(1);
    }

    const agentName = getArg('agent');
    const dryRun = hasFlag('dry-run');
    const runAll = hasFlag('all');

    if (dryRun) log(AGENT, 'WARN', '🔸 DRY RUN MODE — no changes will be made');

    const startTime = Date.now();

    try {
        if (runAll) {
            log(AGENT, 'INFO', '🚀 Running ALL agents in sequence...\n');

            log(AGENT, 'INFO', '━━━ 1/6: Inventory & Pricing ━━━');
            await runInventoryPricing(true, dryRun);

            log(AGENT, 'INFO', '━━━ 2/6: Order Management ━━━');
            await runOrderManagement(dryRun);

            log(AGENT, 'INFO', '━━━ 3/6: Analytics ━━━');
            await runAnalytics(30, dryRun);

            log(AGENT, 'INFO', '━━━ 4/6: Social Media Marketing ━━━');
            await runSocialMediaMarketing('new-arrivals', 5, dryRun);

            log(AGENT, 'INFO', '━━━ 5/6: Product Research (skipped — needs URL) ━━━');
            log(AGENT, 'INFO', '━━━ 6/6: Product Listing (skipped — needs queue) ━━━');

            log(AGENT, 'SUCCESS', '✅ All agents completed successfully!');
        } else if (agentName) {
            switch (agentName) {
                case 'research': {
                    const url = getArg('url') || 'https://www.meesho.com/mobile-accessories/pl/7bj';
                    const max = parseInt(getArg('max') || '10');
                    await runProductResearch(url, max, dryRun);
                    break;
                }
                case 'listing':
                    await runProductListing(dryRun);
                    break;
                case 'marketing': {
                    const filter = (getArg('filter') || 'new-arrivals') as 'featured' | 'new-arrivals' | 'deal-of-day' | 'all';
                    const maxProd = parseInt(getArg('max') || '5');
                    await runSocialMediaMarketing(filter, maxProd, dryRun);
                    break;
                }
                case 'inventory':
                    await runInventoryPricing(!hasFlag('no-prices'), dryRun);
                    break;
                case 'orders':
                    await runOrderManagement(dryRun);
                    break;
                case 'analytics': {
                    const days = parseInt(getArg('days') || '30');
                    await runAnalytics(days, dryRun);
                    break;
                }
                default:
                    log(AGENT, 'ERROR', `Unknown agent: ${agentName}`);
                    printUsage();
                    process.exit(1);
            }
        } else {
            printUsage();
            process.exit(0);
        }
    } catch (error) {
        log(AGENT, 'ERROR', `Fatal error: ${(error as Error).message}`);
        await logToFile(AGENT, 'ERROR', (error as Error).message);
        process.exit(1);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(AGENT, 'SUCCESS', `\n⏱️ Total execution time: ${elapsed}s`);
    await logToFile(AGENT, 'SUCCESS', `Run completed in ${elapsed}s`);
    process.exit(0);
}

function printUsage() {
    console.log(`
Usage:
  npx tsx agents/orchestrator.ts --agent=<name> [options]
  npx tsx agents/orchestrator.ts --all [--dry-run]

Agents:
  research   — Discover products from Meesho + cross-platform comparison
               Options: --url=<meesho_url> --max=<count>

  listing    — Create product listings from research queue
               Options: --dry-run

  marketing  — Generate social media content packages
               Options: --filter=<featured|new-arrivals|deal-of-day|all> --max=<count>

  inventory  — Check stock levels + competitor prices
               Options: --no-prices --dry-run

  orders     — Order processing summary + Meesho bulk list
               Options: --dry-run

  analytics  — Business intelligence reports
               Options: --days=<period> --dry-run

Flags:
  --dry-run  — Preview actions without making changes
  --all      — Run all maintenance agents in sequence
`);
}

main();
