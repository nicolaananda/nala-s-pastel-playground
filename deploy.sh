#!/bin/bash
set -e

echo "📥 Pulling latest code..."
git pull
npm run build
echo "🏗️ Building project..."
sudo rm -rf /home/artstudionala.com/public_html      # hapus semuanya yang lama
sudo mv ./dist /home/artstudionala.com/public_html

sudo chown -R www-data:www-data /home/artstudionala.com/public_html
sudo chmod -R 755 /home/artstudionala.com/public_html
pm2 restart nala-engine

echo "✅ Deployment complete!"
