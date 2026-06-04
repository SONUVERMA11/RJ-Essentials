---
description: Daily maintenance workflow for RJ Essentials using automated agents
---

# Daily Maintenance Workflow

This workflow runs all maintenance agents to keep RJ Essentials store healthy.

## Prerequisites
- Navigate to `agents/` directory: `cd agents`
- Install dependencies (first time only): `npm install`
- Ensure `.env.local` has `AGENT_API_KEY` set

## Daily Workflow

### 1. Check Inventory & Pricing
// turbo
```bash
npx tsx orchestrator.ts --agent=inventory
```
- Reviews stock levels (flags out-of-stock, critical, low)
- Checks Meesho prices for changes
- Report saved to `output/reports/inventory-report-<date>.json`

### 2. Process Orders
// turbo
```bash
npx tsx orchestrator.ts --agent=orders
```
- Lists pending orders
- Generates Meesho bulk-order list
- Creates WhatsApp confirmation messages
- Flags stale orders (48h+ without update)

### 3. Generate Analytics
// turbo
```bash
npx tsx orchestrator.ts --agent=analytics --days=7
```
- Revenue, top products, category performance
- Customer insights (top cities/states)
- Recommendations for what to promote/remove

### 4. Generate Social Media Content
// turbo
```bash
npx tsx orchestrator.ts --agent=marketing --filter=new-arrivals --max=3
```
- Creates poster images (Instagram, Facebook, WhatsApp)
- Generates captions with hashtags
- Content saved to `output/social-content/<date>/`

### 5. Run All At Once (optional)
// turbo
```bash
npx tsx orchestrator.ts --all
```

## Weekly: Product Research + Listing

### 6. Research New Products
```bash
npx tsx orchestrator.ts --agent=research --url=<meesho-category-url> --max=15
```
- Replace `<meesho-category-url>` with the Meesho category you want to research
- Results saved to `output/reports/research-report-<date>.json`
- Top products queued in `output/product-queue.json`

### 7. Create Product Listings
```bash
npx tsx orchestrator.ts --agent=listing --dry-run
```
- First run with `--dry-run` to preview what will be created
- Then remove `--dry-run` to actually create listings
- Products are created in **draft** status for your review in admin panel
