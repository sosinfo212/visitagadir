#!/bin/bash
# Pull latest code, build, sync env/uploads, restart PM2 (standalone).
set -euo pipefail

APP_DIR="/var/www/visitagadir"
STANDALONE="$APP_DIR/.next/standalone"
SITE_URL="https://visitagadir.info"

cd "$APP_DIR"
git pull origin main

# Ensure production env uses the public HTTPS domain (not raw IP).
if grep -q '^NEXTAUTH_URL=' .env; then
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"${SITE_URL}\"|" .env
else
  echo "NEXTAUTH_URL=\"${SITE_URL}\"" >> .env
fi

if grep -q '^NEXT_PUBLIC_SITE_URL=' .env; then
  sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"${SITE_URL}\"|" .env
else
  echo "NEXT_PUBLIC_SITE_URL=\"${SITE_URL}\"" >> .env
fi

if ! grep -q '^EXTENSION_API_KEY=' .env; then
  EXT_KEY="agadir-ext-$(openssl rand -hex 16)"
  echo "EXTENSION_API_KEY=\"${EXT_KEY}\"" >> .env
  echo "Added EXTENSION_API_KEY to .env — copy this into the Chrome extension:"
  grep '^EXTENSION_API_KEY=' .env
fi

UPLOAD_ROOT="/var/www/visitagadir/public/uploads"
if grep -q '^UPLOAD_ROOT=' .env; then
  sed -i "s|^UPLOAD_ROOT=.*|UPLOAD_ROOT=\"${UPLOAD_ROOT}\"|" .env
else
  echo "UPLOAD_ROOT=\"${UPLOAD_ROOT}\"" >> .env
fi

npm install
npx prisma generate
npm run build

cp -f .env "$STANDALONE/.env"
mkdir -p "$UPLOAD_ROOT"/blog "$UPLOAD_ROOT"/listings/imported "$UPLOAD_ROOT"/blog/imported
# Merge any uploads written under standalone back into the persistent store
rsync -a "$STANDALONE/public/uploads/" "$UPLOAD_ROOT/" 2>/dev/null || true
rsync -a "$UPLOAD_ROOT/" "$STANDALONE/public/uploads/" 2>/dev/null || true

# Nginx serves /uploads/ directly from disk
cp -f "$APP_DIR/scripts/nginx-visitagadir.conf" /etc/nginx/sites-available/visitagadir
ln -sf /etc/nginx/sites-available/visitagadir /etc/nginx/sites-enabled/visitagadir
nginx -t && systemctl reload nginx

pm2 delete visitagadir 2>/dev/null || true
cd "$STANDALONE"
# Cluster mode: one worker per CPU core so SSR + API + next/image no longer
# bottleneck on a single core under concurrency.
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production pm2 start server.js --name visitagadir -i max --max-memory-restart 1500M
pm2 save

sleep 5
pm2 status
curl -sI http://127.0.0.1:3000 | head -5 || true

# Patch SEO settings via admin API when server is back up.
ADMIN_PASSWORD="$(grep '^ADMIN_PASSWORD=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '"')"
if [ -n "$ADMIN_PASSWORD" ]; then
  curl -s -c /tmp/admin_cookies.txt -X POST "${SITE_URL}/api/admin/login" \
    -H 'Content-Type: application/json' \
    -d "{\"password\":\"${ADMIN_PASSWORD}\"}" > /dev/null || true

  curl -s -b /tmp/admin_cookies.txt -X PUT "${SITE_URL}/api/admin/seo/general" \
    -H 'Content-Type: application/json' \
    -d "$(cat <<EOF
{
  "siteUrl": "${SITE_URL}",
  "canonicalDomain": "${SITE_URL}",
  "titleTemplate": "%s · Agadir Directory"
}
EOF
)" > /dev/null || true
fi

echo "Redeploy complete."
