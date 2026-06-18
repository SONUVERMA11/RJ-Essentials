# 🔄 RJ Essentials — Advanced Product Automation Pipeline

Automated pipeline to scrape trending products, enrich them with **AI-generated descriptions**, **multi-platform images** (Google, Amazon, Flipkart), and sync to the RJ Essentials store with full **SEO optimization**.

## 🏗️ Architecture

```
n8n-automation/
├── scraper/
│   ├── meesho-scraper.js      # Puppeteer-based product scraper (v3)
│   ├── product-enricher.js    # Master enrichment pipeline
│   ├── ai-description.js      # AI description & SEO tag generator (Gemini)
│   ├── image-sourcer.js       # Multi-platform image search (Google/Amazon/Flipkart)
│   ├── cloudinary-upload.js   # Image upload with resizing (800x800, 400x400)
│   ├── push-to-rj.js          # Push to RJ Essentials API (v2, with retry)
│   ├── scraper-api.js         # HTTP API server for n8n/webhooks
│   ├── telegram-bot.js        # Telegram bot for remote triggers
│   └── meesho-categories.js   # Category mapping
├── workflows/
│   └── meesho-product-sync.json  # n8n workflow (importable)
├── scripts/
│   ├── setup.js               # Initial setup
│   ├── start-n8n.sh           # n8n startup script
│   └── import-workflow.js     # Auto-import workflow
├── output/                    # Scraped & enriched data
├── logs/                      # Pipeline logs
├── .env                       # Environment config
└── package.json
```

## 🚀 Pipeline Flow

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌───────────────┐
│  1. SCRAPE   │ →  │  2. ENRICH       │ →  │  3. SANITIZE    │ →  │  4. PUSH      │
│  Products    │    │  • AI Desc       │    │  • Remove brand │    │  • To Store   │
│  from source │    │  • SEO Tags (30) │    │  • Clean names  │    │  • With retry │
│  (200+/run)  │    │  • Images (3+)   │    │  • No source    │    │  • Batch mode │
│              │    │  • Cloudinary    │    │    references   │    │              │
└─────────────┘    └──────────────────┘    └─────────────────┘    └───────────────┘
```

## 🔧 Quick Start

```bash
# 1. Install dependencies
cd n8n-automation
npm install

# 2. Configure .env (add your API keys)
# Required: GEMINI_API_KEY (for AI descriptions)
# Optional: TELEGRAM_BOT_TOKEN (for Telegram bot)

# 3. Run the full pipeline
npm run pipeline

# Or step by step:
npm run scrape          # Scrape products
npm run enrich          # AI descriptions + multi-platform images
npm run push            # Push to store
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run scrape` | Scrape all categories |
| `npm run scrape:category -- sarees` | Scrape one category |
| `npm run enrich` | Full enrichment (AI + images) |
| `npm run enrich:fast` | Enrich without image sourcing |
| `npm run enrich:test` | Test with 3 products only |
| `npm run push` | Push enriched products to store |
| `npm run pipeline` | Full pipeline: scrape → enrich → push |
| `npm run pipeline:fast` | Fast pipeline (skip image sourcing) |
| `npm run start-all` | Start scraper API + n8n together |
| `npm run telegram` | Start Telegram bot |

## 🤖 Telegram Bot

Control the pipeline from your phone!

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_ID` to `.env`
3. Run `npm run telegram`

**Commands:**
- `/scrape` — Scrape all categories
- `/enrich` — Enrich with AI + images
- `/push` — Push to store
- `/full` — Run entire pipeline
- `/stats` — View product stats
- Send a URL to scrape specific products

## 🎨 Enrichment Features

### AI Descriptions (Gemini)
- 200-300 word professional product descriptions
- HTML formatted with emoji, headings, bullet points
- Category-specific content
- No source marketplace branding

### SEO Tags (25-30 per product)
- Product type variations
- Shopping intent keywords (buy online, best price, COD)
- Category-specific terms
- Trending/seasonal terms
- Works without API key (comprehensive fallbacks)

### Multi-Platform Images
- Google Images search for product photos
- Amazon.in similar product images
- Flipkart product images
- All uploaded to Cloudinary (800x800 main, 400x400 thumbnails)
- Minimum 2-3 images per product

### Automatic Branding
- All source references completely removed
- Brand always set to "RJ Essentials"
- Professional highlights and specifications
- SEO-optimized meta titles and descriptions

## ⚙️ n8n Workflow

The workflow runs **every 12 hours** and executes the full pipeline:

1. ⏰ Triggers on schedule (or manually)
2. 🕷️ Scrapes trending products across all categories
3. 🤖 Enriches with AI descriptions, SEO tags, and multi-platform images
4. 🧹 Sanitizes all data (removes source branding)
5. 🚀 Pushes each product to the store API
6. 📊 Generates pipeline report
7. 📝 Logs everything

Products are created with `status: 'draft'` for review before publishing.

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RJ_API_BASE_URL` | ✅ | Store API URL |
| `RJ_AGENT_API_KEY` | ✅ | Admin API key |
| `GEMINI_API_KEY` | ⬜ | Google Gemini API key (for AI descriptions) |
| `CLOUDINARY_*` | ⬜ | Cloudinary credentials (for image hosting) |
| `TELEGRAM_BOT_TOKEN` | ⬜ | Telegram bot token |
| `TELEGRAM_ADMIN_ID` | ⬜ | Your Telegram chat ID |
| `MAX_PRODUCTS_PER_CATEGORY` | ⬜ | Products per category (default: 20) |
| `HEADLESS` | ⬜ | Run browser headless (default: true) |

## ☁️ Cloud Deployment

For cloud deployment, use the webhook mode:

```bash
# Telegram bot in webhook mode
npm run telegram:webhook

# Or use the scraper API for external triggers
npm run scraper-api
# POST http://your-server:3456/pipeline
```

The scraper API exposes a `/pipeline` endpoint that runs the full flow in one call.
