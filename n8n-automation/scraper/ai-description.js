#!/usr/bin/env node
/**
 * AI Description Generator
 * Generates rich, SEO-optimized product descriptions, tags,
 * highlights, and specifications using Google Gemini API.
 * 
 * Completely removes all Meesho branding and generates
 * professional e-commerce content for RJ Essentials.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const STORE_NAME = 'RJ Essentials';

function log(msg, lvl = 'INFO') {
  const icon = { INFO: '🤖', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[lvl] || '🤖';
  console.log(`${icon} [AI-Desc] ${msg}`);
}

/**
 * Clean product name — remove prices, Meesho branding
 */
function cleanProductName(name) {
  return name
    .replace(/₹[\d,]+/g, '')
    .replace(/\d+%\s*off/gi, '')
    .replace(/Rs\.?\s*[\d,]+/g, '')
    .replace(/Free\s+Delivery/gi, '')
    .replace(/meesho/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate SEO tags based on product name and category
 * Fallback when AI is not available
 */
function generateFallbackTags(productName, category) {
  const clean = cleanProductName(productName).toLowerCase();
  const words = clean.split(/\s+/).filter(w => w.length > 2);
  
  const baseTags = [
    'buy online', 'best price', 'free shipping', 'cod available',
    'cash on delivery', 'india', 'online shopping', 'trending',
    'best seller', 'top rated', 'new arrival', 'premium quality',
    'affordable', 'budget friendly', 'value for money',
  ];

  const categoryTags = {
    'Sarees': ['saree', 'silk saree', 'cotton saree', 'designer saree', 'wedding saree', 'party wear saree', 'daily wear saree', 'georgette saree', 'banarasi saree', 'printed saree', 'embroidered saree', 'ethnic wear', 'indian wear', 'women fashion', 'traditional wear'],
    'Kurtis & Kurta Sets': ['kurti', 'kurta set', 'anarkali kurti', 'straight kurti', 'cotton kurti', 'rayon kurti', 'designer kurti', 'party wear kurti', 'casual kurti', 'office wear', 'ethnic wear', 'women fashion', 'indian wear', 'kurta palazzo set', 'kurta pant set'],
    'Jewellery': ['jewellery', 'necklace', 'earrings', 'bangles', 'bracelet', 'ring', 'mangalsutra', 'oxidised jewellery', 'artificial jewellery', 'imitation jewellery', 'fashion jewellery', 'bridal jewellery', 'party wear jewellery', 'daily wear jewellery', 'women accessories'],
    'Home & Kitchen': ['home decor', 'kitchen items', 'bedsheet', 'curtains', 'organizer', 'storage', 'kitchen gadgets', 'household items', 'home essentials', 'home accessories', 'kitchen accessories', 'room decor', 'wall decor', 'bed cover', 'pillow cover'],
    'Beauty & Health': ['beauty products', 'skincare', 'haircare', 'makeup', 'face cream', 'face wash', 'lipstick', 'foundation', 'sunscreen', 'body lotion', 'shampoo', 'hair oil', 'beauty essentials', 'personal care', 'grooming'],
    'Men Clothing': ['mens fashion', 't-shirt', 'shirt', 'jeans', 'track pants', 'casual wear', 'formal wear', 'polo shirt', 'round neck tshirt', 'printed tshirt', 'cotton shirt', 'slim fit', 'regular fit', 'mens wear', 'boys clothing'],
    'Bags & Footwear': ['bags', 'handbag', 'sling bag', 'backpack', 'wallet', 'purse', 'sandals', 'heels', 'flats', 'sneakers', 'shoes', 'casual shoes', 'party wear', 'women bags', 'travel bag'],
    'Electronics': ['electronics', 'gadgets', 'mobile accessories', 'earbuds', 'headphones', 'charger', 'power bank', 'mobile cover', 'screen protector', 'bluetooth speaker', 'smartwatch', 'usb cable', 'tech accessories', 'digital', 'wireless'],
    'Kids & Toys': ['kids wear', 'boys clothing', 'girls clothing', 'kids dress', 'toys', 'educational toys', 'baby clothing', 'kids fashion', 'children wear', 'infant clothing', 'toddler dress', 'kids accessories', 'school bag', 'kids shoes', 'baby care'],
    'Watches': ['watch', 'wrist watch', 'analog watch', 'digital watch', 'smartwatch', 'couple watch', 'sports watch', 'luxury watch', 'casual watch', 'fashion watch', 'men watch', 'women watch', 'waterproof watch', 'branded watch', 'designer watch'],
  };

  const catTags = categoryTags[category] || [];
  const nameTags = words.filter(w => !['the', 'and', 'for', 'with', 'set', 'new'].includes(w));

  // Combine and deduplicate
  const allTags = [...new Set([
    ...nameTags.slice(0, 5),
    category.toLowerCase(),
    ...catTags,
    ...baseTags,
    `${category.toLowerCase()} online`,
    `buy ${category.toLowerCase()}`,
    `${category.toLowerCase()} india`,
    `best ${category.toLowerCase()}`,
    `cheap ${category.toLowerCase()}`,
    `${STORE_NAME.toLowerCase()}`,
  ])];

  return allTags.slice(0, 30);
}

/**
 * Generate fallback description without AI
 */
function generateFallbackDescription(productName, category, price, mrp) {
  const clean = cleanProductName(productName);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  
  return `<div class="product-description">
<h3>✨ ${clean}</h3>
<p>Discover this stunning <strong>${clean}</strong> from ${STORE_NAME}'s curated ${category} collection. Handpicked for quality and style, this product brings you the perfect blend of elegance and affordability.</p>

<h4>🎯 Why Choose This Product?</h4>
<ul>
<li>✅ Premium quality materials with superior craftsmanship</li>
<li>✅ Carefully curated from top-rated sellers</li>
<li>✅ Perfect for daily wear, parties, and special occasions</li>
<li>✅ Comfortable fit with modern design elements</li>
${discount > 0 ? `<li>🔥 Save ${discount}% — Limited time offer!</li>` : ''}
</ul>

<h4>📦 What You Get</h4>
<p>Each order is carefully packed and quality-checked before shipping. We ensure that every product meets our high standards of quality and craftsmanship.</p>

<h4>🚚 Delivery & Returns</h4>
<ul>
<li>📍 Free delivery across India</li>
<li>💳 Cash on Delivery available</li>
<li>🔄 Easy 7-day returns</li>
<li>💯 100% quality guarantee</li>
</ul>

<p><em>Shop with confidence at ${STORE_NAME} — Your trusted destination for quality products at unbeatable prices.</em></p>
</div>`;
}

/**
 * Generate rich description using Gemini API
 */
async function generateAIDescription(productName, category, price, mrp, specs = []) {
  if (!GEMINI_API_KEY) {
    log('No Gemini API key, using fallback descriptions', 'WARN');
    return null;
  }

  const clean = cleanProductName(productName);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const prompt = `You are a professional e-commerce copywriter for "${STORE_NAME}", an Indian online store. Generate a compelling, SEO-optimized product description in HTML format.

Product: ${clean}
Category: ${category}
Selling Price: ₹${price}
MRP: ₹${mrp}
${discount > 0 ? `Discount: ${discount}% off` : ''}
${specs.length > 0 ? `Known Specs: ${specs.map(s => `${s.key}: ${s.value}`).join(', ')}` : ''}

Requirements:
1. Write 200-300 words of engaging, conversion-focused copy
2. Use proper HTML formatting with h3, h4, p, ul/li, strong, em tags
3. Include emojis for visual appeal (✨ 🎯 📦 🚚 ⭐ etc.)
4. Highlight key benefits and features
5. Include a "Why Choose This" section
6. Include delivery and returns info (Free delivery, COD, 7-day returns)
7. DO NOT mention any source marketplace name
8. DO NOT use any placeholder text
9. Make it feel premium and trustworthy
10. Include relevant category-specific details
11. End with a confidence-building call-to-action

Return ONLY the HTML content, no markdown fences.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Clean up any markdown fences
    return text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  } catch (err) {
    log(`Gemini error: ${err.message}`, 'ERROR');
    return null;
  }
}

/**
 * Generate SEO tags using Gemini API
 */
async function generateAITags(productName, category) {
  if (!GEMINI_API_KEY) {
    return generateFallbackTags(productName, category);
  }

  const clean = cleanProductName(productName);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate 25-30 SEO search tags for this Indian e-commerce product. Tags should help the product rank on Google India.

Product: ${clean}
Category: ${category}
Store: ${STORE_NAME}

Return ONLY a JSON array of lowercase tag strings. Example: ["tag1", "tag2", "tag3"]
Include: product type variations, color/material guesses, occasion (daily wear, party, wedding), price range descriptors (affordable, budget, premium), shopping intent keywords (buy online, best price, cod), trending/seasonal terms.
Do NOT include any marketplace names.` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
        }),
      }
    );

    if (!res.ok) throw new Error('Gemini API error');

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const tags = JSON.parse(jsonMatch[0]);
      return tags.filter(t => typeof t === 'string' && !t.toLowerCase().includes('meesho'));
    }
  } catch (err) {
    log(`Tag generation error: ${err.message}`, 'WARN');
  }

  return generateFallbackTags(productName, category);
}

