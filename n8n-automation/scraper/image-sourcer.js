#!/usr/bin/env node
/**
 * Multi-Platform Image Sourcer
 * Searches Google, Amazon, and Flipkart for product images
 * to supplement scraped images from Meesho.
 * 
 * Uses Puppeteer-based image search (no API keys needed).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(msg, lvl = 'INFO') {
  const icon = { INFO: '🔍', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[lvl] || '🔍';
  console.log(`${icon} [ImageSourcer] ${msg}`);
}

/**
 * Search Google Images for a product (using Puppeteer)
 * @param {object} browser - Puppeteer browser instance
 * @param {string} query - Search query
 * @param {number} maxImages - Max images to find
 * @returns {Promise<string[]>} Array of image URLs
 */
async function searchGoogleImages(browser, query, maxImages = 5) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Use Google Images search — filter for product/shopping images
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' product image high quality')}&tbm=isch&tbs=isz:l`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000);

    const imageUrls = await page.evaluate((max) => {
      const urls = [];
      const imgs = document.querySelectorAll('img[src^="http"]');
      for (const img of imgs) {
        if (urls.length >= max) break;
        const src = img.src || '';
        // Skip tiny icons and Google UI images
        if (src.includes('gstatic.com/images') || src.includes('google.com/logos')) continue;
        if (img.naturalWidth < 100 || img.naturalHeight < 100) continue;
        if (src.startsWith('http') && !src.includes('encrypted-tbn0')) {
          urls.push(src);
        }
      }
      // Also try to get full-size image URLs from data attributes
      const thumbnails = document.querySelectorAll('[data-src]');
      for (const el of thumbnails) {
        if (urls.length >= max) break;
        const dataSrc = el.getAttribute('data-src');
        if (dataSrc && dataSrc.startsWith('http')) {
          urls.push(dataSrc);
        }
      }
      return urls.slice(0, max);
    }, maxImages);

    log(`  Google Images: found ${imageUrls.length} for "${query.substring(0, 40)}"`);
    return imageUrls;
  } catch (err) {
    log(`  Google Images error: ${err.message}`, 'WARN');
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Search Amazon.in for similar product images
 */
async function searchAmazonImages(browser, query, maxImages = 3) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(3000);

    const imageUrls = await page.evaluate((max) => {
      const urls = [];
      // Amazon product images
      const imgs = document.querySelectorAll('.s-image, img[data-image-latency="s-product-image"]');
      for (const img of imgs) {
        if (urls.length >= max) break;
        let src = img.src || '';
        // Get higher resolution version
        src = src.replace(/\._AC_UL\d+_/, '._AC_UL800_')
               .replace(/\._AC_US\d+_/, '._AC_US800_')
               .replace(/\._SS\d+_/, '._SS800_');
        if (src.startsWith('http') && src.includes('images-amazon')) {
          urls.push(src);
        }
      }
      return urls;
    }, maxImages);

    log(`  Amazon: found ${imageUrls.length} for "${query.substring(0, 40)}"`);
    return imageUrls;
  } catch (err) {
    log(`  Amazon search error: ${err.message}`, 'WARN');
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Search Flipkart for similar product images
 */
async function searchFlipkartImages(browser, query, maxImages = 3) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(3000);

    // Close login popup if present
    try {
      const closeBtn = await page.$('button._2KpZ6l._2doB4z');
      if (closeBtn) await closeBtn.click();
      await sleep(500);
    } catch {}

    const imageUrls = await page.evaluate((max) => {
      const urls = [];
      const imgs = document.querySelectorAll('img._396cs4, img[loading="eager"], img._2r_T1I');
      for (const img of imgs) {
        if (urls.length >= max) break;
        let src = img.src || '';
        // Get higher resolution version
        src = src.replace(/\/\d+\/\d+\?/, '/800/800?')
               .replace(/q=\d+/, 'q=90');
        if (src.startsWith('http') && (src.includes('flipkart') || src.includes('rukminim'))) {
          urls.push(src);
        }
      }
      return urls;
    }, maxImages);

    log(`  Flipkart: found ${imageUrls.length} for "${query.substring(0, 40)}"`);
    return imageUrls;
  } catch (err) {
    log(`  Flipkart search error: ${err.message}`, 'WARN');
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Find multiple images for a product across platforms
 * @param {object} browser - Puppeteer browser instance  
 * @param {string} productName - Product name to search
 * @param {string} category - Product category for better search
 * @param {string} existingImageUrl - Already scraped image URL
 * @param {number} targetImages - How many images we want total
 * @returns {Promise<string[]>} Array of unique image URLs
 */
async function findProductImages(browser, productName, category, existingImageUrl = '', targetImages = 3) {
  const allImages = [];
  
  // Start with existing scraped image
  if (existingImageUrl && existingImageUrl.startsWith('http')) {
    allImages.push(existingImageUrl);
  }

  // Clean product name for searching — remove any price text
  const cleanName = productName
    .replace(/₹[\d,]+/g, '')
    .replace(/\d+%\s*off/gi, '')
    .replace(/Rs\.?\s*[\d,]+/g, '')
    .replace(/Free\s+Delivery/gi, '')
    .trim();

  const searchQuery = `${cleanName} ${category}`.substring(0, 80);

  // Search in parallel across platforms
  const [googleImages, amazonImages, flipkartImages] = await Promise.allSettled([
    searchGoogleImages(browser, searchQuery, 3),
    searchAmazonImages(browser, cleanName, 2),
    searchFlipkartImages(browser, cleanName, 2),
  ]);

  // Collect results
  if (googleImages.status === 'fulfilled') allImages.push(...googleImages.value);
  if (amazonImages.status === 'fulfilled') allImages.push(...amazonImages.value);
  if (flipkartImages.status === 'fulfilled') allImages.push(...flipkartImages.value);

  // Deduplicate
  const unique = [...new Set(allImages)].filter(url => 
    url && url.startsWith('http') && !url.includes('meesho')  // Avoid meesho-sourced images
  );

  // If we removed the meesho image, re-add the original as fallback
  if (unique.length === 0 && existingImageUrl) {
    unique.push(existingImageUrl);
  }

  return unique.slice(0, targetImages);
}

module.exports = { findProductImages, searchGoogleImages, searchAmazonImages, searchFlipkartImages };
