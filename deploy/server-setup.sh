#!/usr/bin/env bash
# Run on the VPS as root after SSH login (once).
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/smplace}"
REPO="${REPO:-https://github.com/Quickoline/smplace.git}"

apt-get update -y
apt-get install -y git nginx curl
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

mkdir -p "$(dirname "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO" "$APP_DIR"
else
  cd "$APP_DIR" && git pull origin main
fi

cd "$APP_DIR"
npm ci --omit=dev

if [[ ! -f .env ]]; then
  echo "Create $APP_DIR/.env (MONGODB_URI, PORT=5000, JWT_SECRET, etc.) then re-run or: pm2 restart smplace-api"
fi

pm2 delete smplace-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
env PATH="$PATH" pm2 startup systemd -u root --hp /root

if [[ -f deploy/nginx-smplace.conf ]]; then
  cp deploy/nginx-smplace.conf /etc/nginx/sites-available/smplace
  ln -sf /etc/nginx/sites-available/smplace /etc/nginx/sites-enabled/smplace
  nginx -t && systemctl reload nginx
fi

echo "Done. API: http://127.0.0.1:5000  public: http://$(hostname -I | awk '{print $1}')/"
