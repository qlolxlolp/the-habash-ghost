#!/bin/bash

# شبح حبشی - Deployment Script
# Copyright © Erfan Rajabee - بهار 1404 - ایران، ایلام

echo "🚀 شروع deployment شبح حبشی..."
echo "=========================================="

# نصب dependencies
echo "📦 نصب dependencies..."
npm install

# Build کردن پروژه
echo "🔨 Build کردن پروژه..."
npm run build

# تنظیم environment variables
echo "⚙️  تنظیم environment variables..."
export NODE_ENV=production
export SESSION_SECRET="erfan_rajabee_shabah_habashi_secret_key_2024"
export DATABASE_URL="postgresql://user:password@localhost:5432/shabah_habashi"

# بررسی فایل‌های build شده
echo "✅ بررسی فایل‌های build شده..."
if [ -f "dist/index.js" ]; then
    echo "✓ Backend build موفق"
else
    echo "❌ Backend build ناموفق"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✓ Frontend build موفق"
else
    echo "❌ Frontend build ناموفق"
    exit 1
fi

echo "=========================================="
echo "🎉 Deployment موفقیت‌آمیز بود!"
echo "🌐 سرور در حال اجرا روی پورت 5000"
echo "👤 کاربر پیش‌فرض: qwerty | azerty"
echo "© Erfan Rajabee - بهار 1404"
echo "=========================================="

# اجرای production server
echo "🚀 شروع production server..."
node dist/index.js
