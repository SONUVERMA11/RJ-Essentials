#!/usr/bin/env node
/**
 * Setup script — initializes n8n data directory and prints instructions
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const dirs = ['output', 'logs', 'n8n-data', 'workflows'];

console.log('🔧 RJ Essentials n8n Automation Setup\n');

// Create directories
for (const dir of dirs) {
  const p = path.join(BASE, dir);
  if (!fs.existsSync(p)) { fs.mkdirSync(p, { recursive: true }); console.log(`  ✅ Created: ${dir}/`); }
  else console.log(`  ✓ Exists: ${dir}/`);
}

// Check .env
const envPath = path.join(BASE, '.env');
if (fs.existsSync(envPath)) {
  console.log('  ✓ .env file found');
} else {
  console.log('  ⚠️  .env file missing — copy from .env.example');
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🚀 RJ Essentials × Meesho n8n Automation          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Quick Start:                                                ║
║  1. npm install                                              ║
║  2. npm run n8n         (start n8n at localhost:5678)         ║
║  3. Import workflow from workflows/meesho-product-sync.json  ║
║  4. Configure HTTP Header Auth credential:                   ║
║     Name: Authorization                                      ║
║     Value: Bearer <your AGENT_API_KEY>                       ║
║  5. Activate the workflow!                                   ║
║                                                              ║
║  Manual scraping:                                            ║
║  • npm run scrape           (all categories)                 ║
║  • npm run scrape:category sarees  (single category)         ║
║                                                              ║
║  Push manually:                                              ║
║  • node scraper/push-to-rj.js                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
