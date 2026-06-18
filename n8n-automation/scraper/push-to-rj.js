#!/usr/bin/env node
/**
 * Push Products to RJ Essentials API (v2)
 * 
 * Reads from enriched-latest.json (or latest.json as fallback)
 * and posts each product via the admin API.
 * 
 * Improvements:
 * - Reads enriched data format
 * - Strips ALL Meesho references before pushing
 * - Retry logic for failed pushes
 * - Progress tracking
 * - Batch mode with concurrency control
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = process.env.RJ_API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = process.env.RJ_AGENT_API_KEY;
const MAX_RETRIES = 3;
const CONCURRENCY = 2; // Push 2 at a time

function log(msg, level = 'INFO') {
  const icon = { INFO: '📋', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[level] || '📋';
  console.log(`${icon} ${msg}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Strip ALL Meesho references from a product before pushing
 */
function sanitizeProduct(product) {
  const sanitized = { ...product };
  
  // Remove internal raw data
  delete sanitized._raw;
  
  // Clean name
  sanitized.name = (sanitized.name || '')
    .replace(/meesho/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Clean slug — remove "meesho" from slug
  sanitized.slug = (sanitized.slug || '')
    .replace(/meesho-?/gi, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Ensure brand is not Meesho
  if (!sanitized.brand || sanitized.brand.toLowerCase().includes('meesho')) {
    sanitized.brand = 'RJ Essentials';
  }

  // Clean description
  sanitized.description = (sanitized.description || '')
    .replace(/meesho/gi, '')
    .replace(/trending\s+on\s+\w+/gi, 'trending')
    .replace(/Scraped\s+from\s+\w+/gi, '');

  // Clean tags — remove any meesho tags
  sanitized.tags = (sanitized.tags || []).filter(t => 
    !t.toLowerCase().includes('meesho')
  );

  // Clean highlights
  sanitized.highlights = (sanitized.highlights || []).map(h =>
    h.replace(/meesho/gi, '').replace(/trending\s+on\s+\w+/gi, 'Trending').trim()
  ).filter(Boolean);

  // Clean specifications
  sanitized.specifications = (sanitized.specifications || []).filter(s =>
    s.key !== 'Source' || !s.value?.toLowerCase().includes('meesho')
  ).map(s => ({
    key: s.key,
    value: (s.value || '').replace(/meesho/gi, '').trim(),
  }));

  // Clean meta
  sanitized.metaTitle = (sanitized.metaTitle || '').replace(/meesho/gi, '').trim();
  sanitized.metaDescription = (sanitized.metaDescription || '').replace(/meesho/gi, '').trim();

  // Clean meeshoNotes (keep link for internal reference but clean text)
  sanitized.meeshoNotes = (sanitized.meeshoNotes || '').replace(/meesho/gi, 'source');

  return sanitized;
}

/**
 * Push a single product with retry logic
 */
async function pushProduct(product, retries = MAX_RETRIES) {
  const sanitized = sanitizeProduct(product);
  // Always ensure a unique slug by appending a random suffix
  const baseSlug = sanitized.slug.replace(/-\d{10,}$/g, '');
  sanitized.slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(sanitized),
      });

      if (!res.ok) {
        const errText = await res.text();
        
        // Handle duplicate slug — generate a new one
        if (res.status === 409 || errText.includes('duplicate') || errText.includes('E11000') || errText.includes('slug')) {
          sanitized.slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          log(`  ↻ Slug collision, retrying with: ${sanitized.slug}`, 'WARN');
          continue;
        }

        throw new Error(`HTTP ${res.status}: ${errText.substring(0, 200)}`);
      }

      return { status: 'success', data: await res.json() };
    } catch (err) {
      if (attempt === retries) {
        return { status: 'failed', error: err.message };
      }
      log(`  ↻ Retry ${attempt}/${retries}: ${err.message.substring(0, 60)}`, 'WARN');
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Ensure a category exists in the store
 */
async function ensureCategory(categoryName) {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const categories = await res.json();
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = categories.find(c => c.slug === slug || c.name.toLowerCase() === categoryName.toLowerCase());
    if (exists) return exists;

    const createRes = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ name: categoryName, slug, icon: '📦', isActive: true, order: 99 }),
    });
    if (createRes.ok) {
      log(`  Created category: ${categoryName}`, 'SUCCESS');
      return createRes.json();
    }
  } catch (err) {
    log(`  Category error: ${err.message}`, 'WARN');
  }
  return null;
}

/**
 * Flatten all products from category structure
 */
function flattenProducts(data) {
  const all = [];
  for (const [, catData] of Object.entries(data.categories || {})) {
    const products = catData.products || [];
    all.push(...products);
  }
  return all;
}

async function main() {
  const inputPath = process.argv[2] || (() => {
    // Try enriched first, fall back to latest
    const enriched = path.resolve(__dirname, '../output/enriched-latest.json');
    const latest = path.resolve(__dirname, '../output/latest.json');
    if (fs.existsSync(enriched)) return enriched;
    return latest;
  })();

  if (!fs.existsSync(inputPath)) {
    log(`File not found: ${inputPath}`, 'ERROR');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const allProducts = flattenProducts(data);
  log(`🚀 Pushing ${allProducts.length} products from ${data.metadata?.categoriesProcessed || data.metadata?.categoriesScraped || '?'} categories`);

  // Ensure all categories exist
  const categoryNames = new Set();
  for (const [, catData] of Object.entries(data.categories || {})) {
    categoryNames.add(catData.rjCategory || catData.category);
  }
  for (const name of categoryNames) {
    await ensureCategory(name);
  }

  let success = 0, failed = 0, skipped = 0;

  // Process products with controlled concurrency
  for (let i = 0; i < allProducts.length; i += CONCURRENCY) {
    const batch = allProducts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (product) => {
        const result = await pushProduct(product);
        return { product, result };
      })
    );

    for (const { product, result } of results) {
      switch (result.status) {
        case 'success':
          success++;
          log(`  ✅ [${success + failed + skipped}/${allProducts.length}] ${(product.name || '').substring(0, 50)}`);
          break;
        case 'skipped':
          skipped++;
          log(`  ⏭️ Skipped (duplicate): ${(product.name || '').substring(0, 40)}`, 'WARN');
          break;
        case 'failed':
          failed++;
          log(`  ❌ ${(product.name || '').substring(0, 40)}: ${result.error}`, 'ERROR');
          break;
      }
    }

    // Small delay between batches
    if (i + CONCURRENCY < allProducts.length) {
      await sleep(300);
    }
  }

  log(`\n📊 Results: ${success} pushed, ${skipped} skipped, ${failed} failed`, 'SUCCESS');
  
  // Save push log
  const logDir = path.resolve(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logEntry = {
    timestamp: new Date().toISOString(),
    inputFile: inputPath,
    totalProducts: allProducts.length,
    success, skipped, failed,
  };
  fs.appendFileSync(
    path.join(logDir, `push-${new Date().toISOString().split('T')[0]}.log`),
    JSON.stringify(logEntry) + '\n'
  );
}

main().catch(e => { log(`Fatal: ${e.message}`, 'ERROR'); process.exit(1); });
