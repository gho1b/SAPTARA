#!/bin/sh
set -e

echo "=========================================="
echo "  ⛵ SAPTARA — Starting All Services"
echo "=========================================="

# ── 0. Stop existing processes to avoid port conflicts ──
echo "🧹 Stopping existing services..."
nginx -s stop 2>/dev/null || true
pkill -f "node dist/index.js" 2>/dev/null || true
sleep 1

# Remove old nginx configs
rm -f /etc/nginx/http.d/default.conf 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# ── 1. Install nginx if not present ──
if ! command -v nginx > /dev/null 2>&1; then
  echo "📦 Installing nginx..."
  apk add --no-cache nginx || apt-get update && apt-get install -y nginx
fi

# ── 2. Copy nginx config ──
echo "📋 Configuring nginx..."
cp /app/nginx.conf /etc/nginx/http.d/saptara.conf 2>/dev/null || \
cp /app/nginx.conf /etc/nginx/sites-enabled/saptara.conf 2>/dev/null || \
cp /app/nginx.conf /etc/nginx/conf.d/saptara.conf

# ── 3. Test nginx config ──
echo "🔍 Testing nginx config..."
nginx -t

# ── 4. Start backend server ──
echo "🚀 Starting backend server (port 3000)..."
cd /app/server
node dist/index.js &
SERVER_PID=$!

# ── 5. Wait for backend to be ready ──
sleep 2

# ── 6. Start nginx (port 80) — serves static client + proxies API ──
echo "🔀 Starting nginx (port 80)..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo ""
echo "=========================================="
echo "  ✅ All services running!"
echo "  🔀 nginx     → port 80  (public)"
echo "  🚀 server    → port 3000 (API)"
echo "  📁 client    → nginx serves /app/client/dist"
echo "=========================================="

# ── Keep container alive ──
wait $SERVER_PID $NGINX_PID
