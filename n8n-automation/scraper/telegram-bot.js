#!/usr/bin/env node
/**
 * Telegram Bot for RJ Essentials Automation
 * 
 * Commands:
 *   /start     → Welcome message
 *   /scrape    → Run full scrape across all categories
 *   /status    → Check scraper/enricher status
 *   /stats     → Show product stats
 *   
 * Direct Messages:
 *   Send a Meesho product URL    → Scrape & enrich that product
 *   Send a Meesho category URL   → Scrape that category
 *   Send a product name          → Search & scrape similar products
 *   
 * Environment:
 *   TELEGRAM_BOT_TOKEN  → Bot token from @BotFather
 *   TELEGRAM_ADMIN_ID   → Your chat ID (for authorization)
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BASE_DIR = path.resolve(__dirname, '..');
const POLL_INTERVAL = 2000; // ms

let lastUpdateId = 0;
let isProcessing = false;
let currentJob = null;

function log(msg, lvl = 'INFO') {
  const icon = { INFO: '🤖', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[lvl] || '🤖';
  console.log(`${icon} [TgBot] ${msg}`);
}

// ─── Telegram API Helpers ────────────────────────────────────────

async function tgApi(method, body = {}) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId, text, parseMode = 'HTML') {
  return tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    disable_web_page_preview: true,
  });
}

async function sendTyping(chatId) {
  return tgApi('sendChatAction', { chat_id: chatId, action: 'typing' });
}

// ─── Authorization ────────────────────────────────────────────────

function isAuthorized(chatId) {
  if (!ADMIN_ID) return true; // No restriction if no admin ID set
  return String(chatId) === String(ADMIN_ID);
}

// ─── Command Handlers ─────────────────────────────────────────────

async function handleStart(chatId) {
  await sendMessage(chatId, `
🛍️ <b>RJ Essentials Automation Bot</b>

Welcome! I can help you scrape and enrich products.

<b>Commands:</b>
/scrape — Run full scrape (all categories)
/scrape_category — Scrape a specific category
/enrich — Enrich latest scraped products
/push — Push enriched products to store
/status — Current job status
/stats — Product statistics
/categories — List available categories

<b>Direct Messages:</b>
• Send a product URL to scrape it
• Send a category name to scrape that category
• Send "scrape sarees" to scrape sarees

🔐 Bot is restricted to authorized admins.
  `);
}

async function handleScrape(chatId, args = '') {
  if (isProcessing) {
    await sendMessage(chatId, '⏳ A job is already running. Use /status to check progress.');
    return;
  }

  isProcessing = true;
  currentJob = { type: 'scrape', startedAt: new Date(), status: 'running' };

  await sendMessage(chatId, '🕷️ Starting full scrape across all categories...\nThis may take 5-10 minutes.');
  await sendTyping(chatId);

  try {
    const scraperArgs = args ? ['--category', args] : [];
    const result = await runScript('scraper/meesho-scraper.js', scraperArgs);
    
    if (result.success) {
      // Count products from output
      try {
        const latest = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'output/latest.json'), 'utf-8'));
        await sendMessage(chatId, `
✅ <b>Scrape Complete!</b>

📊 Total products: <b>${latest.metadata.totalProducts}</b>
📁 Categories: <b>${latest.metadata.categoriesScraped}</b>
⏱️ Time: ${latest.metadata.scrapedAt}

Use /enrich to add AI descriptions and images.
Use /push to publish to store.
        `);
      } catch {
        await sendMessage(chatId, '✅ Scrape complete! Use /enrich to process products.');
      }
    } else {
      await sendMessage(chatId, `❌ Scrape failed:\n<code>${escapeHtml(result.error?.substring(0, 500) || 'Unknown error')}</code>`);
    }
  } catch (err) {
    await sendMessage(chatId, `❌ Scrape error: ${escapeHtml(err.message)}`);
  } finally {
    isProcessing = false;
    currentJob = null;
  }
}

async function handleEnrich(chatId, args = '') {
  if (isProcessing) {
    await sendMessage(chatId, '⏳ A job is already running. Use /status to check progress.');
    return;
  }

  isProcessing = true;
  currentJob = { type: 'enrich', startedAt: new Date(), status: 'running' };

  const enrichArgs = [];
  if (args.includes('skip-images')) enrichArgs.push('--skip-images');
  if (args.includes('skip-ai')) enrichArgs.push('--skip-ai');
  
  // Extract limit
  const limitMatch = args.match(/limit\s*(\d+)/i);
  if (limitMatch) enrichArgs.push('--limit', limitMatch[1]);

  await sendMessage(chatId, `🔧 Starting product enrichment...\nOptions: ${enrichArgs.join(' ') || 'full enrichment'}\n\nThis may take a while for AI descriptions and image sourcing.`);
  await sendTyping(chatId);

  try {
    const result = await runScript('scraper/product-enricher.js', enrichArgs);
    
    if (result.success) {
      try {
        const enriched = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'output/enriched-latest.json'), 'utf-8'));
        await sendMessage(chatId, `
✅ <b>Enrichment Complete!</b>

📊 Products enriched: <b>${enriched.metadata.totalProducts}</b>
❌ Failed: <b>${enriched.metadata.totalFailed}</b>
📁 Categories: <b>${enriched.metadata.categoriesProcessed}</b>

Use /push to publish to store.
        `);
      } catch {
        await sendMessage(chatId, '✅ Enrichment complete! Use /push to publish.');
      }
    } else {
      await sendMessage(chatId, `❌ Enrichment failed:\n<code>${escapeHtml(result.error?.substring(0, 500) || 'Unknown error')}</code>`);
    }
  } catch (err) {
    await sendMessage(chatId, `❌ Enrichment error: ${escapeHtml(err.message)}`);
  } finally {
    isProcessing = false;
    currentJob = null;
  }
}

async function handlePush(chatId, useEnriched = true) {
  if (isProcessing) {
    await sendMessage(chatId, '⏳ A job is already running.');
    return;
  }

  isProcessing = true;
  currentJob = { type: 'push', startedAt: new Date(), status: 'running' };

  const inputFile = useEnriched 
    ? path.join(BASE_DIR, 'output/enriched-latest.json')
    : path.join(BASE_DIR, 'output/latest.json');

  if (!fs.existsSync(inputFile)) {
    await sendMessage(chatId, '❌ No data file found. Run /scrape and /enrich first.');
    isProcessing = false;
    currentJob = null;
    return;
  }

  await sendMessage(chatId, '🚀 Pushing products to RJ Essentials store...');
  await sendTyping(chatId);

  try {
    const result = await runScript('scraper/push-to-rj.js', [inputFile]);
    
    if (result.success) {
      await sendMessage(chatId, `✅ <b>Push Complete!</b>\n\n${escapeHtml(result.output?.substring(result.output.lastIndexOf('📊'), result.output.length) || 'Products pushed successfully.')}`);
    } else {
      await sendMessage(chatId, `❌ Push failed:\n<code>${escapeHtml(result.error?.substring(0, 500) || 'Unknown error')}</code>`);
    }
  } catch (err) {
    await sendMessage(chatId, `❌ Push error: ${escapeHtml(err.message)}`);
  } finally {
    isProcessing = false;
    currentJob = null;
  }
}

async function handleStatus(chatId) {
  if (!currentJob) {
    await sendMessage(chatId, '💤 No active jobs. Send /scrape to start.');
    return;
  }

  const elapsed = Math.round((Date.now() - currentJob.startedAt) / 1000);
  await sendMessage(chatId, `
⏳ <b>Current Job</b>
Type: ${currentJob.type}
Status: ${currentJob.status}
Running for: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s
  `);
}

async function handleStats(chatId) {
  try {
    const RJ_API = process.env.RJ_API_BASE_URL || 'http://localhost:3000/api';
    const res = await fetch(`${RJ_API}/products?limit=1&status=all`);
    const data = await res.json();
    
    let scraped = 0, enriched = 0;
    try {
      const latest = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'output/latest.json'), 'utf-8'));
      scraped = latest.metadata.totalProducts;
    } catch {}
    try {
      const enrichedData = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'output/enriched-latest.json'), 'utf-8'));
      enriched = enrichedData.metadata.totalProducts;
    } catch {}

    await sendMessage(chatId, `
📊 <b>RJ Essentials Stats</b>

🏪 Products in store: <b>${data.pagination?.total || 0}</b>
📥 Last scraped: <b>${scraped}</b>
✨ Last enriched: <b>${enriched}</b>

Pipeline: Scrape → Enrich → Push
    `);
  } catch (err) {
    await sendMessage(chatId, `❌ Could not fetch stats: ${err.message}`);
  }
}

async function handleCategories(chatId) {
  const { MEESHO_CATEGORIES } = require('./meesho-categories');
  const list = MEESHO_CATEGORIES.map(c => `• <b>${c.name}</b> (${c.slug})`).join('\n');
  await sendMessage(chatId, `📦 <b>Available Categories:</b>\n\n${list}\n\nUse: /scrape_category sarees`);
}

async function handleUrl(chatId, url) {
  // Detect if it's a Meesho product URL
  if (url.includes('meesho.com')) {
    if (url.includes('/p/') || url.includes('/product/')) {
      await sendMessage(chatId, '🔗 Detected product URL. Scraping product details...');
      // For now, inform user — full single-product scraping needs the detail page scraper
      await sendMessage(chatId, '⚠️ Single product URL scraping is coming soon. For now, use /scrape to scrape all categories or /scrape_category <name> for a specific category.');
    } else if (url.includes('/pl/') || url.includes('/search')) {
      await sendMessage(chatId, '📂 Detected category/search URL. Starting category scrape...');
      await handleScrape(chatId);
    }
  } else {
    await sendMessage(chatId, '🔍 URL detected but not recognized. Send a product category name instead, or use /scrape.');
  }
}

// ─── Pipeline Command: Full Auto ─────────────────────────────────

async function handleFullPipeline(chatId, args = '') {
  if (isProcessing) {
    await sendMessage(chatId, '⏳ A job is already running.');
    return;
  }

  await sendMessage(chatId, `
🔄 <b>Starting Full Pipeline</b>
Step 1: Scrape products
Step 2: Enrich with AI & images
Step 3: Push to store

This will take 15-30 minutes. Sit tight!
  `);

  // Step 1: Scrape
  await handleScrape(chatId, args);
  await sleep(2000);

  // Step 2: Enrich
  await handleEnrich(chatId, '');
  await sleep(2000);

  // Step 3: Push
  await handlePush(chatId, true);

  await sendMessage(chatId, '🎉 <b>Full pipeline complete!</b> Check your admin panel for new products.');
}

// ─── Utility Functions ────────────────────────────────────────────

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(BASE_DIR, scriptPath);
    log(`Running: node ${fullPath} ${args.join(' ')}`);
    
    const proc = spawn('node', [fullPath, ...args], {
      cwd: BASE_DIR,
      env: { ...process.env, PATH: process.env.PATH },
      timeout: 600000, // 10 min timeout
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
      // Log last line for progress
      const lines = chunk.toString().trim().split('\n');
      if (lines.length > 0) log(`  ${lines[lines.length - 1].substring(0, 100)}`);
    });
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });

    proc.on('close', code => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || (code !== 0 ? `Exit code: ${code}` : ''),
        exitCode: code,
      });
    });

    proc.on('error', err => {
      reject(err);
    });
  });
}

// ─── Message Router ───────────────────────────────────────────────

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (!isAuthorized(chatId)) {
    await sendMessage(chatId, '🔒 Unauthorized. Contact the admin.');
    log(`Unauthorized access attempt from ${chatId}`, 'WARN');
    return;
  }

  log(`Message from ${chatId}: ${text.substring(0, 60)}`);

  // Route commands
  if (text === '/start' || text === '/help') {
    return handleStart(chatId);
  }
  if (text === '/scrape' || text.startsWith('/scrape ')) {
    const args = text.replace(/^\/scrape\s*/, '').trim();
    return handleScrape(chatId, args);
  }
  if (text.startsWith('/scrape_category')) {
    const cat = text.replace(/^\/scrape_category\s*/, '').trim();
    if (!cat) {
      await handleCategories(chatId);
      return;
    }
    return handleScrape(chatId, cat);
  }
  if (text === '/enrich' || text.startsWith('/enrich ')) {
    const args = text.replace(/^\/enrich\s*/, '').trim();
    return handleEnrich(chatId, args);
  }
  if (text === '/push') return handlePush(chatId, true);
  if (text === '/push_raw') return handlePush(chatId, false);
  if (text === '/status') return handleStatus(chatId);
  if (text === '/stats') return handleStats(chatId);
  if (text === '/categories') return handleCategories(chatId);
  if (text === '/full' || text === '/auto') {
    const args = text.replace(/^\/(full|auto)\s*/, '').trim();
    return handleFullPipeline(chatId, args);
  }

  // Handle URLs
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return handleUrl(chatId, text);
  }

  // Handle natural language
  const lower = text.toLowerCase();
  if (lower.startsWith('scrape ') || lower.startsWith('scan ')) {
    const query = text.replace(/^(scrape|scan)\s+/i, '').trim();
    return handleScrape(chatId, query);
  }

  // Default: search/help
  await sendMessage(chatId, `🤔 Not sure what to do with: "${escapeHtml(text.substring(0, 50))}"\n\nTry /help to see available commands.`);
}

