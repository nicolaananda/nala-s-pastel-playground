#!/bin/bash
set -e

echo "📥 Pulling latest code..."
git pull

echo "🏗️ Building project..."
npm install
npm run build

echo "🚚 Copying build to web root..."
sudo rm -rf /var/www/artstudionala.com/*
sudo cp -r dist/* /var/www/artstudionala.com/

echo "🔐 Setting correct permissions..."
sudo chown -R www-data:www-data /var/www/artstudionala.com

echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
