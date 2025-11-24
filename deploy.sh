#!/bin/bash
set -e

echo "📥 Pulling latest code..."
git pull

echo "🏗️ Building project..."
sudo mv /dist /var/www/artstudionala.com

sudo chown -R www-data:www-data /var/www/artstudionala.com
sudo chmod -R 755 /var/www/artstudionala.com

echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
