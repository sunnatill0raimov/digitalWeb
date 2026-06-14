#!/bin/bash
set -e
echo "=== Backend tuzatish boshlandi ==="

# .env yozish
mkdir -p /var/www/digitalWeb/backend
cat > /var/www/digitalWeb/backend/.env << 'ENVEOF'
DATABASE_URL=postgresql://digitalcrm_user:tT4mkjNqBeKyxuwmQH2h0bfue9mSfUzC@dpg-d8ih8t5ckfvc73bqjjqg-a.oregon-postgres.render.com/digitalcrm
JWT_SECRET=digital-cloud
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=https://eturnir.uz
ALLOWED_ORIGINS=https://eturnir.uz,http://localhost:5173
ENVEOF
echo "✅ .env yozildi"

# GitHub public key qo'shish (keyingi deploylar uchun)
mkdir -p ~/.ssh
grep -qF "github-actions@digitalcrm" ~/.ssh/authorized_keys 2>/dev/null || \
  echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIcRSS37UJwxD8p7k0gE/C37gSb7AAfmyL1UXoyPaBxn github-actions@digitalcrm" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ SSH kalit qo'shildi"

# Repo yangilash
if [ ! -d "/var/www/digitalWeb/.git" ]; then
  git clone https://github.com/sunnatill0raimov/digitalWeb.git /var/www/digitalWeb
else
  cd /var/www/digitalWeb
  git fetch origin main
  git reset --hard origin/main
fi
echo "✅ Kod yangilandi"

# Dependencies
cd /var/www/digitalWeb/backend
npm ci --omit=dev
echo "✅ npm install tugadi"

# PM2 restart
pm2 delete crm-backend 2>/dev/null || true
pm2 start src/server.js --name crm-backend
pm2 save
pm2 startup 2>/dev/null || true
echo "✅ Backend ishga tushdi"

sleep 2
pm2 list
echo ""
echo "=== TAYYOR! ==="
