#!/bin/bash
# ─── RJ Essentials n8n Automation Startup ─────────────────────
# Starts n8n with proper environment and data directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load environment
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Set n8n data directory
export N8N_USER_FOLDER="$(pwd)/n8n-data"
export N8N_PORT="${N8N_PORT:-5678}"
export GENERIC_TIMEZONE="Asia/Kolkata"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  🚀 Starting n8n on port $N8N_PORT            ║"
echo "║  📁 Data: $N8N_USER_FOLDER                    "
echo "║  🌐 URL: http://localhost:$N8N_PORT            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

npx n8n start
