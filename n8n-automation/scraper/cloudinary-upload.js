#!/usr/bin/env node
/**
 * Cloudinary Image Upload Module
 * Uploads product images to Cloudinary with proper sizing,
 * background removal, and thumbnail generation.
 */

const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function log(msg, lvl = 'INFO') {
  const icon = { INFO: '☁️', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[lvl] || '☁️';
  console.log(`${icon} [Cloudinary] ${msg}`);
}

/**
 * Generate Cloudinary signature for authenticated uploads
 */
function generateSignature(params) {
  const sortedKeys = Object.keys(params).sort();
  const str = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(str + API_SECRET).digest('hex');
}

/**
 * Download image from URL and return as Buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { timeout: 15000, headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Accept': 'image/*,*/*',
      'Referer': 'https://www.google.com/',
    }}, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} downloading image`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => { request.destroy(); reject(new Error('Download timeout')); });
  });
}

/**
 * Upload a single image to Cloudinary from URL
 * @param {string} imageUrl - Source image URL
 * @param {string} folder - Cloudinary folder
 * @param {string} publicId - Desired public ID
 * @returns {Promise<{url: string, publicId: string, thumbnailUrl: string}>}
 */
async function uploadImageFromUrl(imageUrl, folder = 'rj-essentials/products', publicId = '') {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    log('Cloudinary credentials missing, returning original URL', 'WARN');
    return { url: imageUrl, publicId: '', thumbnailUrl: imageUrl };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      timestamp,
      folder,
      transformation: 'c_fill,w_800,h_800,q_auto:best,f_auto',
    };
    if (publicId) params.public_id = publicId;

    const signature = generateSignature(params);

    // Use fetch upload via URL
    const formData = new URLSearchParams();
    formData.append('file', imageUrl);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('transformation', 'c_fill,w_800,h_800,q_auto:best,f_auto');
    if (publicId) formData.append('public_id', publicId);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const data = await res.json();
    const baseUrl = data.secure_url.replace(/\/upload\//, '/upload/');
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      // Generate thumbnail URL using Cloudinary transformations
      thumbnailUrl: data.secure_url.replace('/upload/', '/upload/c_fill,w_400,h_400,q_auto/'),
      width: data.width,
      height: data.height,
    };
  } catch (err) {
    log(`Upload failed for ${imageUrl.substring(0, 60)}: ${err.message}`, 'ERROR');
    return { url: imageUrl, publicId: '', thumbnailUrl: imageUrl };
  }
}

/**
 * Upload multiple images for a product
 * @param {string[]} imageUrls - Array of image URLs
 * @param {string} productSlug - Product slug for organization
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
async function uploadProductImages(imageUrls, productSlug) {
  if (!imageUrls || imageUrls.length === 0) return [];

  const results = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    if (!url || !url.startsWith('http')) continue;

    const publicId = `${productSlug}-${i + 1}`;
    log(`Uploading image ${i + 1}/${imageUrls.length} for ${productSlug}`);
    
    const result = await uploadImageFromUrl(url, 'rj-essentials/products', publicId);
    results.push(result);

    // Small delay between uploads
    if (i < imageUrls.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

module.exports = { uploadImageFromUrl, uploadProductImages, downloadImage };
