#!/bin/bash
cd /home/codespace/iq
echo "🚀 Starting development server..."
echo "📍 Current directory: $(pwd)"
echo "🔍 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# التحقق من قاعدة البيانات
if [ -f "database.db" ]; then
    echo "✅ Database file exists"
else
    echo "⚠️ Creating database file..."
    touch database.db
fi

# تشغيل الخادم
echo "🔧 Starting server on port 3000..."
PORT=3000 npm run dev
