#!/bin/bash

echo "🚀 Starting test for Telegram notification..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "👉 Please create .env file with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID"
    exit 1
fi

# Check if Telegram vars are set
if ! grep -q "TELEGRAM_BOT_TOKEN" .env || ! grep -q "TELEGRAM_CHAT_ID" .env; then
    echo "❌ Telegram configuration not found in .env!"
    echo "👉 Please add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env"
    exit 1
fi

echo "✅ Environment variables found"
echo ""

# Start server in background
echo "🔄 Starting server..."
npm run dev:server > /tmp/nala-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to be ready..."
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start!"
    echo "👉 Check logs: cat /tmp/nala-server.log"
    exit 1
fi

# Wait a bit more to ensure server is fully ready
sleep 2

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Run test
echo "📤 Sending test webhook..."
echo ""
node test-telegram-class.js http://localhost:3001

# Wait a bit for notification to be sent
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Check your Telegram for the notification!"
echo ""
echo "🔍 Server logs (last 20 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -20 /tmp/nala-server.log
echo ""

# Ask if user wants to keep server running
read -p "❓ Keep server running? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Stopping server..."
    kill $SERVER_PID
    echo "✅ Server stopped"
else
    echo "✅ Server still running (PID: $SERVER_PID)"
    echo "👉 To stop: kill $SERVER_PID"
fi

echo ""
echo "✨ Test complete!"
