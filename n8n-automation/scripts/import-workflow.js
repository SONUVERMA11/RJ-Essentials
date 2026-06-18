#!/usr/bin/env node
/**
 * Import n8n workflow via the n8n API
 * Run this after n8n is started to auto-import the Meesho sync workflow
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const N8N_PORT = process.env.N8N_PORT || 5678;
const WORKFLOW_PATH = path.resolve(__dirname, '../workflows/meesho-product-sync.json');

async function importWorkflow() {
  console.log('📥 Importing Meesho Product Sync workflow to n8n...');
  
  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf-8'));
  
  try {
    const res = await fetch(`http://localhost:${N8N_PORT}/api/v1/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log(`✅ Workflow imported! ID: ${result.id}`);
      console.log(`🌐 Open: http://localhost:${N8N_PORT}/workflow/${result.id}`);
    } else {
      const err = await res.text();
      console.log(`⚠️  Import via API failed (${res.status}). This is normal if n8n requires auth.`);
      console.log(`📋 Manual import: Open n8n → Workflows → Import → Select:`);
      console.log(`   ${WORKFLOW_PATH}`);
    }
  } catch (e) {
    console.log(`⚠️  Could not reach n8n at port ${N8N_PORT}. Is it running?`);
    console.log(`📋 Start n8n first: npm run n8n`);
    console.log(`📋 Then import manually: Workflows → Import from File`);
    console.log(`   File: ${WORKFLOW_PATH}`);
  }
}

importWorkflow();
