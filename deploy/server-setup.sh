#!/usr/bin/env bash
# Run on the VPS as root after SSH login (once).
# If apt fails with unmet dependencies, run the block in deploy/apt-repair.sh first (or see comments below).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

APP_DIR="${APP_DIR:-/var/www/smplace}"
REPO="${REPO:-https://github.com/Quickoline/smplace.git}"
# Set to 0 to skip removing Microsoft PowerShell when it blocks apt (libicu* errors).
REMOVE_BROKEN_POWERSHELL="${REMOVE_BROKEN_POWERSHELL:-1}"

apt_get_fix() {
  apt-get update -y
  # Repair half-installed / conflicting packages (curl/nginx version skew, etc.)
  apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" --fix-broken install || true
}

apt_get_fix

# PowerShell from Microsoft repo often breaks on Ubuntu upgrades (libicu mismatch). Safe to remove on API-only servers.
if [[ "${REMOVE_BROKEN_POWERSHELL}" == "1" ]] && dpkg -s powershell &>/dev/null; then
  echo "Removing package 'powershell' to unblock apt (set REMOVE_BROKEN_POWERSHELL=0 to skip)."
  apt-get remove -y powershell || true
  apt_get_fix
fi

apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" --fix-broken install
# Pull matching security revisions (fixes curl/libcurl4t64 and nginx/nginx-common version skew).
apt-get upgrade -y
apt-get install -y git nginx curl ca-certificates gnupg

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
command -v npm >/dev/null
npm install -g pm2

mkdir -p "$(dirname "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO" "$APP_DIR"
else
  (cd "$APP_DIR" && git pull origin main)
fi

cd "$APP_DIR"
npm ci --omit=dev

if [[ ! -f .env ]]; then
  echo "WARNING: missing $APP_DIR/.env — create it, then: pm2 restart smplace-api --update-env"
fi

pm2 delete smplace-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
env PATH="$PATH" pm2 startup systemd -u root --hp /root || true

if [[ -f deploy/nginx-smplace.conf ]]; then
  cp deploy/nginx-smplace.conf /etc/nginx/sites-available/smplace
  ln -sf /etc/nginx/sites-available/smplace /etc/nginx/sites-enabled/smplace
  nginx -t && systemctl reload nginx
fi

echo "Done. API: http://127.0.0.1:5000  public: http://$(hostname -I | awk '{print $1}')/"
