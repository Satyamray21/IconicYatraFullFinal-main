#!/bin/bash

# ==========================================
# IconicYatra Multi-Tenant Deployment Script
# Run this on: root@srv1024558:/var/www/iconicyatra
# ==========================================

echo "🚀 Starting IconicYatra Deployment..."

# 1. Pull Latest Code
echo "📦 Pulling latest code from git..."
# git pull origin main

# 2. Deploy Backend
echo "⚙️ Deploying Backend..."
cd backend
npm install --legacy-peer-deps
# Restart via PM2 using the ecosystem file (zero downtime)
pm2 startOrReload ../ecosystem.config.js --env production
cd ..

# 3. Deploy SaaS Admin Dashboard
echo "🖥️ Deploying Admin Dashboard..."
cd dashboard
npm install --legacy-peer-deps
npm run build
cd ..

# 4. Deploy Customer Frontend UI
echo "🌍 Deploying Customer Frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

echo "✅ Deployment Complete! All services are running."
pm2 save
