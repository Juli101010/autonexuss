#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/labonita}"
ZIP_PATH="${ZIP_PATH:-/opt/labonita-release.zip}"
DOMAIN="${DOMAIN:-labonita.coop}"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "No existe $ZIP_PATH. Sube primero el ZIP como /opt/labonita-release.zip" >&2
  exit 1
fi

apt update
apt install -y nginx unzip curl ca-certificates

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

npm install -g pm2

mkdir -p "$APP_DIR"
unzip -o "$ZIP_PATH" -d "$APP_DIR"

cd "$APP_DIR/backend"
if [[ -f /root/labonita_backend.env && ! -f .env ]]; then
  cp /root/labonita_backend.env .env
  chmod 600 .env
fi
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Creado $APP_DIR/backend/.env desde .env.example."
  echo "Edita .env con secretos reales antes de iniciar en modo live." >&2
  exit 2
fi

npm ci --omit=dev
if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  npm run bootstrap-admin -- "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
fi

pm2 delete labonita-backend >/dev/null 2>&1 || true
pm2 start server.js --name labonita-backend --cwd "$APP_DIR/backend"
pm2 save

sleep 2
curl -fsSI http://127.0.0.1:3001/login.html >/dev/null

cat >/etc/nginx/sites-available/labonita.coop <<NGINX
server {
  listen 80;
  server_name ${DOMAIN} www.${DOMAIN};

  client_max_body_size 25m;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX

ln -sf /etc/nginx/sites-available/labonita.coop /etc/nginx/sites-enabled/labonita.coop
nginx -t
systemctl reload nginx

echo "Deploy base listo en http://${DOMAIN}. Para HTTPS: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