/**
 * Generate highlights for a product
 */
function generateHighlights(productName, category, price, mrp) {
  const clean = cleanProductName(productName);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const baseHighlights = [
    `✨ Premium ${category} Collection`,
    '⭐ Top-rated by customers',
    '📦 Fast & free delivery across India',
    '💳 Cash on Delivery available',
    '🔄 Easy 7-day return policy',
    '💯 Quality guaranteed',
  ];

  if (discount > 10) {
    baseHighlights.unshift(`🔥 ${discount}% OFF — Limited offer!`);
  }

  const categoryHighlights = {
    'Sarees': ['🎨 Rich color palette with elegant designs', '👗 Perfect drape with comfortable fabric'],
    'Kurtis & Kurta Sets': ['👗 Flattering fit for all body types', '🎨 Trendy designs for every occasion'],
    'Jewellery': ['💎 Premium quality materials', '✨ Elegant finish that lasts'],
    'Home & Kitchen': ['🏠 Transform your living space', '🛡️ Durable and long-lasting'],
    'Beauty & Health': ['🌿 Gentle on skin', '✨ Visible results'],
    'Men Clothing': ['👔 Smart casual fit', '🧵 Premium fabric quality'],
    'Bags & Footwear': ['👜 Spacious and stylish', '🎯 Perfect for every occasion'],
    'Electronics': ['⚡ High performance', '🔋 Long-lasting durability'],
    'Kids & Toys': ['🧸 Safe for children', '🎓 Educational and fun'],
    'Watches': ['⌚ Precision timekeeping', '💎 Premium build quality'],
  };

  const catSpecific = categoryHighlights[category] || [];
  return [...baseHighlights.slice(0, 4), ...catSpecific, ...baseHighlights.slice(4)].slice(0, 8);
}

