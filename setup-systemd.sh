#!/bin/bash
# ============================================
# SAPTARA - Setup Systemd Services
# ============================================
# Jalankan script ini di server Linux:
#   chmod +x setup-systemd.sh
#   sudo ./setup-systemd.sh
# ============================================

set -e

APP_DIR="/app"

echo "=========================================="
echo "  SAPTARA Systemd Setup"
echo "=========================================="

# 1. Pastikan project sudah ada
if [ ! -d "$APP_DIR/server" ] || [ ! -d "$APP_DIR/client" ]; then
  echo "❌ Error: Project belum ada di $APP_DIR"
  echo "   Pastikan folder server/ dan client/ ada di $APP_DIR"
  exit 1
fi

# 2. Install dependencies & build
echo ""
echo "📦 Installing server dependencies..."
cd "$APP_DIR/server"
npm install --production=false
echo "🔨 Building server..."
npm run build

echo ""
echo "📦 Installing client dependencies..."
cd "$APP_DIR/client"
npm install --production=false
echo "🔨 Building client..."
npm run build

# 3. Copy service files
echo ""
echo "📋 Copying service files to /etc/systemd/system/..."
cp "$APP_DIR/saptara-server.service" /etc/systemd/system/
cp "$APP_DIR/saptara-client.service" /etc/systemd/system/

# 4. Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# 5. Enable services (auto-start on boot)
echo "✅ Enabling services..."
systemctl enable saptara-server.service
systemctl enable saptara-client.service

# 6. Start services
echo "🚀 Starting services..."
systemctl start saptara-server.service
systemctl start saptara-client.service

# 7. Show status
echo ""
echo "=========================================="
echo "  Status:"
echo "=========================================="
systemctl status saptara-server.service --no-pager
echo ""
systemctl status saptara-client.service --no-pager

echo ""
echo "=========================================="
echo "  ✅ Setup selesai!"
echo "=========================================="
echo ""
echo "📌 Perintah yang berguna:"
echo "  sudo systemctl status saptara-server    # Cek status server"
echo "  sudo systemctl status saptara-client    # Cek status client"
echo "  sudo systemctl restart saptara-server   # Restart server"
echo "  sudo systemctl restart saptara-client   # Restart client"
echo "  sudo systemctl stop saptara-server      # Stop server"
echo "  sudo systemctl stop saptara-client      # Stop client"
echo "  sudo journalctl -u saptara-server -f    # Lihat log server"
echo "  sudo journalctl -u saptara-client -f    # Lihat log client"
echo ""
echo "🌐 Server API : http://localhost:3000"
echo "🌐 Client App : http://localhost:4173"

echo "🧹 Removing old services..."
systemctl stop saptara-server.service 2>/dev/null || true
systemctl stop saptara-client.service 2>/dev/null || true

systemctl disable saptara-server.service 2>/dev/null || true
systemctl disable saptara-client.service 2>/dev/null || true

rm -f /etc/systemd/system/saptara-server.service
rm -f /etc/systemd/system/saptara-client.service

cp "$APP_DIR/saptara.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable saptara
systemctl start saptara
