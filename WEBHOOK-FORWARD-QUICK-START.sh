#!/bin/bash

# ========================================
# Webhook Forward Quick Start Script
# ========================================
# Script ini untuk setup webhook forward di bot-wa server
# Run: bash WEBHOOK-FORWARD-QUICK-START.sh
# ========================================

set -e  # Exit on error

echo "🚀 Webhook Forward Setup - Quick Start"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_WA_SERVER="logs.nicola.id"
BOT_WA_USER="root"
BOT_WA_PATH="/root/Work/bot-wa"
NALA_WEBHOOK_URL="https://api.artstudionala.com/api/midtrans/notification"

# Functions
print_step() {
    echo -e "${BLUE}[Step $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check local files
print_step "1" "Checking required files..."
if [ -f "server/webhook-forward.js" ]; then
    print_success "webhook-forward.js found"
else
    print_error "webhook-forward.js not found"
    exit 1
fi

if [ -f "BOT-WA-WEBHOOK-EXAMPLE.js" ]; then
    print_success "BOT-WA-WEBHOOK-EXAMPLE.js found"
else
    print_warning "BOT-WA-WEBHOOK-EXAMPLE.js not found (optional)"
fi

echo ""

# Step 2: Test connectivity to bot-wa server
print_step "2" "Testing connection to bot-wa server..."
if ssh -q ${BOT_WA_USER}@${BOT_WA_SERVER} exit; then
    print_success "Connected to ${BOT_WA_SERVER}"
else
    print_error "Cannot connect to ${BOT_WA_SERVER}"
    echo "Please check:"
    echo "  - SSH credentials"
    echo "  - Server address"
    echo "  - Network connectivity"
    exit 1
fi

echo ""

# Step 3: Upload webhook-forward.js
print_step "3" "Uploading webhook-forward.js..."
scp server/webhook-forward.js ${BOT_WA_USER}@${BOT_WA_SERVER}:${BOT_WA_PATH}/
if [ $? -eq 0 ]; then
    print_success "webhook-forward.js uploaded"
else
    print_error "Failed to upload webhook-forward.js"
    exit 1
fi

echo ""

# Step 4: Check if .env exists
print_step "4" "Checking bot-wa .env file..."
if ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "[ -f ${BOT_WA_PATH}/.env ]"; then
    print_success ".env file exists"
    
    # Check if NALA_WEBHOOK_URL already set
    if ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "grep -q 'NALA_WEBHOOK_URL' ${BOT_WA_PATH}/.env"; then
        print_warning "NALA_WEBHOOK_URL already exists in .env"
        echo "Current value:"
        ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "grep 'NALA_WEBHOOK_URL' ${BOT_WA_PATH}/.env"
    else
        print_step "4.1" "Adding NALA_WEBHOOK_URL to .env..."
        ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "echo '' >> ${BOT_WA_PATH}/.env && echo '# Nala Webhook URL' >> ${BOT_WA_PATH}/.env && echo 'NALA_WEBHOOK_URL=${NALA_WEBHOOK_URL}' >> ${BOT_WA_PATH}/.env"
        print_success "NALA_WEBHOOK_URL added to .env"
    fi
else
    print_warning ".env file not found"
    print_step "4.1" "Creating .env file..."
    ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "echo 'NALA_WEBHOOK_URL=${NALA_WEBHOOK_URL}' > ${BOT_WA_PATH}/.env"
    print_success ".env file created"
fi

echo ""

# Step 5: Check axios installed
print_step "5" "Checking axios package..."
if ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "cd ${BOT_WA_PATH} && npm list axios > /dev/null 2>&1"; then
    print_success "axios is installed"
else
    print_warning "axios not found"
    print_step "5.1" "Installing axios..."
    ssh ${BOT_WA_USER}@${BOT_WA_SERVER} "cd ${BOT_WA_PATH} && npm install axios"
    print_success "axios installed"
fi

echo ""

# Step 6: Show next steps
print_step "6" "Setup complete! Next steps:"
echo ""
echo "1. Update your webhook handler in bot-wa:"
echo "   ${YELLOW}ssh ${BOT_WA_USER}@${BOT_WA_SERVER}${NC}"
echo "   ${YELLOW}cd ${BOT_WA_PATH}${NC}"
echo "   ${YELLOW}nano index.js  # or your webhook handler file${NC}"
echo ""
echo "2. Add this code to your webhook handler:"
echo "   ${BLUE}See: BOT-WA-WEBHOOK-EXAMPLE.js for complete example${NC}"
echo ""
echo "3. Restart bot-wa service:"
echo "   ${YELLOW}pm2 restart bot-wa${NC}"
echo "   ${YELLOW}# or: sudo systemctl restart bot-wa${NC}"
echo ""
echo "4. Check logs:"
echo "   ${YELLOW}pm2 logs bot-wa --lines 50${NC}"
echo ""
echo "5. Test webhook:"
echo "   ${YELLOW}curl -X POST https://${BOT_WA_SERVER}/webhook/midtrans \\${NC}"
echo "   ${YELLOW}  -H 'Content-Type: application/json' \\${NC}"
echo "   ${YELLOW}  -d '{\"order_id\":\"CLASS-TEST\",\"transaction_status\":\"settlement\"}'${NC}"
echo ""

print_success "Setup completed successfully!"
echo ""
echo "📚 Documentation:"
echo "   - WEBHOOK-FORWARD-SETUP.md - Complete setup guide"
echo "   - WEBHOOK-INTEGRATION.md - Integration details"
echo "   - BOT-WA-WEBHOOK-EXAMPLE.js - Code example"
echo ""