/**
 * Generate specifications for a product
 */
function generateSpecifications(productName, category, price) {
  const clean = cleanProductName(productName);
  
  const baseSpecs = [
    { key: 'Brand', value: STORE_NAME },
    { key: 'Category', value: category },
    { key: 'Availability', value: 'In Stock' },
    { key: 'Shipping', value: 'Free All India Delivery' },
    { key: 'Return Policy', value: '7 Days Easy Return' },
    { key: 'Payment', value: 'COD / UPI / Card / Net Banking' },
  ];

  const categorySpecs = {
    'Sarees': [{ key: 'Type', value: 'Saree' }, { key: 'Occasion', value: 'Casual/Party/Wedding' }, { key: 'Care', value: 'Dry Clean Recommended' }],
    'Kurtis & Kurta Sets': [{ key: 'Type', value: 'Kurti/Kurta Set' }, { key: 'Fit', value: 'Regular Fit' }, { key: 'Sleeve', value: 'Various Options' }],
    'Jewellery': [{ key: 'Type', value: 'Fashion Jewellery' }, { key: 'Material', value: 'Alloy/Metal' }, { key: 'Plating', value: 'Gold/Silver Plated' }],
    'Home & Kitchen': [{ key: 'Type', value: 'Home Essentials' }, { key: 'Material', value: 'Premium Quality' }, { key: 'Usage', value: 'Home/Kitchen' }],
    'Beauty & Health': [{ key: 'Type', value: 'Beauty Product' }, { key: 'Skin Type', value: 'All Skin Types' }, { key: 'Usage', value: 'Daily Use' }],
    'Men Clothing': [{ key: 'Type', value: 'Men\'s Wear' }, { key: 'Fit', value: 'Regular/Slim Fit' }, { key: 'Pattern', value: 'Solid/Printed' }],
    'Bags & Footwear': [{ key: 'Type', value: 'Bags/Footwear' }, { key: 'Material', value: 'PU/Leather/Canvas' }, { key: 'Occasion', value: 'Casual/Formal' }],
    'Electronics': [{ key: 'Type', value: 'Electronic Gadget' }, { key: 'Warranty', value: 'Manufacturer Warranty' }, { key: 'Connectivity', value: 'Wireless/USB' }],
    'Kids & Toys': [{ key: 'Type', value: 'Kids Product' }, { key: 'Age Group', value: 'All Ages' }, { key: 'Safety', value: 'Child Safe Materials' }],
    'Watches': [{ key: 'Type', value: 'Wrist Watch' }, { key: 'Movement', value: 'Quartz' }, { key: 'Water Resistance', value: 'Splash Proof' }],
  };

  const catSpecs = categorySpecs[category] || [];
  return [...catSpecs, ...baseSpecs];
}

