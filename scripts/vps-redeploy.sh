#!/bin/bash
# Pull latest code, set production HTTPS URLs, rebuild, and fix SEO settings in DB.
set -euo pipefail

APP_DIR="/var/www/visitagadir"
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

npm run build
cp -f .env .next/standalone/.env
pm2 restart visitagadir

# Patch SEO settings via admin API when server is back up.
sleep 5
curl -s -c /tmp/admin_cookies.txt -X POST "${SITE_URL}/api/admin/login" \
  -H 'Content-Type: application/json' \
  -d '{"password":"'"${ADMIN_PASSWORD:-agadir2024}"'"}' > /dev/null

curl -s -b /tmp/admin_cookies.txt -X PUT "${SITE_URL}/api/admin/seo/general" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<EOF
{
  "siteUrl": "${SITE_URL}",
  "canonicalDomain": "${SITE_URL}",
  "titleTemplate": "%s · Agadir Directory"
}
EOF
)" > /dev/null

echo "Redeploy complete. SEO siteUrl/canonical/titleTemplate updated."
