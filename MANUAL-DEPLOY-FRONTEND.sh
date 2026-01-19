#!/bin/bash

# ========================================
# Manual Frontend Deploy Script
# ========================================
# Script untuk build dan upload frontend ke server
# ========================================

set -e

echo "🚀 Manual Frontend Deploy"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration (SESUAIKAN!)
SERVER_USER="root"
SERVER_HOST="15.235.140.249"  # atau domain
SERVER_PATH="/var/www/artstudionala.com"  # path frontend di server

# Step 1: Build
echo -e "${BLUE}[1/4] Building frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build success${NC}\n"
else
    echo -e "${YELLOW}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Backup (optional)
echo -e "${BLUE}[2/4] Creating backup on server...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz * --exclude=backup-*.tar.gz || echo 'No backup needed'"
echo -e "${GREEN}✅ Backup created${NC}\n"

# Step 3: Upload
echo -e "${BLUE}[3/4] Uploading to server...${NC}"
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*.md' \
  --exclude='*.sh' \
  dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload success${NC}\n"
else
    echo -e "${YELLOW}❌ Upload failed${NC}"
    exit 1
fi

# Step 4: Set permissions
echo -e "${BLUE}[4/4] Setting permissions...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && chown -R www-data:www-data * && chmod -R 755 *"
echo -e "${GREEN}✅ Permissions set${NC}\n"

echo "========================================"
echo -e "${GREEN}🎉 Deploy completed!${NC}"
echo ""
echo "🧪 Test:"
echo "   1. Clear browser cache (Cmd+Shift+R)"
echo "   2. Open https://artstudionala.com"
echo "   3. Try payment - should work now!"
echo ""