// ─── Polling Loop ─────────────────────────────────────────────────

async function pollUpdates() {
  try {
    const res = await tgApi('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30,
      allowed_updates: ['message'],
    });

    if (res.ok && res.result.length > 0) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        try {
          await handleUpdate(update);
        } catch (err) {
          log(`Error handling update: ${err.message}`, 'ERROR');
        }
      }
    }
  } catch (err) {
    log(`Poll error: ${err.message}`, 'ERROR');
    await sleep(5000); // Wait longer on errors
  }
}

// ─── Webhook Mode (for cloud deployment) ──────────────────────────

function startWebhookServer(port = 3457) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === `/webhook/${BOT_TOKEN}`) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const update = JSON.parse(body);
          await handleUpdate(update);
        } catch (err) {
          log(`Webhook error: ${err.message}`, 'ERROR');
        }
        res.writeHead(200);
        res.end('ok');
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', bot: 'running' }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    log(`Webhook server running on port ${port}`);
  });

  return server;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  if (!BOT_TOKEN) {
    log('TELEGRAM_BOT_TOKEN not set in .env — Bot cannot start.', 'ERROR');
    log('Get a bot token from @BotFather on Telegram and add to .env:', 'INFO');
    log('  TELEGRAM_BOT_TOKEN=your_token_here', 'INFO');
    log('  TELEGRAM_ADMIN_ID=your_chat_id', 'INFO');
    process.exit(1);
  }

  // Test bot connection
  const me = await tgApi('getMe');
  if (!me.ok) {
    log(`Invalid bot token: ${JSON.stringify(me)}`, 'ERROR');
    process.exit(1);
  }

  log(`🤖 Bot started: @${me.result.username} (${me.result.first_name})`);

  const useWebhook = process.argv.includes('--webhook');
  
  if (useWebhook) {
    const port = parseInt(process.env.TELEGRAM_WEBHOOK_PORT || '3457');
    startWebhookServer(port);
  } else {
    // Long polling mode
    log('Using long-polling mode');
    while (true) {
      await pollUpdates();
      await sleep(POLL_INTERVAL);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    log(`Fatal: ${err.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { startWebhookServer, handleUpdate };
