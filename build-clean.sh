#!/bin/bash

echo "🧹 Cleaning everything..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 Starting production server..."
    npm start
else
    echo "❌ Build failed!"
    exit 1
fi 