/**
 * Generate complete SEO metadata
 */
function generateMetadata(productName, category, price) {
  const clean = cleanProductName(productName);
  
  return {
    metaTitle: `${clean} | Buy Online at ₹${price} | ${STORE_NAME}`,
    metaDescription: `Shop ${clean} online at ${STORE_NAME}. ₹${price} with free delivery & COD. ✅ Top quality ${category} ✅ Easy returns ✅ Best prices in India. Order now!`,
  };
}

/**
 * Fully enrich a product with AI content
 * @param {object} product - Raw scraped product data
 * @returns {Promise<object>} Enriched product data
 */
async function enrichProduct(product) {
  const cleanName = cleanProductName(product.name);
  const category = product.category || 'General';
  const price = product.sellingPrice || 0;
  const mrp = product.mrp || price;

  // Generate all content
  const [aiDescription, aiTags] = await Promise.allSettled([
    generateAIDescription(cleanName, category, price, mrp, product.specifications),
    generateAITags(cleanName, category),
  ]);

  const description = aiDescription.status === 'fulfilled' && aiDescription.value
    ? aiDescription.value
    : generateFallbackDescription(cleanName, category, price, mrp);

  const tags = aiTags.status === 'fulfilled' && aiTags.value
    ? aiTags.value
    : generateFallbackTags(cleanName, category);

  const highlights = generateHighlights(cleanName, category, price, mrp);
  const specifications = generateSpecifications(cleanName, category, price);
  const metadata = generateMetadata(cleanName, category, price);

  return {
    name: cleanName,
    description,
    tags,
    highlights,
    specifications,
    metaTitle: metadata.metaTitle,
    metaDescription: metadata.metaDescription,
    brand: STORE_NAME,
  };
}

module.exports = {
  enrichProduct,
  cleanProductName,
  generateFallbackTags,
  generateFallbackDescription,
  generateAIDescription,
  generateAITags,
  generateHighlights,
  generateSpecifications,
  generateMetadata,
};
