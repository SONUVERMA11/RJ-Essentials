#!/usr/bin/env node
/**
 * Scraper API Server v2
 * Wraps the full pipeline as a local HTTP API for n8n and Telegram.
 * 
 * Endpoints:
 *   GET  /health              → Health check
 *   POST /scrape              → Run full scraper (all categories)
 *   POST /scrape/:category    → Run scraper for one category
 *   POST /enrich              → Enrich latest scraped data
 *   POST /enrich/single       → Enrich a single product (body = product data)
 *   POST /push                → Push enriched products to store
 *   POST /pipeline            → Full pipeline: scrape → enrich → push
 *   GET  /products            → Latest scraped products
 *   GET  /products/enriched   → Latest enriched products
 *   GET  /products/flat       → Flat product array
 *   GET  /status              → Current job status
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.SCRAPER_API_PORT || 3456;
const BASE_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(BASE_DIR, 'output');

let currentJob = null;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function runScript(scriptPath, args = [], timeoutMs = 600000) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(BASE_DIR, scriptPath);
    log(`Running: node ${fullPath} ${args.join(' ')}`);
    
    const proc = spawn('node', [fullPath, ...args], {
      cwd: BASE_DIR,
      env: { ...process.env, PATH: process.env.PATH },
      timeout: timeoutMs,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr,
        exitCode: code,
      });
    });

    proc.on('error', (err) => {
      reject({ success: false, error: err.message });
    });
  });
}

function getLatestData(filename = 'latest.json') {
  const filePath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getFlatProducts(filename = 'latest.json') {
  const data = getLatestData(filename);
  if (!data) return null;
  const flat = [];
  for (const [, catData] of Object.entries(data.categories || {})) {
    if (catData.products) {
      flat.push(...catData.products);
    }
  }
  return flat;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  log(`${method} ${url.pathname}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // ─── Health ─────────────────────────────────────────────
    if (url.pathname === '/health') {
      return sendJSON(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        currentJob: currentJob ? { type: currentJob.type, startedAt: currentJob.startedAt } : null,
      });
    }

    // ─── Status ─────────────────────────────────────────────
    if (url.pathname === '/status') {
      return sendJSON(res, 200, {
        busy: !!currentJob,
        currentJob,
        files: {
          latestScrape: fs.existsSync(path.join(OUTPUT_DIR, 'latest.json')),
          latestEnriched: fs.existsSync(path.join(OUTPUT_DIR, 'enriched-latest.json')),
        },
      });
    }

    // ─── Scrape All ─────────────────────────────────────────
    if (url.pathname === '/scrape' && method === 'POST') {
      if (currentJob) return sendJSON(res, 409, { error: 'A job is already running', job: currentJob });
      
      currentJob = { type: 'scrape', startedAt: new Date().toISOString() };
      try {
        const result = await runScript('scraper/meesho-scraper.js', []);
        if (result.success) {
          const products = getLatestData();
          return sendJSON(res, 200, {
            success: true,
            scraperOutput: result.output.substring(0, 3000),
            data: products,
          });
        } else {
          return sendJSON(res, 500, {
            success: false,
            error: result.error || 'Scraper failed',
            output: result.output.substring(0, 2000),
          });
        }
      } finally {
        currentJob = null;
      }
    }

    // ─── Scrape Category ────────────────────────────────────
    if (url.pathname.startsWith('/scrape/') && method === 'POST') {
      if (currentJob) return sendJSON(res, 409, { error: 'A job is already running' });
      
      const category = url.pathname.split('/scrape/')[1];
      currentJob = { type: 'scrape-category', category, startedAt: new Date().toISOString() };
      try {
        const result = await runScript('scraper/meesho-scraper.js', ['--category', category]);
        if (result.success) {
          const products = getLatestData();
          return sendJSON(res, 200, { success: true, category, data: products });
        } else {
          return sendJSON(res, 500, { success: false, error: result.error || 'Scraper failed' });
        }
      } finally {
        currentJob = null;
      }
    }

    // ─── Enrich ─────────────────────────────────────────────
    if (url.pathname === '/enrich' && method === 'POST') {
      if (currentJob) return sendJSON(res, 409, { error: 'A job is already running' });
      
      const body = await parseBody(req);
      const args = [];
      if (body.skipImages) args.push('--skip-images');
      if (body.skipAI) args.push('--skip-ai');
      if (body.limit) args.push('--limit', String(body.limit));

      currentJob = { type: 'enrich', startedAt: new Date().toISOString(), options: body };
      try {
        const result = await runScript('scraper/product-enricher.js', args, 900000);
        if (result.success) {
          const enriched = getLatestData('enriched-latest.json');
          return sendJSON(res, 200, { success: true, data: enriched });
        } else {
          return sendJSON(res, 500, { success: false, error: result.error });
        }
      } finally {
        currentJob = null;
      }
    }

    // ─── Push ───────────────────────────────────────────────
    if (url.pathname === '/push' && method === 'POST') {
      if (currentJob) return sendJSON(res, 409, { error: 'A job is already running' });

      const body = await parseBody(req);
      const inputFile = body.useRaw 
        ? path.join(OUTPUT_DIR, 'latest.json')
        : path.join(OUTPUT_DIR, 'enriched-latest.json');

      if (!fs.existsSync(inputFile)) {
        // Fall back to latest.json
        const fallback = path.join(OUTPUT_DIR, 'latest.json');
        if (!fs.existsSync(fallback)) {
          return sendJSON(res, 404, { error: 'No data files found. Run /scrape first.' });
        }
      }

      currentJob = { type: 'push', startedAt: new Date().toISOString() };
      try {
        const result = await runScript('scraper/push-to-rj.js', [inputFile]);
        return sendJSON(res, result.success ? 200 : 500, {
          success: result.success,
          output: result.output.substring(0, 3000),
          error: result.error,
        });
      } finally {
        currentJob = null;
      }
    }

    // ─── Full Pipeline ──────────────────────────────────────
    if (url.pathname === '/pipeline' && method === 'POST') {
      if (currentJob) return sendJSON(res, 409, { error: 'A job is already running' });

      const body = await parseBody(req);
      const report = { scrape: null, enrich: null, push: null };

      // Step 1: Scrape
      currentJob = { type: 'pipeline-scrape', startedAt: new Date().toISOString() };
      const scrapeArgs = body.category ? ['--category', body.category] : [];
      report.scrape = await runScript('scraper/meesho-scraper.js', scrapeArgs);

      if (!report.scrape.success) {
        currentJob = null;
        return sendJSON(res, 500, { success: false, step: 'scrape', report });
      }

      // Step 2: Enrich
      currentJob = { type: 'pipeline-enrich', startedAt: new Date().toISOString() };
      const enrichArgs = [];
      if (body.skipImages) enrichArgs.push('--skip-images');
      if (body.skipAI) enrichArgs.push('--skip-ai');
      if (body.limit) enrichArgs.push('--limit', String(body.limit));
      report.enrich = await runScript('scraper/product-enricher.js', enrichArgs, 900000);

      if (!report.enrich.success) {
        currentJob = null;
        return sendJSON(res, 500, { success: false, step: 'enrich', report });
      }

      // Step 3: Push
      currentJob = { type: 'pipeline-push', startedAt: new Date().toISOString() };
      const pushInput = path.join(OUTPUT_DIR, 'enriched-latest.json');
      report.push = await runScript('scraper/push-to-rj.js', [pushInput]);

      currentJob = null;
      return sendJSON(res, report.push.success ? 200 : 500, {
        success: report.push.success,
        report: {
          scrape: report.scrape.success,
          enrich: report.enrich.success,
          push: report.push.success,
        },
      });
    }

    // ─── Get Products ───────────────────────────────────────
    if (url.pathname === '/products' && method === 'GET') {
      const products = getLatestData();
      if (!products) return sendJSON(res, 404, { error: 'No scraped data. Run /scrape first.' });
      return sendJSON(res, 200, products);
    }

    if (url.pathname === '/products/enriched' && method === 'GET') {
      const products = getLatestData('enriched-latest.json');
      if (!products) return sendJSON(res, 404, { error: 'No enriched data. Run /enrich first.' });
      return sendJSON(res, 200, products);
    }

    if (url.pathname === '/products/flat' && method === 'GET') {
      // Try enriched first
      let flat = getFlatProducts('enriched-latest.json');
      if (!flat) flat = getFlatProducts('latest.json');
      if (!flat) return sendJSON(res, 404, { error: 'No data yet.' });
      return sendJSON(res, 200, flat);
    }

    // 404
    sendJSON(res, 404, {
      error: 'Not found',
      endpoints: [
        'GET /health', 'GET /status',
        'POST /scrape', 'POST /scrape/:category',
        'POST /enrich', 'POST /push', 'POST /pipeline',
        'GET /products', 'GET /products/enriched', 'GET /products/flat',
      ],
    });
  } catch (err) {
    log(`Error: ${err.message}`);
    sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  log(`🚀 Scraper API v2 running on http://localhost:${PORT}`);
  log(`Endpoints:`);
  log(`  GET  /health          → Health check`);
  log(`  GET  /status          → Job status`);
  log(`  POST /scrape          → Run full scraper`);
  log(`  POST /scrape/:cat     → Scrape one category`);
  log(`  POST /enrich          → Enrich with AI + images`);
  log(`  POST /push            → Push to store`);
  log(`  POST /pipeline        → Full auto pipeline`);
  log(`  GET  /products        → Latest scraped data`);
  log(`  GET  /products/enriched → Enriched data`);
  log(`  GET  /products/flat   → Flat product array`);
});
